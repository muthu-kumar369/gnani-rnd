import React, { useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadZoneProps {
    onFileSelect: (file: File) => void;
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
    onFileSelect,
    children,
    disabled,
    className = ''
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = React.useRef(0);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;

        dragCounter.current += 1;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        dragCounter.current -= 1;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        setIsDragging(true);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;

        if (disabled) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            // For now, handle the first file to match existing logic
            // We can expand this to handle multiple files later
            const file = files[0];

            // Basic validation
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert('File size exceeds 10MB limit.');
                return;
            }

            onFileSelect(file);
        }
    };

    return (
        <div
            className={`relative ${className}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {children}

            {/* Drag Overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 rounded-xl bg-jarvis-bg/90 backdrop-blur-sm border-2 border-dashed border-jarvis-blue flex flex-col items-center justify-center animate-in fade-in duration-200">
                    <div className="p-4 rounded-full bg-jarvis-blue/20 mb-3 animate-bounce">
                        <UploadCloud className="w-8 h-8 text-jarvis-blue" />
                    </div>
                    <p className="text-lg font-semibold text-white">Drop file to upload</p>
                    <p className="text-sm text-gray-400 mt-1">Max size: 10MB</p>
                </div>
            )}
        </div>
    );
};

export default FileUploadZone;
