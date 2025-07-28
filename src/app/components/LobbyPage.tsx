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
        const urlToCopy = `${window.location.origin}?lobby=${lobbyId}`;
        navigator.clipboard.writeText(urlToCopy).then(() => {
            alert(`Lobby URL copied to clipboard!\nShare this with your friends.`);
        });
    };
    
    if (!lobbyData) return <div className="text-center text-xl">Loading lobby...</div>;

    return (
        <div className="bg-gray-800 p-8 rounded-lg shadow-2xl animate-fade-in max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-cyan-400 text-center mb-6">Lobby</h2>
            <div className="mb-6 bg-gray-900 p-4 rounded-lg flex items-center justify-between">
                <div>
                    <span className="text-gray-400">Lobby Code: <span className="text-white font-bold">{lobbyData.id}</span></span>
                    <p className="text-gray-400 text-sm">Share this code or the URL with friends.</p>
                </div>
                <button onClick={copyLobbyCode} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md" title="Copy join URL"><Copy size={18} /></button>
            </div>

            {/* Host Display */}
            <div className="mb-4">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Crown className="text-yellow-400" /> Host</h3>
                {lobbyData.host && (
                     <div className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
                        <span className="font-semibold">{lobbyData.host.name} {isHost && "(You)"}</span>
                    </div>
                )}
            </div>

            {/* Players Display */}
            <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Users size={22} /> Players ({lobbyData.players.length})</h3>
                <div className="space-y-3">
                    {lobbyData.players.length > 0 ? (
                        lobbyData.players.map(player => (
                            <div key={player.id} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
                                <span className="font-semibold">{player.name}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-4">Waiting for players to join...</p>
                    )}
                </div>
            </div>
            
            <div className="text-center">
                {isHost ? (
                    <button onClick={onStartGame} disabled={lobbyData.players.length < 1} className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed">
                        Start Race
                    </button>
                ) : (
                    <p className="text-gray-400">Waiting for the host to start the race...</p>
                )}
                {isHost && lobbyData.players.length < 1 && <p className="text-yellow-400 text-sm mt-3">Waiting for at least one player to join...</p>}
            </div>
        </div>
    );
}