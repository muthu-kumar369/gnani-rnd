import { useEffect, useState, useRef } from 'react';

// Since Web Speech API doesn't expose the audio stream, we simulate lip sync
export const useLipSync = (isPlaying: boolean, _audioRef?: any) => {
    const [mouthOpenness, setMouthOpenness] = useState(0);
    const rafIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isPlaying) {
            setMouthOpenness(0);
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
            return;
        }

        const animate = () => {
            const time = Date.now() / 100;
            // Create a randomized "talking" pattern
            // Combine sine waves with random noise to look natural
            const base = (Math.sin(time * 2) + 1) / 2; // 0-1 sine
            const noise = Math.random() * 0.5;
            const openness = (base * 0.7 + noise * 0.3) * 0.8; // Scale to 0-0.8 range
            
            setMouthOpenness(openness);
            rafIdRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, [isPlaying]);

    return mouthOpenness;
};
