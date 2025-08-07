'use client'
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AudioEngineManager } from '../lib/AudioEngineManager';
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

    const audioManagerRef = useRef<AudioEngineManager | null>(null);

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

    useEffect(() => {
        if (isHost) {
            const enableAudio = () => {
                const manager = new AudioEngineManager();
                manager.loadSound('/engine-loop.mp3');
                audioManagerRef.current = manager;
                // Clean up the event listener after it's used once
                document.removeEventListener('click', enableAudio);
            };
            document.addEventListener('click', enableAudio, { once: true });

            // On cleanup, stop all sounds
            return () => {
                audioManagerRef.current?.stopAll();
                document.removeEventListener('click', enableAudio);
            };
        }
    }, [isHost]);

    useEffect(() => {
        if (isHost && audioManagerRef.current && lobbyData?.players) {
            audioManagerRef.current.updateAllPlayers(lobbyData.players);
        }
    }, [isHost, lobbyData?.players]);

    if (!lobbyData || !me) return <div className="text-center text-white/80">Loading game...</div>;

    return (
        <div className="w-full relative">
            {!raceStarted && <CountdownLights lightsOn={lightsOn} />}

            {isHost ? (
                <div className="w-full animate-fade-in">
                    <RaceTrack players={lobbyData.players} trackId={lobbyData.trackId as TrackId} />
                    <div className="mt-8 glass-container p-6 text-center">
                        <h3 className="text-xl font-bold mb-4 text-white">You are the host. The race is on!</h3>
                        <p className="text-white/60">Monitor the race progress above.</p>
                        <p className="text-xs text-true-blue mt-4 animate-pulse">Click anywhere to enable race audio.</p>
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
    const caretRef = useRef<HTMLDivElement>(null);
    const textBlockRef = useRef<HTMLDivElement>(null);
    const [textTransformY, setTextTransformY] = useState(0);
    const [typingStats, setTypingStats] = useState({
        totalStrokes: 0,
        mistakes: 0,
    });

    const calculateWPM = useCallback((totalTypedChars: number, seconds: number): number => {
        if (seconds <= 0) return 0;
        // Standard WPM calculation: (characters typed / 5) / (seconds / 60)
        return Math.round((totalTypedChars / 5) / (seconds / 60));
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

    // Split text into words for better line management
    const words = textToType.split(' ');

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
        if (!raceStarted) return;

        const textBlock = textBlockRef.current;
        if (!textBlock) return;

        // Use rAF to wait for the DOM to be ready for measurement
        requestAnimationFrame(() => {
            const currentCharElement = textBlock.querySelector<HTMLElement>('[data-current-char="true"]');

            if (currentCharElement) {
                const lineHeight = 48;
                const textBlockRect = textBlock.getBoundingClientRect();
                const charRect = currentCharElement.getBoundingClientRect();
                const charTopInFullText = charRect.top - textBlockRect.top;
                const currentLineIndex = Math.round(charTopInFullText / lineHeight);
                const targetTransformY = -Math.max(0, (currentLineIndex - 1) * lineHeight);

                if (targetTransformY !== textTransformY) {
                    setTextTransformY(targetTransformY);
                }
            }
        });

    }, [inputValue, raceStarted, textTransformY]);


    // EFFECT 2: Handles Caret, Stats, and Socket updates
    useEffect(() => {
        if (!startTime || !raceStarted) return;

        // Stats and Socket logic
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
        socket.emit('player-update', { lobbyId: lobbyData.id, playerUpdate: { progress, wpm, accuracy: parseFloat(accuracy.toFixed(1)) } });
        if (inputValue.length === textToType.length) {
            socket.emit('submit-final-text', { lobbyId: lobbyData.id, finalInput: inputValue });
        }

        // Caret positioning logic
        requestAnimationFrame(() => {
            const caret = caretRef.current;
            const textBlock = textBlockRef.current;
            if (!caret || !textBlock) return;

            const container = caret.parentElement;
            if (!container) return;

            const currentCharElement = textBlock.querySelector<HTMLElement>('[data-current-char="true"]');

            if (currentCharElement) {
                void textBlock.offsetHeight;

                const textBlockRect = textBlock.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const charRect = currentCharElement.getBoundingClientRect();

                caret.style.left = `${charRect.left - containerRect.left}px`;
                caret.style.top = `${charRect.top - containerRect.top + charRect.height - 3}px`;
                caret.style.width = `${charRect.width}px`;
                caret.style.opacity = '1';
            } else {
                caret.style.opacity = '0';
            }
        });

    }, [inputValue, raceStarted, textTransformY, startTime, textToType, lobbyData.id, socket, calculateWPM, typingStats]);

    return (
        <div
            className="flex flex-col h-[calc(100vh-12rem)] items-center justify-center p-4 sm:p-6 max-w-6xl mx-auto animate-fade-in"
            onClick={focusInput}
        >
            <h3 className="font-bold text-2xl text-true-blue mb-6 text-center flex-shrink-0">Go, {me?.name}!</h3>

            {/* Text Display Container */}
            <div className="relative w-full max-w-4xl flex-grow flex items-center justify-center">
                <div
                    className="relative overflow-hidden cursor-text select-none"
                    style={{
                        height: '156px',
                        lineHeight: '48px',
                        fontSize: '32px'
                    }}
                >
                    {/* Caret */}
                    <div
                        ref={caretRef}
                        className="absolute h-[3px] bg-white rounded-sm transition-all duration-150 ease-out z-10"
                        style={{ opacity: 0, transition: 'left 150ms ease-out, top 150ms ease-out, opacity 150ms ease-out' }}
                    />

                    {/* Text Content*/}
                    <div
                        ref={textBlockRef}
                        className="relative font-mono tracking-wide leading-relaxed px-4 whitespace-pre-wrap break-words ease-linear"
                        style={{ transform: `translateY(${textTransformY}px)` }}
                    >
                        {textToType.split('').map((char, index) => {
                            const isTyped = index < inputValue.length;
                            const isCorrect = isTyped && inputValue[index] === char;
                            const isCurrent = index === inputValue.length;

                            let charClass = 'text-gray-500 transition-colors duration-75';
                            if (isTyped && isCorrect) {
                                charClass = 'text-white';
                            } else if (isTyped && !isCorrect) {
                                charClass = 'text-red-400 bg-red-500/30 rounded-sm';
                            }

                            if (isCurrent && raceStarted) {
                                return (
                                    <span key={index} className={charClass} data-current-char="true">
                                        {char}
                                    </span>
                                );
                            }

                            return (
                                <span key={index} className={charClass}>
                                    {char}
                                </span>
                            );
                        })}
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-text"
                        autoFocus
                        disabled={!raceStarted || me?.progress >= 100 || lobbyData.gameState === 'finished'}
                        style={{ caretColor: 'transparent' }}
                    />
                </div>
            </div>

            {/* Stats and Status */}
            <div className="flex-shrink-0 mt-6">
                <div className="flex justify-around text-center p-4 bg-black/30 rounded-lg backdrop-blur-sm">
                    <div className="px-4">
                        <p className="text-white/60 text-sm mb-1">WPM</p>
                        <p className="text-2xl font-bold text-white">{me?.wpm || 0}</p>
                    </div>
                    <div className="px-4">
                        <p className="text-white/60 text-sm mb-1">Accuracy</p>
                        <p className="text-2xl font-bold text-true-blue">{(me?.accuracy || 100).toFixed(1)}%</p>
                    </div>
                    <div className="px-4">
                        <p className="text-white/60 text-sm mb-1">Progress</p>
                        <p className="text-2xl font-bold text-white">{(me?.progress || 0).toFixed(0)}%</p>
                    </div>
                </div>
                <div className="text-center mt-4 h-6">
                    {me?.progress >= 100 && (
                        <p className="text-green-400 font-bold">🏁 You finished! Waiting for others...</p>
                    )}
                    {lobbyData.gameState !== 'finished' && !raceStarted && (
                        <p className="text-white/50 text-sm">Get ready to type...</p>
                    )}
                    {lobbyData.gameState !== 'finished' && raceStarted && me.progress < 100 && (
                        <p className="text-white/50 text-sm">Keep typing! 🚀</p>
                    )}
                </div>
            </div>
        </div>
    );
}