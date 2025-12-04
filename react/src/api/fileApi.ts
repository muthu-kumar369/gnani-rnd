// react/src/api/fileApi.ts
import axios from 'axios';
import type { FileUploadResponse } from '../types/file.types';

const API_BASE_URL = 'http://localhost:5000/api';

export const fileApi = {
    /**
     * Upload a file
     */
    async uploadFile(file: File, userId: string, onProgress?: (progress: number) => void): Promise<FileUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);

        const response = await axios.post<FileUploadResponse>(
            `${API_BASE_URL}/files/upload`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent: any) => {
                    if (progressEvent.total && onProgress) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(progress);
                    }
                }
            }
        );

        return response.data;
    },

    /**
     * Delete a file
     */
    async deleteFile(fileId: string, userId: string): Promise<void> {
        await axios.delete(`${API_BASE_URL}/files/${fileId}`, {
            data: { userId }
        });
    }
};
