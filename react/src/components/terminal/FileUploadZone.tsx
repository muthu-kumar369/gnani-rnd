// react/src/components/terminal/FileUploadZone.tsx
import React, { useState } from 'react';
import type { DragEvent } from 'react';

interface FileUploadZoneProps {
    onFileDrop: (file: File) => void;
    children: React.ReactNode;
    disabled?: boolean;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onFileDrop, children, disabled }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const file = files[0]; // Only take first file

            // Validate file type
            const allowedTypes = [
                'application/pdf',
                'text/plain',
                'text/markdown',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!allowedTypes.includes(file.type)) {
                alert('Invalid file type. Only PDF, DOC, DOCX, TXT, and MD files are allowed.');
                return;
            }

            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size exceeds 10MB limit.');
                return;
            }

            onFileDrop(file);
        }
    };

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="relative w-full h-full"
        >
            {children}
            {isDragging && (
                <div className="absolute inset-0 bg-gnani-primary/10 border-2 border-dashed border-gnani-primary flex items-center justify-center z-50 pointer-events-none">
                    <div className="text-gnani-primary text-lg font-bold drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                        Drop file here
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploadZone;
