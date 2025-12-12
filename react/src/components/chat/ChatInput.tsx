import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, X, File as FileIcon, Loader2 } from 'lucide-react';
import { useConversationStore } from '../../store/useConversationStore';
import FileUploadZone from './FileUploadZone';
import AttachedFilesList from './AttachedFilesList';
import { useUserStore } from '../../store/useUserStore';

interface ChatInputProps {
    onSend: (text: string, attachments?: any[]) => void;
    onMicClick: () => void;
    disabled?: boolean;
    isStreaming?: boolean;
    onStop?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onMicClick, disabled = false, isStreaming = false, onStop }) => {
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { uploadFile } = useConversationStore();
    const { accessToken } = useUserStore();

    const handleSend = () => {
        if (!input.trim() && attachments.length === 0) return;
        onSend(input, attachments);
        setInput('');
        setAttachments([]);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset height
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Reusable upload logic
    const processFileUpload = async (file: File) => {
        if (!accessToken) return;

        setIsUploading(true);
        try {
            const result = await uploadFile(file, accessToken);
            setAttachments(prev => [...prev, result]);
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await processFileUpload(e.target.files[0]);
        }
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file') {
                    const file = items[i].getAsFile();
                    if (file) {
                        e.preventDefault(); // Prevent pasting the file path or binary data as text
                        await processFileUpload(file);
                    }
                }
            }
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    // Auto-resize
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    return (
        <div className="p-2 md:p-4 border-t border-jarvis-border/30 bg-jarvis-bg/80 backdrop-blur-md">
            {/* Attachments Preview */}
            <AttachedFilesList files={attachments} onRemove={removeAttachment} />

            <FileUploadZone
                onFileSelect={processFileUpload}
                disabled={disabled || isUploading}
                className="max-w-4xl mx-auto relative flex items-end gap-2 p-2 bg-white/5 border border-white/10 rounded-xl transition-all"
            >

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {/* Attachment Button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10 disabled:opacity-50"
                    aria-label="Attach file"
                >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>

                {/* Text Area */}
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    disabled={disabled}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 resize-none max-h-[120px] py-2 custom-scrollbar"
                    rows={1}
                />

                {/* Right Actions */}
                <div className="flex items-center gap-1">
                    {input.trim() || attachments.length > 0 ? (
                        <button
                            onClick={handleSend}
                            disabled={disabled || isUploading}
                            className="p-2 bg-jarvis-blue text-white rounded-lg hover:bg-jarvis-blue/90 transition-colors shadow-lg shadow-jarvis-blue/20 disabled:opacity-50"
                            aria-label="Send message"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={onMicClick}
                            className={`p-2 hover:text-white rounded-lg transition-colors ${isStreaming
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                                : 'text-jarvis-text bg-jarvis-bg border border-jarvis-border hover:bg-white/10'
                                }`}
                            aria-label={isStreaming ? "Stop voice mode" : "Start voice mode"}
                        >
                            {isStreaming ? (
                                <div onClick={(e) => { e.stopPropagation(); onStop?.(); }} className="w-5 h-5 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-current rounded-sm animate-pulse" />
                                </div>
                            ) : (
                                <Mic className="w-5 h-5" />
                            )}
                        </button>
                    )}
                </div>
            </FileUploadZone>
            <div className="text-center mt-2">
                <p className="text-[10px] text-gray-500">Gnani can make mistakes. Consider checking important info.</p>
            </div>
        </div>
    );
};

export default ChatInput;
