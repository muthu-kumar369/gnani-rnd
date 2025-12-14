import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, X, File as FileIcon, Loader2, ArrowUp, LayoutTemplate } from 'lucide-react';
import voiceModeIcon from '../../assets/voice-mode.png';
import { useConversationStore } from '../../store/useConversationStore';
import FileUploadZone from './FileUploadZone';
import AttachedFilesList from './AttachedFilesList';
import { useUserStore } from '../../store/useUserStore';
import GlassTooltip from '../ui/GlassTooltip';
import GlassDropdown from '../ui/GlassDropdown';
import type { DropdownOption } from '../ui/GlassDropdown';
import DynamicIcon from '../common/DynamicIcon';
import { eventManager } from '../../utils/eventManager';

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
    const [isMultiLine, setIsMultiLine] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        uploadFile,
        templates,
        selectedTemplate,
        setSelectedTemplate,
        fetchTemplates,
        conversationId,
        updateConversationTemplate
    } = useConversationStore();
    const { accessToken } = useUserStore();

    useEffect(() => {
        if (templates.length === 0) {
            fetchTemplates();
        }
    }, [templates.length, fetchTemplates]);

    const templateOptions: DropdownOption[] = [
        { value: 'default', label: 'No Template', icon: <LayoutTemplate size={14} /> },
        ...templates.map(t => ({
            value: t._id,
            label: t.name,
            icon: t.icon ? <DynamicIcon name={t.icon} size={14} /> : <LayoutTemplate size={14} />
        }))
    ];

    const handleTemplateChange = async (val: string) => {
        const newValue = val === 'default' ? '' : val; // Store uses string | null, but empty string can mean cleared too?
        // Actually types said string | null. Let's send null if default.
        const templateId = val === 'default' ? null : val;

        if (conversationId && accessToken) {
            // Update persistent conversation
            await updateConversationTemplate(conversationId, templateId, accessToken);
        } else {
            // Just local state for new chat
            setSelectedTemplate(templateId);
        }
    };

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
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;

            // Check if height implies multiline (approx > 40px) or explicit newline
            setIsMultiLine(scrollHeight > 45 || input.includes('\n'));
        }
    }, [input]);

    // Keyboard focus listener
    useEffect(() => {
        const handleFocus = () => {
            textareaRef.current?.focus();
        };
        const cleanup = eventManager.addEventListener('keyboard:focus-input', handleFocus, undefined, 'ChatInput');
        return cleanup;
    }, []);

    return (
        <div className="w-full px-4 md:px-6 pb-6 pt-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 relative">
            {/* Subtle Animated Progress Strip */}
            {isStreaming && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-shimmer" />
            )}

            {/* Attachments Preview - Floating above */}
            {attachments.length > 0 && (
                <div className="max-w-4xl mx-auto mb-2 animate-slide-up">
                    <AttachedFilesList files={attachments} onRemove={removeAttachment} />
                </div>
            )}

            <FileUploadZone
                onFileSelect={processFileUpload}
                disabled={disabled || isUploading}
                className={`max-w-4xl mx-auto relative bg-[#050A14]/95 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-out !border-none !ring-0 !outline-none group ${isMultiLine
                    ? 'grid grid-cols-2 gap-2 p-4 rounded-[28px]'
                    : 'flex items-end gap-3 p-3 rounded-[26px]'
                    }`}
            >

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {/* Bottom Toolbar: Attach + Template */}
                <div className={`pb-0.5 pl-1 flex items-center gap-1 ${isMultiLine ? 'order-2 col-start-1' : ''}`}>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || isUploading}
                        className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-all duration-200 disabled:opacity-50 group/attach cursor-pointer"
                        aria-label="Attach file"
                    >
                        {isUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                        ) : (
                            <Paperclip className="w-5 h-5 transition-transform group-hover/attach:rotate-45" />
                        )}
                    </button>

                    <GlassDropdown
                        options={templateOptions}
                        value={selectedTemplate || 'default'}
                        onChange={handleTemplateChange}
                        placeholder="Template"
                        className="!bg-white/5 !border-white/10 !py-1.5 !px-3 !text-xs !rounded-lg hover:!bg-white/10 !h-[32px] !w-[160px]"
                        menuClassName="!w-[220px] !mb-2"
                        placement="top-start"
                        disabled={disabled || isStreaming}
                    />
                </div>

                {/* Text Area */}
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    disabled={disabled}
                    placeholder="Message Gnani..."
                    className={`bg-transparent !border-none !outline-none focus:!outline-none focus:!ring-0 focus:!border-none shadow-none ring-0 text-white placeholder-gray-500/80 resize-none max-h-[200px] py-3 text-[16px] leading-[1.6] custom-scrollbar selection:bg-cyan-500/30 transition-all duration-200 ease-in-out ${isMultiLine ? 'order-1 col-span-2 w-full mb-1 px-1' : 'flex-1'
                        }`}
                    rows={1}
                />

                {/* Right Actions */}
                <div className={`flex items-center pb-0.5 pr-1 gap-2 ${isMultiLine ? 'order-3 col-start-2 justify-self-end' : ''}`}>
                    {/* Mic Button */}
                    {!input.trim() && attachments.length === 0 && (
                        <GlassTooltip content="Voice Mode" placement="top">
                            <button
                                onClick={onMicClick}
                                className={`h-10 w-10 flex items-center justify-center rounded-full transition-all duration-200 ${isStreaming
                                    ? 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse cursor-pointer'
                                    : 'bg-transparent text-gray-400 cursor-pointer'
                                    }`}
                                aria-label={isStreaming ? "Stop voice mode" : "Start voice mode"}
                            >
                                {isStreaming ? (
                                    <div onClick={(e) => { e.stopPropagation(); onStop?.(); }} className="h-full w-full flex items-center justify-center relative cursor-pointer">
                                        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                                        <div className="w-3 h-3 bg-red-500 rounded-sm relative z-10" />
                                    </div>
                                ) : (
                                    <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <img
                                            src={voiceModeIcon}
                                            alt="Voice Mode"
                                            className="w-full h-full object-contain scale-180"
                                        />
                                    </div>
                                )}
                            </button>
                        </GlassTooltip>
                    )}

                    {/* Send Button */}
                    <GlassTooltip content="Send Message" placement="top">
                        <button
                            onClick={handleSend}
                            disabled={disabled || isUploading || (!input.trim() && attachments.length === 0)}
                            className={`h-10 w-10 flex items-center justify-center rounded-full transition-all duration-200 ${input.trim() || attachments.length > 0
                                ? 'bg-white text-black hover:bg-gray-200 shadow-lg transform hover:scale-105 cursor-pointer'
                                : 'bg-transparent text-gray-400 cursor-not-allowed hidden'
                                }`}
                            aria-label="Send message"
                        >
                            <ArrowUp className="w-5 h-5" />
                        </button>
                    </GlassTooltip>
                </div>
            </FileUploadZone>

            <div className="text-center mt-3">
                <p className="text-[10px] text-gray-500 font-medium tracking-wide opacity-60">Gnani can make mistakes. Consider checking important info.</p>
            </div>
        </div >
    );
};

export default ChatInput;
