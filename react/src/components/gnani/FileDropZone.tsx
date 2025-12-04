import React, { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileDropZoneProps {
    children: React.ReactNode;
    onFileDrop: (files: File[]) => void;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({ children, onFileDrop }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) {
            setIsDragging(true);
        }
    }, [isDragging]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            onFileDrop(files);
        }
    }, [onFileDrop]);

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{ position: 'relative', width: '100%', height: '100%' }}
        >
            <AnimatePresence>
                {isDragging && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm border-2 border-dashed border-jarvis-cyan rounded-lg m-4"
                    >
                        <div className="flex flex-col items-center gap-4 text-jarvis-cyan animate-pulse">
                            <div className="p-4 rounded-full bg-jarvis-cyan/10 shadow-jarvis-glow">
                                <Upload size={48} />
                            </div>
                            <div className="text-2xl font-mono tracking-widest uppercase text-shadow-glow">
                                Drop files to analyze
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {children}
        </div>
    );
};
