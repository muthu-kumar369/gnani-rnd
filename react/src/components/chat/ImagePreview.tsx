import React, { useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ImageAttachment } from '../../types/vision.types';

interface ImagePreviewProps {
    image: ImageAttachment;
    onClose: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ image, onClose }) => {
    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    console.log('ImagePreview rendering for:', image.fileName);

    if (!image.url) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                {/* Toolbar */}
                <div className="absolute top-4 right-4 flex items-center gap-4 z-50" onClick={e => e.stopPropagation()}>
                    <a
                        href={image.url}
                        download={image.fileName}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        title="Download"
                    >
                        <Download size={20} />
                    </a>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-red-500/80 rounded-full text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Title */}
                <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
                    <p className="text-white/80 font-medium text-sm drop-shadow-md truncate max-w-md mx-auto">
                        {image.fileName}
                    </p>
                </div>

                {/* Image */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative max-w-full max-h-full"
                    onClick={e => e.stopPropagation()}
                >
                    <img
                        src={image.url}
                        alt={image.fileName}
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/10"
                    />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ImagePreview;
