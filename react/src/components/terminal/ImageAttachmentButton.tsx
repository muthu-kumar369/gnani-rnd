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
                className="image-attachment-button"
                title="Attach image"
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: disabled ? 0.5 : 1,
                    transition: 'opacity 0.2s'
                }}
            >
                <Camera size={20} color="#00ff00" />
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
        </>
    );
};

export default ImageAttachmentButton;
