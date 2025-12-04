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
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        uploadFile,
        isUploading
    };
};
