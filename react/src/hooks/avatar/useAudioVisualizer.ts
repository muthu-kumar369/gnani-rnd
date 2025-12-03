import { useEffect, useRef, useState } from 'react';

export const useAudioVisualizer = (stream: MediaStream | null, fftSize: number = 256) => {
    const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(fftSize / 2));
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const rafIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!stream) return;

        const initAudio = () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            analyserRef.current = ctx.createAnalyser();
            analyserRef.current.fftSize = fftSize;
            
            sourceRef.current = ctx.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const update = () => {
                if (analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    setFrequencyData(new Uint8Array(dataArray)); // Copy to trigger re-render
                }
                rafIdRef.current = requestAnimationFrame(update);
            };

            update();
        };

        initAudio();

        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
            if (sourceRef.current) {
                sourceRef.current.disconnect();
            }
            // Do not close AudioContext as it might be shared or expensive to recreate constantly
        };
    }, [stream, fftSize]);

    return frequencyData;
};
