export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  progress: number;
  wpm: number;
  accuracy: number;
}

export interface LobbyData {
  id: string;
  players: Player[];
  gameState: 'waiting' | 'in-progress' | 'finished';
  textToType: string;
  startTime: string | null;
  winner: Player | null;
}