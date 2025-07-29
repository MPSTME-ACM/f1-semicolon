'use client';

import React, { useRef, useEffect } from 'react';

export default function FlickeringBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let stars: { x: number; y: number; radius: number; alpha: number; twinkling: boolean; delta: number; color: string }[] = [];
        let animationFrameId: number;

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            stars = [];
            
            // Grid setup - pixels arranged in rows and columns
            const pixelSpacing = 24; // Distance between pixels
            const pixelSize = 1; // Size of each pixel
            
            const cols = Math.floor(canvas.width / pixelSpacing);
            const rows = Math.floor(canvas.height / pixelSpacing);
            
            // Create grid of pixels
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    stars.push({
                        x: col * pixelSpacing + pixelSpacing / 2,
                        y: row * pixelSpacing + pixelSpacing / 2,
                        radius: pixelSize,
                        alpha: Math.random() * 0.3 + 0.1, // Dimmer brightness (0.1 to 0.4)
                        twinkling: Math.random() > 0.4, // Some pixels flicker
                        delta: (Math.random() * 0.04 - 0.02), // Subtle flickering speed
                        color: '#ffffff' // Only white pixels
                    });
                }
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            stars.forEach(star => {
                if (star.twinkling) {
                    star.alpha += star.delta;
                    if (star.alpha <= 0.05 || star.alpha >= 0.4) {
                        star.delta = -star.delta;
                    }
                    // Clamp alpha values to keep them dim
                    star.alpha = Math.max(0.05, Math.min(0.4, star.alpha));
                }
                
                ctx.save();
                ctx.globalAlpha = star.alpha;
                ctx.fillStyle = star.color;
                ctx.fillRect(star.x - star.radius/2, star.y - star.radius/2, star.radius, star.radius);
                ctx.restore();
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        // Initial setup and start animation
        setup();
        draw();

        // Handle window resizing
        const handleResize = () => {
            cancelAnimationFrame(animationFrameId);
            setup();
            draw();
        };

        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none"
            style={{
                zIndex: 1, // Changed from -1 to 1
                background: 'transparent', // Changed from black to transparent
            }}
        />
    );
}