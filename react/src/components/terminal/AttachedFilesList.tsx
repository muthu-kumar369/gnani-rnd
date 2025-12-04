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
        <div style={{
            padding: '8px 0',
            borderTop: '1px solid rgba(0, 255, 0, 0.2)',
            marginBottom: '8px'
        }}>
            {files.map((file) => (
                <div
                    key={file.id}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(0, 255, 0, 0.05)',
                        border: '1px solid rgba(0, 255, 0, 0.2)',
                        borderRadius: '4px',
                        marginBottom: '4px',
                        position: 'relative'
                    }}
                >
                    <FileText size={16} color="#00ff00" style={{ marginRight: '8px', flexShrink: 0 }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            color: '#00ff00',
                            fontSize: '13px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {file.fileName}
                        </div>
                        <div style={{
                            color: 'rgba(0, 255, 0, 0.6)',
                            fontSize: '11px'
                        }}>
                            {formatFileSize(file.fileSize)}
                        </div>
                    </div>

                    {file.uploadProgress !== undefined && file.uploadProgress < 100 ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '8px'
                        }}>
                            <Loader size={16} color="#00ff00" className="animate-spin" />
                            <span style={{
                                color: '#00ff00',
                                fontSize: '11px',
                                marginLeft: '4px'
                            }}>
                                {file.uploadProgress}%
                            </span>
                        </div>
                    ) : (
                        <button
                            onClick={() => onRemove(file.id)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                marginLeft: '8px'
                            }}
                            title="Remove file"
                        >
                            <X size={16} color="#ff0000" />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default AttachedFilesList;
