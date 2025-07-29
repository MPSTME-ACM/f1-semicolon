import React, { useRef } from 'react';
import F1Car from './f1car';
import type { Player } from '../types';

interface RaceTrackProps {
    players: Player[];
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

export default function RaceTrack({ players }: RaceTrackProps) {
    // The exact path data from your Figma export
    const trackPathData = "M0.5 140.5V139.5V138.5V136V133.5L1 130L2 127.5L3.5 123.5L5.5 120.5L8.5 116.5L12.5 114.5L16 111.5L23 108L26 106.5L31.5 103.5L37 100.5L42.5 97L46.5 94L51 90L56 86.5L59 84L94 50L97 47L98 44V40.5L95 37.5L90 33.5L87.5 29V24.5L90 20.5L94 16.5L98 12.5L103.5 8.5L109.5 4.5L115.5 1H122.5H132.5L257 91.5L259.5 98.5V106.5V118L257 131.5L255 142.5V152.5L259.5 162.5L267.5 174.5L283 192.5L292.5 204L301 213.5L302.5 219L301 224.5L294 226.5L286.5 229.5L278 232.5L269.5 234.5L266 237.5V243L269.5 248L279.5 252.5L290 257.5L301 259H313L320.5 257.5L435 124.5L450 106.5L452.5 102.5V99.5V93.5L451.5 90L450 86L448 82.5L443 78.5L427 77H421L417 76L412.5 73.5L409.5 71.5L406 68V63.5V60.5V56L408 51L412.5 48L417 45.5H423L429.5 48L438 51L448 56L457.5 60.5L466 64.5L473 69L479 73.5L487 81L493 90L500 105.5L502.5 124.5L505.5 143L509 177L511.5 205L513.5 217L514.5 228.5L513.5 239L512.5 245.5L508.5 251.5L504 256L498 259L492 262L484 265L477 267L426 277.5L381.5 280.5H373L368 281.5H366L362.5 282.5L356.5 286L352.5 287.5L348 290.5L342.5 293.5L337 296L332 298L325.5 296L313 291.5L306 289L301 287.5L296 286H290H284.5L282 287.5L278 289L275.5 291.5L273 293.5L271 296L267.5 299.5H264.5L262 302.5L257.5 304.5H250.5L244.5 302.5L240 299.5L236 296L233 291.5L228 285L224 277.5L220 272L213.5 265.5L119.5 218L116.5 216.5L113 215L109.5 213L106.5 211.5L104 210L101 208.5L98 207L95.5 206L92 204.5L90.5 203.5L88.5 202.5L87 201.5L85 200.5L82.5 199.5L80 198.5L78 197.5L76.5 196.5L74 195.5L71 194L69.5 193L66.5 191.5L63 190L61 188.5L59 188L57 186.5L55 185.5L53.5 184.5L51.5 183.5L49 182L47 181L45.5 180L42.5 178.5L40 177.5L38 176.5L36.5 175.5L33.5 174L31.5 172.5L29.5 171L29 170.5L28 170L27 169.5L26 169L24.5 168L23 167L21.5 165.5L20.5 165L19.5 164L18.5 163.5L17.5 162.5L16 161.5L15 161L13.5 160L12.5 159L11 158L10.5 157.5L9.5 156.5L8.5 156L7.5 154.5L6.5 154L5.5 152.5L5 152L4.5 151.5L4 150.5L3.5 149.5L3 149V148.5L2.5 147.5L2 147L1.5 146.5V146V145.5V145V144.5L1 144L0.5 143.5V143V142.5V141.5V140.5Z";
    
    const pathRef = useRef<SVGPathElement>(null);
    const carColors = ['#5271FF', '#FFFFFF', '#3b82f6', '#60a5fa']; // True Blue, White, and shades

    return (
        <div className="glass-container p-4">
            <svg className="w-full h-full" viewBox="0 0 515 305">
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
                    d={trackPathData}
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