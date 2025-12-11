import React, { useEffect, useRef } from 'react';
import { eventManager } from '../../utils/eventManager';

const WaveformLayer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const timeRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        let dpr = window.devicePixelRatio || 1;

        const resizeCanvas = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.scale(dpr, dpr);
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Use 'lighter' for subtle glow
            ctx.globalCompositeOperation = 'lighter';

            timeRef.current += 0.015;

            const centerY = height / 2;
            const baseAmplitude = height * 0.08; // Smaller amplitude

            // Draw MANY lines (30+) with very low opacity
            for (let lineIndex = 0; lineIndex < 35; lineIndex++) {
                ctx.beginPath();

                // Vary the properties for each line
                const amplitude = baseAmplitude * (0.3 + Math.random() * 0.7);
                const frequency = 0.8 + lineIndex * 0.15;
                const speed = 0.05 + lineIndex * 0.005;
                const phaseOffset = lineIndex * 0.3;
                const yOffset = (Math.random() - 0.5) * 20;

                // Very low opacity - this is key for subtlety
                const opacity = 0.03 + (lineIndex % 3) * 0.01;

                // Color variation: mostly cyan/blue with some teal
                const colorVariant = lineIndex % 3;
                let color;
                if (colorVariant === 0) {
                    color = `rgba(0, 255, 255, ${opacity})`;
                } else if (colorVariant === 1) {
                    color = `rgba(0, 150, 255, ${opacity})`;
                } else {
                    color = `rgba(100, 200, 255, ${opacity})`;
                }

                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.lineCap = 'round';

                for (let x = 0; x <= width; x += 3) {
                    const k = x / width;

                    // Parabolic attenuation
                    const attenuation = Math.pow(4 * k * (1 - k), 3);

                    const phase = -timeRef.current * speed + phaseOffset;

                    const y = centerY + yOffset +
                        Math.sin(k * Math.PI * 2 * frequency + phase) *
                        amplitude *
                        attenuation;

                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        const cleanup = eventManager.addEventListener('resize', resizeCanvas as EventListener, undefined, 'WaveformLayer');
        resizeCanvas();
        animate();

        return () => {
            cleanup();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-0"
            style={{ opacity: 0.4 }} // Global opacity reduction
        />
    );
};

export default WaveformLayer;
