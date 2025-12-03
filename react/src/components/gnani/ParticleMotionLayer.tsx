import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    life: number;
    maxLife: number;
}

const ParticleMotionLayer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const requestRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Adaptive particle count based on screen size
        const getParticleCount = (width: number, height: number) => {
            const area = width * height;
            // Increased density: ~150 particles for 1920x1080 (was ~50)
            return Math.floor(area / 13500);
        };

        const createParticle = (w: number, h: number): Particle => {
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                // Very slow movement
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2 - 0.1, // Slight upward drift
                size: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.3 + 0.1, // Low opacity
                life: Math.random() * 1000,
                maxLife: 1000 + Math.random() * 1000,
            };
        };

        const initParticles = () => {
            const count = getParticleCount(canvas.width, canvas.height);
            particles.current = [];
            for (let i = 0; i < count; i++) {
                particles.current.push(createParticle(canvas.width, canvas.height));
            }
        };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Re-initialize particles on resize to avoid clustering
            initParticles();
        };

        const animate = () => {
            // Throttle FPS to ~30 for low CPU usage if needed, but 60 is usually fine for simple canvas
            // For now, run every frame but keep logic light

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const w = canvas.width;
            const h = canvas.height;

            particles.current.forEach((p, index) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life--;

                // Wrap around
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = 0;

                // Respawn if dead
                if (p.life <= 0) {
                    particles.current[index] = createParticle(w, h);
                }

                // Draw
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 255, ${p.alpha})`; // Cyan color
                ctx.fill();
            });

            requestRef.current = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-0"
            style={{ opacity: 0.6 }} // Global layer opacity
        />
    );
};

export default ParticleMotionLayer;
