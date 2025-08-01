'use client'
import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { ArrowRight, Rocket } from 'lucide-react';

interface HomePageProps {
    onCreateLobby: () => void;
    onJoinLobby: (code: string) => void;
    playerName: string;
    setPlayerName: Dispatch<SetStateAction<string>>;
    error: string;
    setError: Dispatch<SetStateAction<string>>;
}

export default function HomePage({ onCreateLobby, onJoinLobby, playerName, setPlayerName, error, setError }: HomePageProps) {
    const [joinCode, setJoinCode] = useState('');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const lobbyIdFromUrl = urlParams.get('lobby');
        if (lobbyIdFromUrl) setJoinCode(lobbyIdFromUrl);
    }, []);

    const handleJoinSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onJoinLobby(joinCode);
    };

    return (
        <div className="glass-container p-8 max-w-3xl mx-auto animate-fade-in">
            {error && <div className="bg-white/10 border border-red-500 text-red-300 p-3 rounded-lg mb-6 text-center">{error}</div>}
            <div className="mb-6">
                <label htmlFor="playerName" className="block text-lg font-bold mb-2 text-center text-white/80">Enter Your Name</label>
                <input
                    id="playerName"
                    type="text"
                    value={playerName}
                    onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
                    placeholder="Racer Name"
                    className="w-full max-w-sm mx-auto block bg-black/30 text-white placeholder-white/40 p-3 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-true-blue text-center tracking-widest"
                />
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                <div className="flex-1 text-center">
                    <h2 className="text-2xl font-bold mb-4">Join a Race</h2>
                    <form onSubmit={handleJoinSubmit} className="flex flex-col sm:flex-row gap-3">
                        <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="ACM..." className="flex-grow bg-black/30 text-white placeholder-white/40 p-3 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-true-blue text-center tracking-widest" maxLength={6} />
                        <button type="submit" className="btn btn-secondary">
                            Join
                        </button>
                    </form>
                </div>
                <div className="w-full md:w-px h-px md:h-24 bg-white/10"></div>
                <div className="flex-1 text-center">
                    <h2 className="text-2xl font-bold mb-4">Create a Race</h2>
                    <button onClick={onCreateLobby} className="btn btn-primary w-full">
                        Create Lobby
                    </button>
                </div>
            </div>
        </div>
    );
}