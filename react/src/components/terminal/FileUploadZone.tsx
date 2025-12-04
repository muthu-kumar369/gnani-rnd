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
            style={{ position: 'relative', width: '100%', height: '100%' }}
        >
            {children}
            {isDragging && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 255, 0, 0.1)',
                        border: '2px dashed #00ff00',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        pointerEvents: 'none'
                    }}
                >
                    <div style={{
                        color: '#00ff00',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                    }}>
                        Drop file here
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploadZone;
