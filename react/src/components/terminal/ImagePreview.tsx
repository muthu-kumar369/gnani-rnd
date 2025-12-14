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
            return <Loader size={16} className="text-gnani-primary animate-spin" />;
        }
        if (imageError) {
            return <AlertCircle size={16} className="text-status-error" />;
        }
        return null;
    };

    return (
        <div className="flex items-center p-2 bg-gnani-primary/5 border border-gnani-primary/20 rounded mb-1 relative group">
            {/* Image Thumbnail */}
            <div className="w-12 h-12 mr-2 rounded overflow-hidden bg-canvas-surface/50 flex items-center justify-center shrink-0 border border-gnani-primary/10">
                {image.url && !imageError ? (
                    <img
                        src={image.url}
                        alt={image.fileName}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <ImageIcon size={24} className="text-gnani-primary/50" />
                )}
            </div>

            {/* Image Info */}
            <div className="flex-1 min-w-0">
                <div className="text-gnani-primary text-[13px] whitespace-nowrap overflow-hidden text-ellipsis font-medium">
                    {image.fileName}
                </div>
                <div className="text-gnani-primary/60 text-[11px] flex gap-1">
                    <span>{formatFileSize(image.fileSize)}</span>
                    {image.visionAnalysis && <span>• Analyzed</span>}
                </div>
            </div>

            {/* Status/Remove Button */}
            <div className="ml-2 flex items-center gap-1">
                {getStatusIcon()}
                {image.uploadProgress !== undefined && image.uploadProgress < 100 ? (
                    <span className="text-gnani-primary text-[11px]">
                        {image.uploadProgress}%
                    </span>
                ) : (
                    <button
                        onClick={() => onRemove(image.id)}
                        className="p-1 bg-transparent border-0 cursor-pointer flex items-center hover:bg-status-error/10 rounded transition-colors"
                        title="Remove image"
                    >
                        <X size={16} className="text-status-error" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ImagePreview;
