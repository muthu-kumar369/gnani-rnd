// react/src/components/terminal/ImageAttachmentButton.tsx
import React, { useRef } from 'react';
import { Camera } from 'lucide-react';

interface ImageAttachmentButtonProps {
    onImageSelect: (file: File) => void;
    disabled?: boolean;
}

const ImageAttachmentButton: React.FC<ImageAttachmentButtonProps> = ({ onImageSelect, disabled }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate image type
            const allowedTypes = [
                'image/png',
                'image/jpeg',
                'image/jpg',
                'image/gif',
                'image/webp'
            ];

            if (!allowedTypes.includes(file.type)) {
                alert('Invalid image type. Only PNG, JPG, GIF, and WebP are allowed.');
                return;
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size exceeds 5MB limit.');
                return;
            }

            onImageSelect(file);
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
                className="image-attachment-button p-2 flex items-center justify-center bg-transparent border-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-opacity hover:opacity-80 active:scale-95 transition-transform"
                title="Attach image"
            >
                <Camera size={20} className="text-gnani-primary" />
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
            />
        </>
    );
};

export default ImageAttachmentButton;
