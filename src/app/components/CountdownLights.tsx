import React from 'react';

interface CountdownLightsProps {
  lightsOn: number;
}

export default function CountdownLights({ lightsOn }: CountdownLightsProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="flex gap-4 md:gap-8">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className={`w-16 h-16 md:w-24 md:h-24 rounded-full transition-all duration-200 ${
              index < lightsOn ? 'bg-white shadow-[0_0_20px_5px_rgba(255,255,255,0.7)]' : 'bg-gray-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
}