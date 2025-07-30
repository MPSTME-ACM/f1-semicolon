import React from 'react';
import { Users, Copy, Crown } from 'lucide-react';
import QRCode from 'react-qr-code';
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
                            className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:border-true-blue ${isSelected ? 'border-true-blue bg-true-blue/20' : 'border-white/20 bg-black/30'
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

    const lobbyUrl = typeof window !== 'undefined'
        ? `${window.location.origin}?lobby=${lobbyData.id}`
        : '';

    return (
        <div className="glass-container p-8 max-w-7xl mx-auto animate-fade-in flex flex-col md:flex-row gap-8">

            {/* --- Left Column --- */}
            <div className="w-full md:w-3/4">
                <h2 className="text-3xl font-bold text-true-blue text-center mb-6">Lobby</h2>

                {/* Host and Players sections */}
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

                {/* Track Selector (only for host) */}
                {isHost && (
                    <TrackSelector lobbyData={lobbyData} onSelectTrack={onSelectTrack} />
                )}

                {/* Start Game Button / Waiting Text */}
                <div className="text-center mt-8">
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

            {/* --- Right Column --- */}
            <div className="w-full md:w-1/3 flex flex-col items-center justify-center bg-black/30 p-6 rounded-lg border border-white/20">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Lobby Code</h3>
                    <p className="text-3xl font-bold tracking-widest text-true-blue mb-6">{lobbyData.id}</p>
                    <h3 className="text-xl font-bold text-white mb-4">Scan to Join</h3>
                    <div className="bg-white p-3 rounded-lg inline-block">
                        <QRCode
                            value={lobbyUrl}
                            size={320} // Increased size by 100% (from 160 to 320)
                            bgColor="#FFFFFF"
                            fgColor="#000000"
                            level="L"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}