import React from 'react';
import { Users, Copy, Crown } from 'lucide-react';
import type { LobbyData } from '../types';
import { TRACK_DATA, TrackId } from '../tracks';

interface LobbyPageProps {
    lobbyData: LobbyData | null;
    isHost: boolean;
    onStartGame: () => void;
    onSelectTrack: (trackId: TrackId) => void;
}

// This sub-component is now simplified, as it will only ever be rendered for the host.
function TrackSelector({ lobbyData, onSelectTrack }: { lobbyData: LobbyData; onSelectTrack: (trackId: TrackId) => void }) {
    return (
        <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-white/80 text-center">Select a Track</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.keys(TRACK_DATA) as TrackId[]).map((trackId) => {
                    const track = TRACK_DATA[trackId];
                    const isSelected = lobbyData.trackId === trackId;

                    return (
                        <button
                            key={trackId}
                            onClick={() => onSelectTrack(trackId)}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:border-true-blue ${
                                isSelected ? 'border-true-blue bg-true-blue/20' : 'border-white/20 bg-black/30'
                            }`}
                        >
                            <svg className="w-full h-20" viewBox={track.viewBox}>
                                <path d={track.path} fill="none" stroke="white" strokeWidth="10" />
                            </svg>
                            <p className="mt-2 font-semibold text-white">{track.name}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function LobbyPage({ lobbyData, isHost, onStartGame, onSelectTrack }: LobbyPageProps) {
    const copyLobbyCode = () => {
        const lobbyId = lobbyData?.id;
        if (!lobbyId) return;
        navigator.clipboard.writeText(lobbyId).then(() => {
            alert(`Lobby Code "${lobbyId}" copied to clipboard!`);
        });
    };
    
    if (!lobbyData) return <div className="text-center text-xl text-white/80">Loading lobby...</div>;

    return (
        <div className="glass-container p-8 max-w-4xl mx-auto animate-fade-in">
            {/* Lobby Code, Host, and Players sections remain unchanged */}
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
            
            {/* Conditionally render the TrackSelector ONLY for the host */}
            {isHost && (
                <TrackSelector lobbyData={lobbyData} onSelectTrack={onSelectTrack} />
            )}
            
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