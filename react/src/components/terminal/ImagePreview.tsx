// react/src/components/terminal/ImagePreview.tsx
import React, { useState } from 'react';
import { X, Image as ImageIcon, Loader, AlertCircle } from 'lucide-react';
import type { ImageAttachment } from '../../types/vision.types';

interface ImagePreviewProps {
    image: ImageAttachment;
    onRemove: (imageId: string) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ image, onRemove }) => {
    const [imageError, setImageError] = useState(false);

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getStatusIcon = () => {
        if (image.uploadProgress !== undefined && image.uploadProgress < 100) {
            return <Loader size={16} color="#00ff00" className="animate-spin" />;
        }
        if (imageError) {
            return <AlertCircle size={16} color="#ff0000" />;
        }
        return null;
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                backgroundColor: 'rgba(0, 255, 0, 0.05)',
                border: '1px solid rgba(0, 255, 0, 0.2)',
                borderRadius: '4px',
                marginBottom: '4px',
                position: 'relative'
            }}
        >
            {/* Image Thumbnail */}
            <div
                style={{
                    width: '48px',
                    height: '48px',
                    marginRight: '8px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {image.url && !imageError ? (
                    <img
                        src={image.url}
                        alt={image.fileName}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <ImageIcon size={24} color="rgba(0, 255, 0, 0.5)" />
                )}
            </div>

            {/* Image Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        color: '#00ff00',
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}
                >
                    {image.fileName}
                </div>
                <div
                    style={{
                        color: 'rgba(0, 255, 0, 0.6)',
                        fontSize: '11px'
                    }}
                >
                    {formatFileSize(image.fileSize)}
                    {image.visionAnalysis && ' • Analyzed'}
                </div>
            </div>

            {/* Status/Remove Button */}
            <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {getStatusIcon()}
                {image.uploadProgress !== undefined && image.uploadProgress < 100 ? (
                    <span style={{ color: '#00ff00', fontSize: '11px' }}>
                        {image.uploadProgress}%
                    </span>
                ) : (
                    <button
                        onClick={() => onRemove(image.id)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                        title="Remove image"
                    >
                        <X size={16} color="#ff0000" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ImagePreview;
