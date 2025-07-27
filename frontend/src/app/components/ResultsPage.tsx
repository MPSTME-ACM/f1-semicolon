import React, { useMemo } from 'react';
import { Crown } from 'lucide-react';
import type { LobbyData } from '../types';

interface ResultsPageProps {
    lobbyData: LobbyData | null;
    onReset: () => void;
}

export default function ResultsPage({ lobbyData, onReset }: ResultsPageProps) {
    const sortedPlayers = useMemo(() => {
        if (!lobbyData?.players) return [];
        return [...lobbyData.players].sort((a, b) => b.wpm - a.wpm);
    }, [lobbyData?.players]);

    return (
        <div className="bg-gray-800 p-8 rounded-lg shadow-2xl animate-fade-in text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-cyan-400 mb-2">Race Finished!</h2>
            {lobbyData?.winner && <p className="text-xl mb-6"><span className="font-bold text-yellow-400">{lobbyData.winner.name}</span> wins the race!</p>}
            <div className="space-y-4 my-8">
                {sortedPlayers.map((player, index) => (
                    <div key={player.id} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between text-left">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl font-bold w-8">{index + 1}.</span>
                            <div>
                                <p className="font-semibold text-lg">{player.name}</p>
                                <p className="text-sm text-gray-400">Progress: {player.progress.toFixed(0)}%</p>
                            </div>
                        </div>
                        <div className="flex gap-6 text-center">
                            <div><p className="text-gray-400 text-xs">WPM</p><p className="text-xl font-bold text-cyan-400">{player.wpm}</p></div>
                            <div><p className="text-gray-400 text-xs">Accuracy</p><p className="text-xl font-bold text-green-400">{player.accuracy.toFixed(1)}%</p></div>
                        </div>
                        {index === 0 && <Crown className="text-yellow-400" size={28} />}
                    </div>
                ))}
            </div>
            <button onClick={onReset} className="bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold py-3 px-8 rounded-lg shadow-lg">Play Again</button>
        </div>
    );
}