// react/src/types/vision.types.ts
export interface ImageAttachment {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    url?: string;
    thumbnail?: string;
    visionAnalysis?: string;
    uploadProgress?: number;
    uploadedAt: Date;
}

export interface VisionAnalysisResult {
    success: boolean;
    analysis: string;
    metadata: {
        width: number;
        height: number;
        format: string;
        size: number;
    };
    cacheKey?: string;
}

export type AnalysisStatus = 'pending' | 'analyzing' | 'complete' | 'error';
