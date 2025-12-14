// react/src/components/terminal/FileAttachmentButton.tsx
import React, { useRef } from 'react';
import { Paperclip } from 'lucide-react';

interface FileAttachmentButtonProps {
    onFileSelect: (file: File) => void;
    disabled?: boolean;
}

const FileAttachmentButton: React.FC<FileAttachmentButtonProps> = ({ onFileSelect, disabled }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
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

            onFileSelect(file);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <>
            <button
                onClick={handleClick}
                disabled={disabled}
                className="file-attachment-button p-2 flex items-center justify-center bg-transparent border-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-opacity hover:opacity-80 active:scale-95 transition-transform"
                title="Attach file"
            >
                <Paperclip size={20} className="text-gnani-primary" />
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.doc,.docx,text/plain,text/markdown,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
            />
        </>
    );
};

export default FileAttachmentButton;
