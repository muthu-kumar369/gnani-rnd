// react/src/hooks/useImageUpload.ts
import { useState } from 'react';
import { fileApi } from '../api/fileApi';
import { useGnaniStore } from '../store/useGnaniStore';
import type { ImageAttachment } from '../types/vision.types';

export const useImageUpload = (userId: string) => {
    const [isUploading, setIsUploading] = useState(false);
    const { addAttachedImage, updateImageProgress, removeAttachedImage, setImageAnalysisStatus } = useGnaniStore();

    const uploadImage = async (file: File) => {
        const tempId = `temp-img-${Date.now()}`;

        // Create object URL for preview
        const url = URL.createObjectURL(file);

        // Add image to store with temp ID and 0 progress
        const tempAttachment: ImageAttachment = {
            id: tempId,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            url,
            uploadedAt: new Date(),
            uploadProgress: 0
        };

        addAttachedImage(tempAttachment);
        setImageAnalysisStatus(tempId, 'pending');
        setIsUploading(true);

        try {
            const response = await fileApi.uploadFile(
                file,
                userId,
                (progress) => {
                    updateImageProgress(tempId, progress);
                }
            );

            // Remove temp image and add real one
            removeAttachedImage(tempId);

            // Revoke temp URL
            URL.revokeObjectURL(url);

            addAttachedImage({
                id: response.file.id,
                fileName: response.file.fileName,
                fileSize: response.file.fileSize,
                mimeType: response.file.mimeType,
                visionAnalysis: response.file.parsedContentPreview,
                uploadedAt: new Date(response.file.uploadedAt),
                uploadProgress: 100
            });

            setImageAnalysisStatus(response.file.id, 'complete');

            return response.file;
        } catch (error: any) {
            // Remove temp image on error
            removeAttachedImage(tempId);
            URL.revokeObjectURL(url);
            setImageAnalysisStatus(tempId, 'error');
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        uploadImage,
        isUploading
    };
};
