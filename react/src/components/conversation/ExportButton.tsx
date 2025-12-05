import React, { useState, useRef, useEffect } from 'react';
import { Download, FileJson, FileText } from 'lucide-react';
import { downloadFile } from '../../utils/download';

interface ExportButtonProps {
    sessionId: string;
    className?: string;
    asMenuItem?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({ sessionId, className = '', asMenuItem = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleExport = async (format: 'markdown' | 'json') => {
        setIsOpen(false);
        const API_BASE_URL = 'http://localhost:3000/api';
        const url = `${API_BASE_URL}/conversations/${sessionId}/export/${format}`;

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(url, {
                headers: {
                    'x-auth-token': token || ''
                }
            });

            if (!response.ok) {
                console.error('Export failed');
                return;
            }

            const blob = await response.blob();
            const filename = `conversation-${sessionId}.${format === 'markdown' ? 'md' : 'json'}`;
            downloadFile(blob, filename);

        } catch (error) {
            console.error('Export error:', error);
        }
    };

    // Render as menu item (for use inside ConversationListItem menu)
    if (asMenuItem) {
        return (
            <div className={`relative ${className}`} ref={dropdownRef}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan transition-colors flex items-center gap-2"
                >
                    <Download size={12} />
                    Export
                </button>

                {isOpen && (
                    <div className="absolute left-full top-0 ml-1 w-32 bg-black/95 border border-jarvis-blue/40 rounded shadow-[0_0_15px_rgba(0,240,255,0.1)] z-50 overflow-hidden backdrop-blur-sm">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleExport('markdown');
                            }}
                            className="w-full flex items-center px-3 py-2 text-xs text-gray-300 hover:bg-jarvis-blue/20 hover:text-jarvis-cyan transition-colors text-left"
                        >
                            <FileText size={12} className="mr-2" />
                            Markdown
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleExport('json');
                            }}
                            className="w-full flex items-center px-3 py-2 text-xs text-gray-300 hover:bg-jarvis-blue/20 hover:text-jarvis-cyan transition-colors text-left"
                        >
                            <FileJson size={12} className="mr-2" />
                            JSON
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Render as standalone button (original behavior)
    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1 hover:bg-jarvis-cyan/20 rounded text-jarvis-cyan transition-colors"
                title="Export Conversation"
            >
                <Download size={12} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-black/90 border border-jarvis-blue/30 rounded shadow-[0_0_15px_rgba(0,240,255,0.1)] z-50 overflow-hidden backdrop-blur-sm">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleExport('markdown');
                        }}
                        className="w-full flex items-center px-3 py-2 text-xs text-gray-300 hover:bg-jarvis-blue/20 hover:text-jarvis-cyan transition-colors text-left"
                    >
                        <FileText size={12} className="mr-2" />
                        Markdown
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleExport('json');
                        }}
                        className="w-full flex items-center px-3 py-2 text-xs text-gray-300 hover:bg-jarvis-blue/20 hover:text-jarvis-cyan transition-colors text-left"
                    >
                        <FileJson size={12} className="mr-2" />
                        JSON
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExportButton;
