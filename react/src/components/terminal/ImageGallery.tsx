// react/src/components/terminal/ImageGallery.tsx
import React from 'react';
import ImagePreview from './ImagePreview';
import type { ImageAttachment } from '../../types/vision.types';

interface ImageGalleryProps {
    images: ImageAttachment[];
    onRemove: (imageId: string) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onRemove }) => {
    if (images.length === 0) return null;

    return (
        <div
            style={{
                padding: '8px 0',
                borderTop: '1px solid rgba(0, 255, 0, 0.2)',
                marginBottom: '8px'
            }}
        >
            <div
                style={{
                    color: 'rgba(0, 255, 0, 0.7)',
                    fontSize: '11px',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}
            >
                Attached Images ({images.length})
            </div>
            {images.map((image) => (
                <ImagePreview key={image.id} image={image} onRemove={onRemove} />
            ))}
        </div>
    );
};

export default ImageGallery;
