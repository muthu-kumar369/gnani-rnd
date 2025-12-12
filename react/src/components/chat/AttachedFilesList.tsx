import React from 'react';
import { X, FileText, Loader2, FileCode, FileImage, File } from 'lucide-react';
import type { FileAttachment } from '../../types/file.types';

interface AttachedFilesListProps {
    files: any[]; // Using any[] for flexibility since Store might return different shapes initially, but we map to display
    onRemove: (index: number) => void;
}

const AttachedFilesList: React.FC<AttachedFilesListProps> = ({ files, onRemove }) => {
    if (files.length === 0) return null;

    const formatFileSize = (bytes: number): string => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <FileImage size={16} className="text-pink-400" />;
        if (mimeType === 'text/plain' || mimeType === 'application/json') return <FileCode size={16} className="text-yellow-400" />;
        if (mimeType === 'application/pdf') return <FileText size={16} className="text-red-400" />;
        return <File size={16} className="text-blue-400" />;
    };

    return (
        <div className="flex gap-2 mb-2 overflow-x-auto custom-scrollbar pb-1">
            {files.map((file, index) => {
                // Handle potentially different file structures (Store vs File object vs serialized)
                const name = file.fileName || file.name || 'File';
                const size = file.fileSize || file.size || 0;
                const type = file.mimeType || file.type || '';
                const isUploading = file.uploadProgress !== undefined && file.uploadProgress < 100;

                return (
                    <div
                        key={file.id || index}
                        className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg pl-3 pr-2 py-2 min-w-[200px] max-w-[250px] shrink-0 group relative hover:bg-white/10 transition-colors"
                    >
                        {getFileIcon(type)}

                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <span className="text-xs text-gray-200 truncate font-medium">{name}</span>
                            <span className="text-[10px] text-gray-500">{formatFileSize(size)}</span>
                        </div>

                        {isUploading ? (
                            <div className="flex items-center gap-1">
                                <Loader2 size={12} className="animate-spin text-jarvis-blue" />
                                <span className="text-[10px] text-jarvis-blue">{file.uploadProgress}%</span>
                            </div>
                        ) : (
                            <button
                                onClick={() => onRemove(index)}
                                className="p-1 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-md transition-colors"
                                title="Remove file"
                            >
                                <X size={14} />
                            </button>
                        )}

                        {/* Progress Bar (Bottom) - Optional visual cue */}
                        {isUploading && (
                            <div className="absolute bottom-0 left-0 h-[2px] bg-jarvis-blue transition-all duration-300 rounded-b-lg" style={{ width: `${file.uploadProgress}%` }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default AttachedFilesList;
