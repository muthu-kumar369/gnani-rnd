// react/src/components/terminal/AttachedFilesList.tsx
import React from 'react';
import { X, FileText, Loader } from 'lucide-react';
import type { FileAttachment } from '../../types/file.types';

interface AttachedFilesListProps {
    files: FileAttachment[];
    onRemove: (fileId: string) => void;
}

const AttachedFilesList: React.FC<AttachedFilesListProps> = ({ files, onRemove }) => {
    if (files.length === 0) return null;

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="py-2 border-t border-gnani-primary/20 mb-2">
            {files.map((file) => (
                <div
                    key={file.id}
                    className="flex items-center p-2 px-3 bg-gnani-primary/5 border border-gnani-primary/20 rounded mb-1 relative"
                >
                    <FileText size={16} className="text-gnani-primary mr-2 shrink-0" />

                    <div className="flex-1 min-w-0">
                        <div className="text-gnani-primary text-[13px] whitespace-nowrap overflow-hidden text-ellipsis">
                            {file.fileName}
                        </div>
                        <div className="text-gnani-primary/60 text-[11px]">
                            {formatFileSize(file.fileSize)}
                        </div>
                    </div>

                    {file.uploadProgress !== undefined && file.uploadProgress < 100 ? (
                        <div className="flex items-center ml-2">
                            <Loader size={16} className="text-gnani-primary animate-spin" />
                            <span className="text-gnani-primary text-[11px] ml-1">
                                {file.uploadProgress}%
                            </span>
                        </div>
                    ) : (
                        <button
                            onClick={() => onRemove(file.id)}
                            className="bg-transparent border-0 cursor-pointer p-1 flex items-center ml-2 hover:bg-status-error/10 rounded transition-colors"
                            title="Remove file"
                        >
                            <X size={16} className="text-status-error" />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default AttachedFilesList;
