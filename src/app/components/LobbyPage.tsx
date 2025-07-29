import React from 'react';
import { Users, Copy, Crown } from 'lucide-react';
import type { LobbyData } from '../types';

interface LobbyPageProps {
    lobbyData: LobbyData | null;
    isHost: boolean;
    onStartGame: () => void;
}

export default function LobbyPage({ lobbyData, isHost, onStartGame }: LobbyPageProps) {
    const copyLobbyCode = () => {
        const lobbyId = lobbyData?.id;
        if (!lobbyId) return;
        // Copy only the lobby ID
        navigator.clipboard.writeText(lobbyId).then(() => {
            // Update the confirmation message
            alert(`Lobby Code "${lobbyId}" copied to clipboard!`);
        });
    };
    
    if (!lobbyData) return <div className="text-center text-xl text-white/80">Loading lobby...</div>;

    return (
        <div className="glass-container p-8 max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-true-blue text-center mb-6">Lobby</h2>
            <div className="mb-6 bg-black/30 border border-white/20 p-4 rounded-lg flex items-center justify-between">
                <div>
                    <span className="text-white/80">Lobby Code: <span className="text-white font-bold tracking-widest">{lobbyData.id}</span></span>
                    <p className="text-white/60 text-sm">Share this code or the page URL for friends to join.</p>
                </div>
                <button onClick={copyLobbyCode} className="btn btn-secondary" title="Copy Lobby Code"><Copy size={18} /></button>
            </div>

            <div className="mb-4">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-white/80"><Crown className="text-true-blue" /> Host</h3>
                {lobbyData.host && (
                     <div className="bg-black/30 p-4 rounded-lg">
                        <span className="font-semibold text-white">{lobbyData.host.name} {isHost && <span className="text-white/60">(You)</span>}</span>
                    </div>
                )}
            </div>

            <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white/80"><Users size={22} /> Players ({lobbyData.players.length})</h3>
                <div className="space-y-3">
                    {lobbyData.players.length > 0 ? (
                        lobbyData.players.map(player => (
                            <div key={player.id} className="bg-black/30 p-4 rounded-lg">
                                <span className="font-semibold text-white">{player.name}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-white/50 text-center py-4">Waiting for players to join...</p>
                    )}
                </div>
            </div>
            
            <div className="text-center">
                {isHost ? (
                    <button onClick={onStartGame} disabled={lobbyData.players.length < 1} className="btn btn-primary w-full max-w-xs mx-auto">
                        Start Race
                    </button>
                ) : (
                    <p className="text-white/60">Waiting for the host to start the race...</p>
                )}
                {isHost && lobbyData.players.length < 1 && <p className="text-true-blue/70 text-sm mt-3">Waiting for at least one player to join...</p>}
            </div>
        </div>
    );
}