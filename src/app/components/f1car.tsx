import React from 'react';

interface F1CarProps {
    color: string;
}

export default function F1Car({ color }: F1CarProps) {
    return (
        <svg width="40" height="40" viewBox="0 0 100 40" className="transform -rotate-90">
            <rect x="20" y="0" width="60" height="10" className={color} rx="2" />
            <rect x="0" y="10" width="100" height="20" className={color} rx="5" />
            <rect x="30" y="30" width="40" height="10" className={color} rx="2" />
            <rect x="5" y="5" width="10" height="30" className="fill-current text-gray-900" rx="3" />
            <rect x="85" y="5" width="10" height="30" className="fill-current text-gray-900" rx="3" />
            <circle cx="50" cy="15" r="5" className="fill-current text-gray-900" />
        </svg>
    );
}