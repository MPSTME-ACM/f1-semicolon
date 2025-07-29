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
    if (!lobbyData || !me) return <div className="text-center text-white/80">Loading game...</div>;

    if (isHost) {
        return (
            <div className="w-full animate-fade-in">
                <RaceTrack players={lobbyData.players} />
                <div className="mt-8 glass-container p-6 text-center">
                    <h3 className="text-xl font-bold mb-4 text-white">You are the host. The race is on!</h3>
                    <p className="text-white/60">Monitor the race progress above.</p>
                </div>
            </div>
        );
    }
    
    return <ClientTypingArea lobbyData={lobbyData} me={me} socket={socket} />;
}

function ClientTypingArea({ lobbyData, me, socket }: ClientTypingAreaProps) {
    const { textToType, startTime } = lobbyData;
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // FIX 1: Add state to track typing stats for accurate calculations
    const [typingStats, setTypingStats] = useState({
        totalStrokes: 0,
        mistakes: 0,
    });

    const calculateWPM = useCallback((correctChars: number, seconds: number): number => {
        if (seconds <= 0) return 0;
        return Math.round((correctChars / 5) / (seconds / 60));
    }, []);

    const focusInput = () => {
        inputRef.current?.focus();
    };

    useEffect(() => {
        focusInput();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (me.progress >= 100 || lobbyData.gameState === 'finished') return;
        
        const typedValue = e.target.value;
        if (typedValue.length > textToType.length) return;

        // FIX 1: Track mistakes and total strokes
        // This runs only when a new character is added (not on backspace)
        if (typedValue.length > inputValue.length) {
            const lastCharIndex = typedValue.length - 1;
            const newStrokeIsCorrect = typedValue[lastCharIndex] === textToType[lastCharIndex];

            setTypingStats(prevStats => ({
                totalStrokes: prevStats.totalStrokes + 1,
                mistakes: newStrokeIsCorrect ? prevStats.mistakes : prevStats.mistakes + 1,
            }));
        }

        setInputValue(typedValue);
    };

    useEffect(() => {
        if (!startTime) return;

        // Calculate correct characters for WPM
        let correctChars = 0;
        for (let i = 0; i < inputValue.length; i++) {
            if (inputValue[i] === textToType[i]) correctChars++;
        }
        
        // FIX 2: Progress is now based on how much you've typed, not what's correct
        const progress = (inputValue.length / textToType.length) * 100;
        
        const elapsedSeconds = (new Date().getTime() - new Date(startTime).getTime()) / 1000;
        const wpm = calculateWPM(correctChars, elapsedSeconds);

        // FIX 1: Accuracy is now based on the tracked stats
        const accuracy = typingStats.totalStrokes > 0 
            ? ((typingStats.totalStrokes - typingStats.mistakes) / typingStats.totalStrokes) * 100 
            : 100;

        socket.emit('player-update', {
            lobbyId: lobbyData.id,
            playerUpdate: { progress, wpm, accuracy: parseFloat(accuracy.toFixed(1)) }
        });

    }, [inputValue, textToType, startTime, lobbyData.id, socket, calculateWPM, typingStats]);


    // The JSX for ClientTypingArea remains the same as your version
    return (
        <div className="glass-container p-4 sm:p-6 max-w-4xl mx-auto animate-fade-in" onClick={focusInput}>
            <style>{`
                @keyframes blink-border {
                    from, to { border-color: transparent }
                    50% { border-color: #5271FF; /* Assuming a hex for 'true-blue' */ }
                }
                .blinking-cursor-border {
                    animation: blink-border 1s step-end infinite;
                    border-left-width: 2px;
                }
            `}</style>
            <h3 className="font-bold text-2xl text-true-blue mb-4 text-center">Go, {me?.name}!</h3>
            
            <div
                className="relative text-2xl bg-black/30 border border-white/20 p-6 rounded-md mb-4 whitespace-pre-wrap select-none font-mono leading-relaxed tracking-wider cursor-text"
            >
                {textToType.split('').map((char, index) => {
                    const isTyped = index < inputValue.length;
                    const isCorrect = isTyped && inputValue[index] === char;
                    const isCurrent = index === inputValue.length;

                    let charClass = 'text-white/40';
                    if (isTyped && isCorrect) charClass = 'text-white';
                    if (isTyped && !isCorrect) charClass = 'text-red-400 bg-red-500/20';
                    if (isCurrent) charClass += ' blinking-cursor-border';
                    
                    return <span key={index} className={charClass}>{char}</span>;
                })}
                {inputValue.length === textToType.length && lobbyData.gameState !== 'finished' && <span className="blinking-cursor-border">&nbsp;</span>}

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

            <div className="mt-4 flex justify-around text-center p-4 bg-black/30 rounded-md">
                <div>
                    <p className="text-white/60 text-sm">WPM</p>
                    <p className="text-2xl font-bold text-white">{me?.wpm || 0}</p>
                </div>
                <div>
                    <p className="text-white/60 text-sm">Accuracy</p>
                    <p className="text-2xl font-bold text-true-blue">{(me?.accuracy || 100).toFixed(1)}%</p>
                </div>
                 <div>
                    <p className="text-white/60 text-sm">Progress</p>
                    <p className="text-2xl font-bold text-white">{(me?.progress || 0).toFixed(0)}%</p>
                </div>
            </div>
            {me?.progress >= 100 && <p className="text-white font-bold text-center mt-4">You finished! Waiting for others...</p>}
            {lobbyData.gameState !== 'finished' && me.progress < 100 && <p className="text-white/50 text-center text-sm mt-4">Click the text above to start typing.</p>}
        </div>
    );
}