// react/src/hooks/useFileUpload.ts
import { useState } from 'react';
import { fileApi } from '../api/fileApi';
import { useGnaniStore } from '../store/useGnaniStore';
import type { FileAttachment } from '../types/file.types';

export const useFileUpload = (userId: string) => {
    const [isUploading, setIsUploading] = useState(false);
    const { addAttachedFile, updateFileProgress, removeAttachedFile } = useGnaniStore();

    const uploadFile = async (file: File) => {
        const tempId = `temp-${Date.now()}`;

        // Add file to store with temp ID and 0 progress
        const tempAttachment: FileAttachment = {
            id: tempId,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadedAt: new Date(),
            uploadProgress: 0
        };

        addAttachedFile(tempAttachment);
        setIsUploading(true);

        try {
            const response = await fileApi.uploadFile(
                file,
                userId,
                (progress) => {
                    updateFileProgress(tempId, progress);
                }
            );

            // Remove temp file and add real one
            removeAttachedFile(tempId);
            addAttachedFile({
                id: response.file.id,
                fileName: response.file.fileName,
                fileSize: response.file.fileSize,
                mimeType: response.file.mimeType,
                parsedContentPreview: response.file.parsedContentPreview,
                uploadedAt: new Date(response.file.uploadedAt),
                uploadProgress: 100
            });

            return response.file;
        } catch (error: any) {
            // Remove temp file on error
            removeAttachedFile(tempId);

            // STAGE 1: Enhanced error handling for file validation
            const errorMessage = error?.response?.data?.error || error?.message || 'Upload failed';

            // User-friendly error messages
            if (errorMessage.includes('File too large') || errorMessage.includes('too large')) {
                throw new Error(`File exceeds maximum size limit. Please upload a smaller file.`);
            }
            if (errorMessage.includes('Invalid file type') || errorMessage.includes('file type')) {
                throw new Error(`File type not supported. Please upload a valid document.`);
            }
            if (errorMessage.includes('No file uploaded')) {
                throw new Error(`No file selected. Please choose a file to upload.`);
            }

            // Generic error
            throw new Error(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    return {
        uploadFile,
        isUploading
    };
};
