import React, { useState, useCallback } from 'react';

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
            {isDragging && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none', // Allow drops to pass through if needed, but we handle on parent
                    border: '2px dashed #00ffcc',
                    borderRadius: '8px',
                }}>
                    <div style={{ color: '#00ffcc', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        Drop files to analyze
                    </div>
                </div>
            )}
            {children}
        </div>
    );
};
