import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import type { Player, LobbyData } from './src/app/types';

const dev = false;
const hostname = '0.0.0.0'; 
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const TEXT_SAMPLES: string[] = [
    "The quick brown fox jumps over the lazy dog. This sentence contains all the letters of the alphabet. Speed and accuracy are key to winning this race.",
    "Formula 1 is the pinnacle of motorsport, featuring the world's best drivers and most advanced racing technology. A single mistake can cost you the race.",
    "To be a great programmer is to become a problem-solver. You must learn to think algorithmically and break down complex problems into smaller, manageable parts."
];

const lobbies = new Map<string, LobbyData>();

// --- NEW: Custom Room ID Generator ---
const generateLobbyId = (): string => {
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ACM-${randomPart}`;
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
    
    socket.on('create-lobby', (playerName: string, callback: (payload: { lobbyId: string; lobbyData: LobbyData }) => void) => {
      const lobbyId = generateLobbyId(); // Use the new generator
      socket.join(lobbyId);
      
      const hostPlayer: Player = { id: socket.id, name: playerName, progress: 0, wpm: 0, accuracy: 100 };
      
      const newLobby: LobbyData = {
        id: lobbyId,
        host: hostPlayer, // Assign the creator as the host
        players: [], // The players array starts empty
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
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});