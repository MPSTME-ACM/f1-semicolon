export interface Player {
  id: string; // This is the socket.id
  name: string;
  // isHost is no longer needed here
  progress: number;
  wpm: number;
  accuracy: number;
}

export interface LobbyData {
  id: string;
  host: Player | null; // The host is now a separate entity
  players: Player[]; // This array only contains the racers
  gameState: 'waiting' | 'in-progress' | 'finished';
  textToType: string;
  startTime: string | null;
  winner: Player | null;
}

export interface LobbyData {
    id: string;
    host: Player | null;
    players: Player[];
    gameState: 'waiting' | 'in-progress' | 'finished';
    textToType: string;
    startTime: string | null;
    winner: Player | null;
    trackId: string; // Add this line
}