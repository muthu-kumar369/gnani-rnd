// react/src/components/gnani/TokenPreview.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIPC } from '../../hooks/useIPC';

const TokenPreview: React.FC = () => {
    const { latestLLMChunk, isTtsEnded } = useIPC();
    const [previewText, setPreviewText] = useState<string>('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!latestLLMChunk) return;

        try {
            let chunk = latestLLMChunk;
            if (typeof chunk === 'string') {
                try {
                    chunk = JSON.parse(chunk);
                } catch (e) {
                    chunk = { type: 'partial', text: chunk };
                }
            }

            const { type, text } = chunk;

            if (type === 'partial' || type === 'complete_response') {
                if (text) {
                    setPreviewText(prev => {
                        // Simple logic: keep last ~100 chars to avoid overflow, or just show full sentence
                        // For a "preview" effect, showing the last few words is often cooler
                        const newText = prev + text;
                        return newText.slice(-150); // Keep last 150 chars
                    });
                    setIsVisible(true);
                }
            }
        } catch (error) {
            console.error('Error parsing token preview:', error);
        }
    }, [latestLLMChunk]);

    // Clear preview when TTS ends (conversation turn over)
    useEffect(() => {
        if (isTtsEnded) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setPreviewText('');
            }, 1000); // Fade out after 1s
            return () => clearTimeout(timer);
        }
    }, [isTtsEnded]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-2xl text-center pointer-events-none z-40"
                >
                    <div className="bg-black/40 backdrop-blur-md border border-jarvis-cyan/20 rounded-lg p-4 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                        <p className="text-jarvis-cyan/80 font-mono text-sm md:text-base tracking-wide leading-relaxed">
                            {previewText}
                            <span className="inline-block w-2 h-4 ml-1 bg-jarvis-cyan animate-pulse align-middle" />
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TokenPreview;
