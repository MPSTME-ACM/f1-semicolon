import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import type { Player, LobbyData } from './src/app/types';

const dev = process.env.NODE_ENV !== 'production';
// CHANGE: Listen on '0.0.0.0' to accept connections from any IP address, not just localhost.
const hostname = '0.0.0.0'; 
const port = 3000;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const TEXT_SAMPLES: string[] = [
    "The quick brown fox jumps over the lazy dog. This sentence contains all the letters of the alphabet. Speed and accuracy are key to winning this race.",
    "Formula 1 is the pinnacle of motorsport, featuring the world's best drivers and most advanced racing technology. A single mistake can cost you the race.",
    "To be a great programmer is to become a problem-solver. You must learn to think algorithmically and break down complex problems into smaller, manageable parts."
];

const lobbies = new Map<string, LobbyData>();

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
    
    // --- Lobby Management ---
    socket.on('create-lobby', (playerName: string, callback: (payload: { lobbyId: string; lobbyData: LobbyData }) => void) => {
      const lobbyId = Math.random().toString(36).substring(2, 7).toUpperCase();
      socket.join(lobbyId);
      
      const newPlayer: Player = { id: socket.id, name: playerName, isHost: true, progress: 0, wpm: 0, accuracy: 100 };
      
      const newLobby: LobbyData = {
        id: lobbyId,
        players: [newPlayer],
        gameState: 'waiting',
        textToType: TEXT_SAMPLES[Math.floor(Math.random() * TEXT_SAMPLES.length)],
        startTime: null,
        winner: null,
      };
      lobbies.set(lobbyId, newLobby);

      callback({ lobbyId, lobbyData: newLobby });
    });

    socket.on('join-lobby', ({ lobbyId, playerName }: { lobbyId: string; playerName: string }, callback: (payload: { lobbyData?: LobbyData; error?: string }) => void) => {
      const lobby = lobbies.get(lobbyId);
      if (lobby) {
        if (lobby.players.length >= 4) {
          callback({ error: 'Lobby is full.' });
          return;
        }
        if (lobby.gameState !== 'waiting') {
          callback({ error: 'Race has already started.' });
          return;
        }

        socket.join(lobbyId);
        const newPlayer: Player = { id: socket.id, name: playerName, isHost: false, progress: 0, wpm: 0, accuracy: 100 };
        lobby.players.push(newPlayer);
        
        io.to(lobbyId).emit('lobby-updated', lobby);
        callback({ lobbyData: lobby });
      } else {
        callback({ error: 'Lobby not found.' });
      }
    });

    // --- Game Logic ---
    socket.on('start-game', (lobbyId: string) => {
      const lobby = lobbies.get(lobbyId);
      if (lobby && lobby.players.find(p => p.id === socket.id)?.isHost) {
        lobby.gameState = 'in-progress';
        lobby.startTime = new Date().toISOString();
        io.to(lobbyId).emit('game-started', lobby);
      }
    });

    socket.on('player-update', ({ lobbyId, playerUpdate }: { lobbyId: string; playerUpdate: Partial<Player> }) => {
      const lobby = lobbies.get(lobbyId);
      if (lobby) {
        lobby.players = lobby.players.map(p => {
            if (p.id === socket.id) {
                const updated = { ...p, ...playerUpdate };
                if (updated.progress >= 100 && !lobby.winner) {
                    lobby.winner = updated;
                }
                return updated;
            }
            return p;
        });
        
        const allFinished = lobby.players.every(p => p.progress >= 100);
        if (allFinished) {
            lobby.gameState = 'finished';
        }
        io.to(lobbyId).emit('lobby-updated', lobby);
      }
    });

    // --- Disconnect Handling ---
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      for (const [lobbyId, lobby] of lobbies.entries()) {
        const playerIndex = lobby.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          const wasHost = lobby.players[playerIndex].isHost;
          lobby.players.splice(playerIndex, 1);

          if (lobby.players.length === 0) {
            lobbies.delete(lobbyId);
            console.log(`Lobby ${lobbyId} closed.`);
          } else {
            if (wasHost && lobby.players.length > 0) {
              lobby.players[0].isHost = true;
            }
            io.to(lobbyId).emit('lobby-updated', lobby);
          }
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
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});