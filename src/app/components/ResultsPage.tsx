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
        <div className="glass-container p-8 max-w-2xl mx-auto animate-fade-in text-center">
            <h2 className="text-4xl font-bold text-true-blue mb-2">Race Finished!</h2>
            {lobbyData?.winner && (
                <p className="text-xl mb-6 text-white">
                    <span className="font-bold text-true-blue">{lobbyData.winner.name}</span> wins the race!
                </p>
            )}
            <div className="space-y-4 my-8">
                {sortedPlayers.map((player, index) => (
                    <div key={player.id} className="bg-black/30 border border-white/10 p-4 rounded-lg flex items-center justify-between text-left">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl font-bold w-8 text-white/60">{index + 1}.</span>
                            <div>
                                <p className="font-semibold text-lg text-white">{player.name}</p>
                                <p className="text-sm text-white/50">Progress: {player.progress.toFixed(0)}%</p>
                            </div>
                        </div>
                        <div className="flex gap-6 text-center">
                            <div>
                                <p className="text-white/60 text-xs">WPM</p>
                                <p className="text-xl font-bold text-white">{player.wpm}</p>
                            </div>
                            <div>
                                <p className="text-white/60 text-xs">Accuracy</p>
                                <p className="text-xl font-bold text-true-blue">{player.accuracy.toFixed(1)}%</p>
                            </div>
                        </div>
                        {index === 0 && <Crown className="text-true-blue" size={28} />}
                    </div>
                ))}
            </div>
            <button onClick={onReset} className="btn btn-primary">Play Again</button>
        </div>
    );
}