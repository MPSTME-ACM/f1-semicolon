import * as dotenv from 'dotenv';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import type { Player, LobbyData } from './src/app/types';
import { TRACK_DATA, TrackId } from './src/app/tracks.js';
import { TEXT_SAMPLES } from './src/app/components/TextSamples.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const lobbies = new Map<string, LobbyData>();

// --- NEW: Custom Room ID Generator ---
const generateLobbyId = (): string => {
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ACM${randomPart}`;
};

// Helper function to get an available paragraph for a new player
function getAvailableParagraph(lobby: LobbyData): string {
  const assignedTexts = lobby.players.map(p => p.textToType);
  let availableSamples = TEXT_SAMPLES.filter(sample => !assignedTexts.includes(sample));

  // If all unique samples are used, just pick any random one
  if (availableSamples.length === 0) {
    availableSamples = TEXT_SAMPLES;
  }

  return availableSamples[Math.floor(Math.random() * availableSamples.length)];
}

function calculateServerAccuracy(originalText: string, typedText: string): number {
    let correctChars = 0;
    for (let i = 0; i < originalText.length; i++) {
        if (typedText[i] && typedText[i] === originalText[i]) {
            correctChars++;
        }
    }
    return (correctChars / originalText.length) * 100;
}

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

    socket.on('create-lobby', (playerName: string, callback: (payload: { lobbyId: string; lobbyData: LobbyData }) => void) => {
      const lobbyId = generateLobbyId();
      socket.join(lobbyId);

      const hostPlayer: Player = { id: socket.id, name: playerName, progress: 0, wpm: 0, accuracy: 100, textToType: '' };

      const newLobby: LobbyData = {
        id: lobbyId,
        host: hostPlayer,
        players: [],
        trackId: 'track1',
        gameState: 'waiting',
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
        const newPlayer: Player = {
          id: socket.id,
          name: playerName,
          progress: 0,
          wpm: 0,
          accuracy: 100,
          textToType: getAvailableParagraph(lobby)
        };
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

    socket.on('player-update', ({ lobbyId, playerUpdate }) => {
        const lobby = lobbies.get(lobbyId);
        if (lobby) {
            lobby.players = lobby.players.map(p => p.id === socket.id ? { ...p, ...playerUpdate } : p);

            // The winner is now determined by the 'submit-final-text' event
            const allFinished = lobby.players.every(p => p.progress >= 100);
            if (allFinished && lobby.players.length > 0) {
                lobby.gameState = 'finished';
            }
            io.to(lobbyId).emit('lobby-updated', lobby);
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

        socket.on('submit-final-text', ({ lobbyId, finalInput }: { lobbyId: string, finalInput: string }) => {
        const lobby = lobbies.get(lobbyId);
        const player = lobby?.players.find(p => p.id === socket.id);

        if (lobby && player && !lobby.winner) {
            const serverAccuracy = calculateServerAccuracy(player.textToType, finalInput);
            
            // A player must have at least 70% accuracy to win
            const MIN_ACCURACY_TO_WIN = 70; 

            if (serverAccuracy >= MIN_ACCURACY_TO_WIN) {
                lobby.winner = player;
                console.log(`${player.name} finished with a valid accuracy of ${serverAccuracy.toFixed(1)}% and is the winner!`);
                io.to(lobbyId).emit('lobby-updated', lobby);
            } else {
                console.log(`${player.name} finished with an invalid accuracy of ${serverAccuracy.toFixed(1)}%. Not a winner.`);
            }
        }
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