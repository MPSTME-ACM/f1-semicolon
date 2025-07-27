'use client'
import React, { useState, useCallback, useEffect, useRef } from 'react';
import RaceTrack from './RaceTrack';
import type { LobbyData, Player } from '../types';
import type { Socket } from 'socket.io-client';

interface GamePageProps {
    lobbyData: LobbyData | null;
    me: Player | undefined;
    socket: Socket;
}

interface ClientTypingAreaProps {
    lobbyData: LobbyData;
    me: Player;
    socket: Socket;
}

export default function GamePage({ lobbyData, me, socket }: GamePageProps) {
    if (!lobbyData || !me) return <div className="text-center">Loading game...</div>;

    if (me.isHost) {
        return (
            <div className="w-full animate-fade-in">
                <RaceTrack players={lobbyData.players} />
                <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-2xl">
                    <h3 className="text-xl font-bold text-center mb-4">You are the host. The race is on!</h3>
                    <p className="text-gray-400 text-center">You can also type on another device by joining your own lobby.</p>
                </div>
            </div>
        );
    }
    
    return <ClientTypingArea lobbyData={lobbyData} me={me} socket={socket} />;
}

function ClientTypingArea({ lobbyData, me, socket }: ClientTypingAreaProps) {
    const { textToType, startTime } = lobbyData;
    const [inputValue, setInputValue] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const calculateWPM = useCallback((correctChars: number, seconds: number): number => {
        if (seconds <= 0) return 0;
        return Math.round((correctChars / 5) / (seconds / 60));
    }, []);

    // Focus the typing area on mount
    useEffect(() => {
        containerRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (me.progress >= 100 || lobbyData.gameState === 'finished') {
            e.preventDefault();
            return;
        }

        if (e.key === 'Backspace') {
            e.preventDefault();
            setInputValue(prev => prev.slice(0, -1));
        } else if (e.key.length === 1) { // Handle single character keys (letters, numbers, symbols)
            e.preventDefault();
            setInputValue(prev => prev + e.key);
        }
        // We ignore other keys like 'Shift', 'Control', 'Tab', etc.
    };

    // This effect runs whenever the input value changes to update the server
    useEffect(() => {
        if (!startTime) return;

        let correctChars = 0;
        for (let i = 0; i < inputValue.length; i++) {
            if (inputValue[i] === textToType[i]) correctChars++;
        }
        
        const progress = (correctChars / textToType.length) * 100;
        const elapsedSeconds = (new Date().getTime() - new Date(startTime).getTime()) / 1000;
        const wpm = calculateWPM(correctChars, elapsedSeconds);
        const accuracy = inputValue.length > 0 ? (correctChars / inputValue.length) * 100 : 100;

        socket.emit('player-update', {
            lobbyId: lobbyData.id,
            playerUpdate: { progress, wpm, accuracy: parseFloat(accuracy.toFixed(1)) }
        });

    }, [inputValue, textToType, startTime, lobbyData.id, socket, calculateWPM]);


    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-2xl max-w-3xl mx-auto animate-fade-in">
            <style>{`
                .blinking-cursor {
                    animation: blink 1s step-end infinite;
                }
                @keyframes blink {
                    from, to { color: transparent }
                    50% { color: #34d399; }
                }
            `}</style>
            <h3 className="font-bold text-2xl text-cyan-400 mb-4 text-center">Go, {me?.name}!</h3>
            
            <div
                ref={containerRef}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                className="text-2xl bg-gray-900 p-6 rounded-md mb-4 whitespace-pre-wrap select-none font-mono leading-relaxed tracking-wider focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
                {textToType.split('').map((char, index) => {
                    const isTyped = index < inputValue.length;
                    const isCorrect = isTyped && inputValue[index] === char;
                    const isCurrent = index === inputValue.length;

                    let charClass = 'text-gray-500'; // Untyped
                    if (isTyped && isCorrect) charClass = 'text-green-400';
                    if (isTyped && !isCorrect) charClass = 'text-red-500 bg-red-500/20';
                    
                    return (
                        <span key={index} className={charClass}>
                            {isCurrent && <span className="blinking-cursor">|</span>}
                            {char}
                        </span>
                    );
                })}
                 {inputValue.length === textToType.length && <span className="blinking-cursor">|</span>}
            </div>

            <div className="mt-4 flex justify-around text-center">
                <div>
                    <p className="text-gray-400 text-sm">WPM</p>
                    <p className="text-2xl font-bold text-cyan-400">{me?.wpm || 0}</p>
                </div>
                <div>
                    <p className="text-gray-400 text-sm">Accuracy</p>
                    <p className="text-2xl font-bold text-green-400">{(me?.accuracy || 100).toFixed(1)}%</p>
                </div>
                 <div>
                    <p className="text-gray-400 text-sm">Progress</p>
                    <p className="text-2xl font-bold text-yellow-400">{(me?.progress || 0).toFixed(0)}%</p>
                </div>
            </div>
            {me?.progress >= 100 && <p className="text-green-400 font-bold text-center mt-4">You finished! Waiting for others...</p>}
            {lobbyData.gameState !== 'finished' && me.progress < 100 && <p className="text-gray-500 text-center text-sm mt-4">Click on the text above to start typing.</p>}
        </div>
    );
}