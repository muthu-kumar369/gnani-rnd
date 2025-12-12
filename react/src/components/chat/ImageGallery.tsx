import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Image as ImageIcon } from 'lucide-react';
import ImagePreview from './ImagePreview';
import type { ImageAttachment } from '../../types/vision.types';

interface ImageGalleryProps {
    images: ImageAttachment[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
    const [selectedImage, setSelectedImage] = useState<ImageAttachment | null>(null);

    if (!images || images.length === 0) return null;

    return (
        <>
            <div className={`grid gap-2 my-2 ${images.length === 1 ? 'grid-cols-1 max-w-[300px]' :
                images.length === 2 ? 'grid-cols-2' :
                    'grid-cols-2 lg:grid-cols-3'
                }`}>
                {images.map((image) => (
                    <div
                        key={image.id}
                        onClick={() => {
                            console.log('Image clicked:', image.fileName);
                            image.url && setSelectedImage(image);
                        }}
                        className={`group relative aspect-video rounded-lg overflow-hidden border border-cyan-500/20 bg-black/40 cursor-pointer transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 ${!image.url ? 'pointer-events-none opacity-50' : ''}`}
                    >
                        {image.url ? (
                            <img
                                src={image.url}
                                alt={image.fileName}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-cyan-500/40">
                                <ImageIcon size={24} />
                            </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Eye className="text-white drop-shadow-md" size={24} />
                        </div>

                        {/* File Name Tag */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs text-white truncate px-1">
                                {image.fileName}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {selectedImage && createPortal(
                <ImagePreview
                    image={selectedImage}
                    onClose={() => setSelectedImage(null)}
                />,
                document.body
            )}
        </>
    );
};

export default ImageGallery;
