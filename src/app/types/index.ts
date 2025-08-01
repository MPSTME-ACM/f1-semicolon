export interface Player {
    id: string;
    name: string;
    progress: number;
    wpm: number;
    accuracy: number;
    textToType: string;
}

export interface LobbyData {
    id: string;
    host: Player | null;
    players: Player[];
    gameState: 'waiting' | 'in-progress' | 'finished';
    startTime: string | null;
    winner: Player | null;
    trackId: string;
}