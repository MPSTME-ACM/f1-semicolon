"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import HomePage from './components/HomePage';
import LobbyPage from './components/LobbyPage';
import GamePage from './components/GamePage';
import ResultsPage from './components/ResultsPage';
import type { LobbyData, Player } from './types';

let socket: Socket;

export default function App() {
    const [page, setPage] = useState<'home' | 'lobby' | 'game' | 'results'>('home');
    const [lobbyData, setLobbyData] = useState<LobbyData | null>(null);
    const [error, setError] = useState<string>('');
    const [playerName, setPlayerName] = useState<string>('');
    const [socketId, setSocketId] = useState<string | null>(null);

    const isHost = useMemo(() => {
        if (!lobbyData || !socketId) return false;
        return lobbyData.host?.id === socketId;
    }, [lobbyData, socketId]);

    // FIX: This logic now correctly handles the case where `lobbyData.host` can be null,
    // resolving the TypeScript error.
    const me = useMemo<Player | undefined>(() => {
        if (!lobbyData || !socketId) return undefined;
        if (isHost) {
            return lobbyData.host ?? undefined;
        }
        return lobbyData.players.find(p => p.id === socketId);
    }, [lobbyData, socketId, isHost]);


    useEffect(() => {
        socket = io();

        socket.on('connect', () => {
            if (socket.id) {
                console.log('Connected to socket server with id:', socket.id);
                setSocketId(socket.id);
            }
        });
        
        socket.on('lobby-updated', (data: LobbyData) => {
            setLobbyData(data);
            if (data.gameState === 'finished') {
                setPage('results');
            }
        });
        
        socket.on('game-started', (data: LobbyData) => {
            setLobbyData(data);
            setPage('game');
        });

        socket.on('lobby-closed', () => {
            alert("The host has disconnected. The lobby is now closed.");
            handleReset();
        });

        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    const handleCreateLobby = () => {
        if (!playerName.trim()) {
            setError("Please enter your name.");
            return;
        }
        socket.emit('create-lobby', playerName, ({ lobbyId, lobbyData }: { lobbyId: string; lobbyData: LobbyData }) => {
            setLobbyData(lobbyData);
            window.history.pushState({}, '', `?lobby=${lobbyId}`);
            setPage('lobby');
        });
    };

    const handleJoinLobby = (code: string) => {
        if (!playerName.trim()) {
            setError("Please enter your name.");
            return;
        }
        if (!code.trim()) {
            setError("Please enter a lobby code.");
            return;
        }
        socket.emit('join-lobby', { lobbyId: code.toUpperCase(), playerName }, ({ lobbyData, error }: { lobbyData?: LobbyData; error?: string }) => {
            if (error) {
                setError(error);
            } else if (lobbyData) {
                setLobbyData(lobbyData);
                window.history.pushState({}, '', `?lobby=${code.toUpperCase()}`);
                setPage('lobby');
            }
        });
    };
    
    const handleStartGame = () => {
        if (isHost && lobbyData?.id) {
            socket.emit('start-game', lobbyData.id);
        }
    };
    
    const handleReset = () => {
        window.history.pushState({}, '', '/');
        setPage('home');
        setLobbyData(null);
        setError('');
    };

    const renderPage = () => {
        switch (page) {
            case 'lobby':
                return <LobbyPage lobbyData={lobbyData} isHost={isHost} onStartGame={handleStartGame} />;
            case 'game':
                return <GamePage lobbyData={lobbyData} isHost={isHost} me={me} socket={socket} />;
            case 'results':
                return <ResultsPage lobbyData={lobbyData} onReset={handleReset} />;
            case 'home':
            default:
                return <HomePage onCreateLobby={handleCreateLobby} onJoinLobby={handleJoinLobby} playerName={playerName} setPlayerName={setPlayerName} error={error} setError={setError} />;
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-mono flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-6xl mx-auto">
                <header className="w-full text-center mb-8">
                    <h1 className="text-5xl font-bold text-cyan-400 tracking-wider">Type<span className="text-red-500">Racer</span> F1</h1>
                    <p className="text-gray-400 mt-2">The Networked Multiplayer Typing Showdown.</p>
                </header>
                <main className="w-full">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}