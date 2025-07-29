'use client'
import React, { useState, useCallback, useEffect, useRef } from 'react';
import RaceTrack from './RaceTrack';
import type { LobbyData, Player } from '../types';
import type { Socket } from 'socket.io-client';

interface GamePageProps {
    lobbyData: LobbyData | null;
    isHost: boolean;
    me: Player | undefined;
    socket: Socket;
}

interface ClientTypingAreaProps {
    lobbyData: LobbyData;
    me: Player;
    socket: Socket;
}

export default function GamePage({ lobbyData, isHost, me, socket }: GamePageProps) {
    if (!lobbyData || !me) return <div className="text-center">Loading game...</div>;

    if (isHost) {
        return (
            <div className="w-full animate-fade-in">
                <RaceTrack players={lobbyData.players} />
                <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-2xl">
                    <h3 className="text-xl font-bold text-center mb-4">You are the host. The race is on!</h3>
                    <p className="text-gray-400 text-center">Monitor the race progress above.</p>
                </div>
            </div>
        );
    }

    return <ClientTypingArea lobbyData={lobbyData} me={me} socket={socket} />;
}

function ClientTypingArea({ lobbyData, me, socket }: ClientTypingAreaProps) {
    const { textToType, startTime } = lobbyData;
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null); // Ref for the hidden input

    const calculateWPM = useCallback((correctChars: number, seconds: number): number => {
        if (seconds <= 0) return 0;
        return Math.round((correctChars / 5) / (seconds / 60));
    }, []);

    // Focus the hidden input to bring up the keyboard
    const focusInput = () => {
        inputRef.current?.focus();
    };

    useEffect(() => {
        focusInput();
    }, []);

    // FIX: Use a standard onChange handler for the input field.
    // This is more reliable across all devices.
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (me.progress >= 100 || lobbyData.gameState === 'finished') return;

        const typedValue = e.target.value;
        // Prevent typing beyond the length of the prompt
        if (typedValue.length > textToType.length) return;

        setInputValue(typedValue);
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
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-2xl max-w-3xl mx-auto animate-fade-in" onClick={focusInput}>
            <style>{`
            @keyframes blink-border {
                from, to { border-color: transparent }
                50% { border-color: #34d399; /* emerald-400 */ }
            }
            .blinking-cursor-border {
                animation: blink-border 1s step-end infinite;
                border-left-width: 2px;
            }
        `}</style>
            <h3 className="font-bold text-2xl text-blue-400 mb-4 text-center">Go, {me?.name}!</h3>

            <div
                className="relative text-2xl bg-gray-900 p-6 rounded-md mb-4 whitespace-pre-wrap select-none font-mono leading-relaxed tracking-wider cursor-text"
            >
                {/* The visual representation of the text */}
                {textToType.split('').map((char, index) => {
                    const isTyped = index < inputValue.length;
                    const isCorrect = isTyped && inputValue[index] === char;
                    const isCurrent = index === inputValue.length;

                    let charClass = 'text-gray-500';
                    if (isTyped && isCorrect) charClass = 'text-green-400';
                    if (isTyped && !isCorrect) charClass = 'text-red-500 bg-red-500/20 rounded-sm';

                    // Apply the blinking border class to the current character
                    if (isCurrent) {
                        charClass += ' blinking-cursor-border';
                    }

                    return (
                        <span key={index} className={charClass}>
                            {char}
                        </span>
                    );
                })}
                {/* This handles the cursor at the very end of the text */}
                {inputValue.length === textToType.length && lobbyData.gameState !== 'finished' && (
                    <span className="blinking-cursor-border">&nbsp;</span>
                )}

                {/* FIX: A hidden input field to capture all keyboard events reliably */}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-text"
                    autoFocus
                    disabled={me?.progress >= 100 || lobbyData.gameState === 'finished'}
                />
            </div>

            <div className="mt-4 flex justify-around text-center">
                <div>
                    <p className="text-gray-400 text-sm">WPM</p>
                    <p className="text-2xl font-bold text-cyan-400">{me?.wpm || 0}</p>
                </div>
                <div>
                    <p className="text-gray-400 text-sm">Accuracy</p>
                    <p className="text-2xl font-bold text-blue-500">{(me?.accuracy || 100).toFixed(1)}%</p>
                </div>
                <div>
                    <p className="text-gray-400 text-sm">Progress</p>
                    <p className="text-2xl font-bold text-blue-400">{(me?.progress || 0).toFixed(0)}%</p>
                </div>
            </div>
            {me?.progress >= 100 && <p className="text-green-400 font-bold text-center mt-4">You finished! Waiting for others...</p>}
            {lobbyData.gameState !== 'finished' && me.progress < 100 && <p className="text-gray-500 text-center text-sm mt-4">Click the text above to start typing.</p>}
        </div>
    );
}