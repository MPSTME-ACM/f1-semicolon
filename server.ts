import * as dotenv from 'dotenv';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import type { Player, LobbyData } from './src/app/types';
import { TRACK_DATA, TrackId } from './src/app/tracks.js';

// Load environment variables from the .env file
dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const FALLBACK_TEXT = "The quick brown fox jumps over the lazy dog. This is a fallback text in case the API fails.";

// Define a fixed target length for all race paragraphs
const TARGET_LENGTH = 240;
// To be safe, fetch a quote that is slightly longer than our target
const MIN_FETCH_LENGTH = 260;

async function fetchTextToType(): Promise<string> {
  const apiKey = process.env.API_NINJAS_KEY;

  if (!apiKey) {
    console.error("API_NINJAS_KEY not found in the .env file. Using fallback text.");
    return FALLBACK_TEXT;
  }

  // Fetch a quote that is guaranteed to be long enough for us to trim
  const url = `https://api.api-ninjas.com/v1/quotes?min_length=${MIN_FETCH_LENGTH}`;

  try {
    const response = await fetch(url, {
      headers: { 'X-Api-Key': apiKey },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API call failed with status: ${response.status}`, errorBody);
      return FALLBACK_TEXT;
    }

    const data: { quote: string }[] = await response.json();

    if (data.length > 0 && data[0].quote) {
      let text = data[0].quote;

      while (text.length < TARGET_LENGTH) {
        text += " " + text;
      }

      // 2. Trim to exact target length
      text = text.substring(0, TARGET_LENGTH);

      // 3. Find the last space to avoid cutting off a word mid-sentence
      const lastSpaceIndex = text.lastIndexOf(' ');
      if (lastSpaceIndex > TARGET_LENGTH - 50) { // Only trim if we're not cutting too much
        text = text.substring(0, lastSpaceIndex);
      }

      // 3. Ensure the text ends cleanly with a period
      if (!text.endsWith('.')) {
        text += '.';
      }

      return text;
    } else {
      console.warn("API returned no quotes matching the criteria. Using fallback.");
      return FALLBACK_TEXT;
    }
  } catch (error) {
    console.error("Failed to fetch text from API. Check your network connection or API key.", error);
    return FALLBACK_TEXT;
  }
}

const lobbies = new Map<string, LobbyData>();

// --- NEW: Custom Room ID Generator ---
const generateLobbyId = (): string => {
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ACM${randomPart}`;
};

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request', err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer);

  io.on('connection', socket => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('create-lobby', async (playerName: string, callback: (payload: { lobbyId: string; lobbyData: LobbyData }) => void) => {
      const lobbyId = generateLobbyId();
      socket.join(lobbyId);

      const hostPlayer: Player = { id: socket.id, name: playerName, progress: 0, wpm: 0, accuracy: 100 };

      // ✨ Fetch a new random paragraph for this lobby
      const textToType = await fetchTextToType();

      const newLobby: LobbyData = {
        id: lobbyId,
        host: hostPlayer,
        players: [],
        trackId: 'track1',
        gameState: 'waiting',
        textToType: textToType, // Use the dynamically fetched text
        startTime: null,
        winner: null,
      };

      lobbies.set(lobbyId, newLobby);
      callback({ lobbyId, lobbyData: newLobby });
    });

    socket.on('select-track', ({ lobbyId, trackId }: { lobbyId: string; trackId: TrackId }) => {
      const lobby = lobbies.get(lobbyId);
      // Only the host can change the track
      if (lobby && lobby.host?.id === socket.id) {
        // Validate that the trackId is one of the available tracks
        if (Object.keys(TRACK_DATA).includes(trackId)) {
          lobby.trackId = trackId;
          io.to(lobbyId).emit('lobby-updated', lobby);
        }
      }
    });

    socket.on('join-lobby', ({ lobbyId, playerName }: { lobbyId: string; playerName: string }, callback: (payload: { lobbyData?: LobbyData; error?: string }) => void) => {
      const lobby = lobbies.get(lobbyId);
      if (lobby) {
        // --- REMOVED: Player limit check ---
        if (lobby.gameState !== 'waiting') {
          callback({ error: 'Race has already started.' });
          return;
        }

        socket.join(lobbyId);
        const newPlayer: Player = { id: socket.id, name: playerName, progress: 0, wpm: 0, accuracy: 100 };
        lobby.players.push(newPlayer); // Add the new person to the players array

        io.to(lobbyId).emit('lobby-updated', lobby);
        callback({ lobbyData: lobby });
      } else {
        callback({ error: 'Lobby not found.' });
      }
    });

    socket.on('start-game', (lobbyId: string) => {
      const lobby = lobbies.get(lobbyId);
      // Check if the person starting the game is the host
      if (lobby && lobby.host?.id === socket.id) {
        lobby.gameState = 'in-progress';
        lobby.startTime = new Date().toISOString();
        io.to(lobbyId).emit('game-started', lobby);
      }
    });

    socket.on('player-update', ({ lobbyId, playerUpdate }: { lobbyId: string; playerUpdate: Partial<Player> }) => {
      const lobby = lobbies.get(lobbyId);
      if (lobby) {
        // Update the player in the players array
        lobby.players = lobby.players.map(p => {
          if (p.id === socket.id) {
            const updatedPlayer = { ...p, ...playerUpdate };
            if (updatedPlayer.progress >= 100 && !lobby.winner) {
              lobby.winner = updatedPlayer;
            }
            return updatedPlayer;
          }
          return p;
        });

        // Check if all *players* (not the host) have finished
        const allFinished = lobby.players.every(p => p.progress >= 100);
        if (allFinished && lobby.players.length > 0) {
          lobby.gameState = 'finished';
        }
        io.to(lobbyId).emit('lobby-updated', lobby);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      for (const [lobbyId, lobby] of lobbies.entries()) {
        // If the host disconnects, close the entire lobby
        if (lobby.host?.id === socket.id) {
          io.to(lobbyId).emit('lobby-closed'); // Notify all clients
          lobbies.delete(lobbyId);
          console.log(`Host disconnected. Lobby ${lobbyId} closed.`);
          break;
        }

        // If a player disconnects, just remove them from the players array
        const playerIndex = lobby.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          lobby.players.splice(playerIndex, 1);
          io.to(lobbyId).emit('lobby-updated', lobby);
          break;
        }
      }
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`);
    });
});