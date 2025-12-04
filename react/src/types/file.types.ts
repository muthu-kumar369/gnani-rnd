// react/src/types/file.types.ts
export interface FileAttachment {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    parsedContentPreview?: string;
    uploadedAt: Date;
    uploadProgress?: number;
}

export interface FileUploadResponse {
    success: boolean;
    file: {
        id: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
        storageMode: 's3' | 'local';
        parsedContentPreview: string;
        uploadedAt: Date;
    };
}
