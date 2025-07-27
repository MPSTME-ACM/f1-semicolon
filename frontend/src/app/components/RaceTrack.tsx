import React from 'react';
import F1Car from './f1car';
import type { Player } from '../types';

interface RaceTrackProps {
    players: Player[];
}

export default function RaceTrack({ players }: RaceTrackProps) {
    const carColors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-400', 'bg-green-500'];
    
    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-2xl space-y-3">
            <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-full bg-checkered"></div>
            </div>
            {players.map((player, index) => (
                <div key={player.id} className="relative h-10">
                    <div className="absolute top-0 h-full transition-all duration-200 ease-linear" style={{ left: `calc(${player.progress}% - 40px)` }}>
                        <div className="relative w-10 h-10">
                            <F1Car color={carColors[index % carColors.length]} />
                            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap px-2 py-0.5 rounded-full text-white">
                                {player.name} ({player.wpm} WPM)
                            </span>
                        </div>
                    </div>
                </div>
            ))}
            <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
                 <div className="absolute top-0 left-0 h-full w-full bg-checkered"></div>
                 <div className="absolute top-0 right-0 h-full w-2 bg-white"></div>
                 <div className="absolute top-0 right-2 h-full w-2 bg-black"></div>
                 <div className="absolute top-0 right-4 h-full w-2 bg-white"></div>
            </div>
        </div>
    );
}