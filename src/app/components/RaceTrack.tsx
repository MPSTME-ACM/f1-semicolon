import React, { useMemo, useRef } from 'react';
import F1Car from './f1car';
import type { Player } from '../types';
import { TRACK_DATA, TrackId } from '../tracks';

interface RaceTrackProps {
    players: Player[];
    trackId: TrackId;
}

// A simple hashing function to convert a player ID string into a number
const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

// This sub-component calculates a car's position on the track
function CarOnTrack({ player, color, pathElement }: { player: Player; color: string; pathElement: SVGPathElement | null }) {
    if (!pathElement) return null;

    const totalLength = pathElement.getTotalLength();
    const point = pathElement.getPointAtLength((player.progress / 100) * totalLength);

    return (
        <g transform={`translate(${point.x}, ${point.y})`}>
            <F1Car color={color} />
            <text
                x="0"
                y="25"
                fill="rgba(255, 255, 255, 0.7)"
                fontSize="10"
                textAnchor="middle"
            >
                {player.name}
            </text>
        </g>
    );
}

export default function RaceTrack({ players, trackId }: RaceTrackProps) {
    const pathRef = useRef<SVGPathElement>(null);
    const selectedTrack = TRACK_DATA[trackId] || TRACK_DATA.track1;

    // Dynamically generate a unique and stable color for each player
    const playerColors = useMemo(() => {
        const colors = new Map<string, string>();
        players.forEach((player) => {
            // Generate a unique hue from the player's ID
            const hue = simpleHash(player.id) % 360;
            // Use HSL for vibrant, pleasant colors
            const color = `hsl(${hue}, 90%, 65%)`;
            colors.set(player.id, color);
        });
        return colors;
    }, [players]);

    return (
        <div className="glass-container p-4 w-full aspect-[2/1] md:aspect-[16/9]">
            <svg className="w-full h-full" viewBox={selectedTrack.viewBox}>
                <defs>
                    <filter id="track-glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <path
                    ref={pathRef}
                    d={selectedTrack.path}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.7)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    filter="url(#track-glow)"
                />

                {players.map((player) => (
                    <CarOnTrack
                        key={player.id}
                        player={player}
                        color={playerColors.get(player.id) || '#FFFFFF'} // Use the generated color
                        pathElement={pathRef.current}
                    />
                ))}
            </svg>
        </div>
    );
}