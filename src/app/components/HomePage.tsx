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
        if (lobbyIdFromUrl) {
            setJoinCode(lobbyIdFromUrl);
        }
    }, []);

    const handleJoinSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onJoinLobby(joinCode);
    };

    return (
        <div className="bg-gray-800 p-8 rounded-lg shadow-2xl max-w-3xl mx-auto animate-fade-in">
            {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg mb-6 text-center">{error}</div>}
            <div className="mb-6">
                <label htmlFor="playerName" className="block text-lg font-bold mb-2 text-center">Enter Your Name</label>
                <input
                    id="playerName"
                    type="text"
                    value={playerName}
                    onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
                    placeholder="Your Name"
                    className="w-full max-w-sm mx-auto block bg-gray-700 text-white placeholder-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-center"
                />
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                 <div className="flex-1 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Create a Race</h2>
                    <button onClick={onCreateLobby} className="w-full bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2">
                        <Rocket size={20} /> Create Lobby
                    </button>
                </div>
                <div className="w-full md:w-px h-px md:h-32 bg-gray-600"></div>
                <div className="flex-1 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Join a Race</h2>
                    <form onSubmit={handleJoinSubmit} className="flex flex-col sm:flex-row gap-3">
                        <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Lobby Code" className="flex-grow bg-gray-700 text-white placeholder-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" maxLength={5} />
                        <button type="submit" className="bg-red-500 hover:bg-red-400 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2">
                            <ArrowRight size={20} /> Join
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}