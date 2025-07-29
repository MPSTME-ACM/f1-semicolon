import React from 'react';

interface F1CarProps {
    color: string;
}

export default function F1Car({ color }: F1CarProps) {
    // We create a unique ID for the glow filter based on the color
    // to prevent conflicts if multiple cars are on the track.
    const filterId = `glow-${color.replace('#', '')}`;

    return (
        <g>
            <defs>
                <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                    {/* This SVG filter creates the blur effect for the glow */}
                    <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <circle
                r="7" // The radius of the dot
                cx="0"
                cy="0"
                fill={color}
                filter={`url(#${filterId})`} // Apply the glow filter
            >
                {/* This SVG animation tag makes the dot's opacity pulse */}
                <animate
                    attributeName="opacity"
                    values="0.6;1;0.6"
                    dur="2s"
                    repeatCount="indefinite"
                />
            </circle>
        </g>
    );
}