// react/src/api/fileApi.ts
import { apiClient } from './apiClient';
import type { FileUploadResponse } from '../types/file.types';

const API_BASE_URL = 'http://localhost:3000/api/v1'; // Updated to match apiClient base URL

export const fileApi = {
    /**
     * Upload a file
     */
    async uploadFile(file: File, userId: string, onProgress?: (progress: number) => void): Promise<FileUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);

        // Using XMLHttpRequest for upload progress since fetch doesn't support it natively yet
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_BASE_URL}/files/upload`);

            // Add auth token if available
            const token = localStorage.getItem('accessToken');
            if (token) {
                xhr.setRequestHeader('x-auth-token', token);
            }

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                    const progress = Math.round((event.loaded * 100) / event.total);
                    onProgress(progress);
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            };

            xhr.onerror = () => reject(new Error('Upload network error'));

            xhr.send(formData);
        });
    },

    /**
     * Delete a file
     */
    async deleteFile(fileId: string, _userId: string): Promise<void> {
        return apiClient.delete(`/files/${fileId}`);
    }
};
