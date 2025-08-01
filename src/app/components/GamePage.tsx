'use client'
import React, { useState, useCallback, useEffect, useRef } from 'react';
import RaceTrack from './RaceTrack';
import CountdownLights from './CountdownLights';
import type { LobbyData, Player } from '../types';
import type { Socket } from 'socket.io-client';
import { TrackId } from '../tracks';

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
    raceStarted: boolean;
}

export default function GamePage({ lobbyData, isHost, me, socket }: GamePageProps) {
    const [lightsOn, setLightsOn] = useState(0);
    const [raceStarted, setRaceStarted] = useState(false);

    useEffect(() => {
        const timers: NodeJS.Timeout[] = [];
        for (let i = 1; i <= 5; i++) {
            timers.push(setTimeout(() => setLightsOn(i), i * 600));
        }
        timers.push(setTimeout(() => {
            setLightsOn(0);
            setRaceStarted(true);
        }, 3600));
        return () => timers.forEach(clearTimeout);
    }, []);

    if (!lobbyData || !me) return <div className="text-center text-white/80">Loading game...</div>;

    return (
        <div className="w-full relative">
            {!raceStarted && <CountdownLights lightsOn={lightsOn} />}
            
            {isHost ? (
                <div className="w-full animate-fade-in">
                    {/* The incorrect 'hostId' prop has been removed */}
                    <RaceTrack players={lobbyData.players} trackId={lobbyData.trackId as TrackId} />
                    <div className="mt-8 glass-container p-6 text-center">
                        <h3 className="text-xl font-bold mb-4 text-white">You are the host. The race is on!</h3>
                        <p className="text-white/60">Monitor the race progress above.</p>
                    </div>
                </div>
            ) : (
                <ClientTypingArea lobbyData={lobbyData} me={me} socket={socket} raceStarted={raceStarted} />
            )}
        </div>
    );
}

function ClientTypingArea({ lobbyData, me, socket, raceStarted }: ClientTypingAreaProps) {
    const { startTime } = lobbyData;
    const { textToType } = me; 
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const textContainerRef = useRef<HTMLDivElement>(null); // Ref for the text container div
    const caretRef = useRef<HTMLDivElement>(null);       // Ref for the new caret element
    const [typingStats, setTypingStats] = useState({
        totalStrokes: 0,
        mistakes: 0,
    });

    const calculateWPM = useCallback((correctChars: number, seconds: number): number => {
        if (seconds <= 0) return 0;
        return Math.round((correctChars / 5) / (seconds / 60));
    }, []);

    const focusInput = () => {
        inputRef.current?.focus({ preventScroll: true });
    };

    useEffect(() => {
        // Only focus the input once the countdown is over
        if (raceStarted) {
            focusInput();
        }
    }, [raceStarted]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (me.progress >= 100 || lobbyData.gameState === 'finished') return;
        
        const typedValue = e.target.value;
        if (typedValue.length > textToType.length) return;

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
        if (!startTime || !raceStarted) return; // Don't send updates during countdown

        let correctChars = 0;
        for (let i = 0; i < inputValue.length; i++) {
            if (inputValue[i] === textToType[i]) correctChars++;
        }
        
        const progress = (inputValue.length / textToType.length) * 100;
        const elapsedSeconds = (new Date().getTime() - new Date(startTime).getTime()) / 1000;
        const wpm = calculateWPM(correctChars, elapsedSeconds);
        const accuracy = typingStats.totalStrokes > 0 
            ? ((typingStats.totalStrokes - typingStats.mistakes) / typingStats.totalStrokes) * 100 
            : 100;

        const container = textContainerRef.current;
        const caret = caretRef.current;

        if (container && caret) {
            const currentLetterSpan = container.querySelector<HTMLElement>('.current-char');
            
            if (currentLetterSpan) {
                // This part is working correctly
                currentLetterSpan.scrollIntoView({ block: 'center', behavior: 'smooth' });

                // --- FIX STARTS HERE ---
                // Calculate the correct top position to appear as an underline
                const newTop = currentLetterSpan.offsetTop + currentLetterSpan.offsetHeight - 4; // Position 4px above the bottom of the line
                const newLeft = currentLetterSpan.offsetLeft;
                const newWidth = currentLetterSpan.offsetWidth;

                // Apply the new position and size
                caret.style.transform = `translate(${newLeft}px, ${newTop}px)`;
                caret.style.width = `${newWidth}px`;
                caret.style.opacity = '1'; // Ensure the caret is visible
            } else {
                // Hide the caret if there's no active character (e.g., at the end of the race)
                caret.style.opacity = '0';
            }
        }

        socket.emit('player-update', {
            lobbyId: lobbyData.id,
            playerUpdate: { progress, wpm, accuracy: parseFloat(accuracy.toFixed(1)) }
        });

        if (inputValue.length === textToType.length) {
            socket.emit('submit-final-text', {
                lobbyId: lobbyData.id,
                finalInput: inputValue,
            });
        }
    }, [inputValue, textToType, startTime, lobbyData.id, socket, calculateWPM, typingStats, raceStarted]);


    return (
        <div 
            className="glass-container p-4 sm:p-6 max-w-4xl mx-auto animate-fade-in flex flex-col h-[calc(100vh-12rem)]" 
            onClick={focusInput}
        >
            <h3 className="font-bold text-2xl text-true-blue mb-4 text-center flex-shrink-0">Go, {me?.name}!</h3>
            
            <div
                className="relative text-2xl bg-black/30 border border-white/20 p-6 rounded-md mb-4 whitespace-pre-wrap select-none font-mono leading-relaxed tracking-wider cursor-text flex-grow overflow-y-auto w-[95%] md:w-full mx-auto"
            >
                <div
                    ref={caretRef}
                    className="absolute h-[3px] bg-true-blue rounded-sm transition-all duration-150 ease-out"
                    style={{ opacity: 0 }} // Start hidden, let useEffect handle positioning and visibility
                />

                {textToType.split('').map((char, index) => {
                    const isTyped = index < inputValue.length;
                    const isCorrect = isTyped && inputValue[index] === char;
                    const isCurrent = index === inputValue.length;

                    // The old blinking border is no longer needed
                    let charClass = 'text-white/40';
                    if (isTyped && isCorrect) charClass = 'text-white';
                    if (isTyped && !isCorrect) charClass = 'text-red-400 bg-red-500/20';
                    // Add a special class to the current character so we can find it
                    if (isCurrent) charClass += ' current-char';
                    
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
                    disabled={!raceStarted || me?.progress >= 100 || lobbyData.gameState === 'finished'}
                />
            </div>

            <div className="flex-shrink-0">
                <div className="flex justify-around text-center p-4 bg-black/30 rounded-md">
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
                <div className="text-center mt-4 h-6"> {/* Added fixed height to prevent layout shift */}
                    {me?.progress >= 100 && <p className="text-white font-bold">You finished! Waiting for others...</p>}
                    {lobbyData.gameState !== 'finished' && !raceStarted && <p className="text-white/50 text-sm">Get ready...</p>}
                    {lobbyData.gameState !== 'finished' && raceStarted && me.progress < 100 && <p className="text-white/50 text-sm">Click the text above to start typing.</p>}
                </div>
            </div>
        </div>
    );
}