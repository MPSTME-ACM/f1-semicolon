import React, { useRef } from 'react';
import F1Car from './f1car';
import type { Player } from '../types';
import { TRACK_DATA, TrackId } from '../tracks'; // Import track data

interface RaceTrackProps {
    players: Player[];
    trackId: TrackId; // Add trackId as a prop
}

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
    const carColors = ['#5271FF', '#FFFFFF', '#3b82f6', '#60a5fa'];

    // Get the selected track's data
    const selectedTrack = TRACK_DATA[trackId] || TRACK_DATA.track1;

    return (
        <div className="glass-container p-4">
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

                {players.map((player, index) => (
                    <CarOnTrack
                        key={player.id}
                        player={player}
                        color={carColors[index % carColors.length]}
                        pathElement={pathRef.current}
                    />
                ))}
            </svg>
        </div>
    );
}