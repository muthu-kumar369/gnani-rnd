import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ChevronDown, Trash2, Maximize2, Minimize2, Keyboard } from 'lucide-react';
import { useConversationStore } from '../../store/useConversationStore';
import { useGnaniStore } from '../../store/useGnaniStore';
import { useDeviceAwareness } from '../../hooks/useDeviceAwareness';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useUserStore } from '../../store/useUserStore';
import MessageBubble from './MessageBubble';
import DateSeparator from './DateSeparator';
import { isSameDate } from '../../utils/date-formatter';
import StateIndicator from './StateIndicator';
import ActionIndicator from './ActionIndicator';
import TextInput from './TextInput';
import FileUploadZone from './FileUploadZone';
import FileAttachmentButton from './FileAttachmentButton';
import AttachedFilesList from './AttachedFilesList';
import ImageAttachmentButton from './ImageAttachmentButton';
import ImageGallery from './ImageGallery';
import TypingIndicator from './TypingIndicator';
import '../../styles/typingIndicator.css';

interface TerminalPanelProps {
    isVisible: boolean;
    onToggle: () => void;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ isVisible, onToggle }) => {
    const { messages, clearMessages, title } = useConversationStore();
    const { user } = useUserStore();
    const {
        transition,
        attachedFiles,
        removeAttachedFile,
        clearAttachedFiles,
        attachedImages,
        removeAttachedImage,
        clearAttachedImages,
        typingStatus,
        typingMessage
    } = useGnaniStore();
    const { systemStatus, connectivityStatus } = useDeviceAwareness();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showInput, setShowInput] = useState(false);

    // File upload hook
    const { uploadFile, isUploading: isUploadingFile } = useFileUpload('default-user');

    // Image upload hook
    const { uploadImage, isUploading: isUploadingImage } = useImageUpload('default-user');

    const handleFileSelect = async (file: File) => {
        try {
            await uploadFile(file);
        } catch (error) {
            console.error('File upload failed:', error);
            alert('Failed to upload file. Please try again.');
        }
    };

    const handleImageSelect = async (file: File) => {
        try {
            await uploadImage(file);
        } catch (error) {
            console.error('Image upload failed:', error);
            alert('Failed to upload image. Please try again.');
        }
    };

    const handleSendText = (text: string) => {
        if (window.gnani && window.gnani.stream && window.gnani.stream.sendText) {
            // Include file IDs and image IDs if attachments exist
            const fileIds = attachedFiles.map(f => f.id);
            const imageIds = attachedImages.map(img => img.id);

            // Send text to backend (you may need to modify backend to accept fileIds and imageIds)
            console.log('Sending attachments:', fileIds, imageIds);
            window.gnani.stream.sendText(text);

            // Clear attached files and images after sending
            if (attachedFiles.length > 0) {
                clearAttachedFiles();
            }
            if (attachedImages.length > 0) {
                clearAttachedImages();
            }

            // Trigger state transition to 'thinking'
            transition('text-input');
        } else {
            console.error("gnani.stream.sendText is not available");
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isVisible, isExpanded]);

    if (!isVisible) return null;

    return (
        <FileUploadZone onFileDrop={handleFileSelect} disabled={isUploadingFile || isUploadingImage}>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className={`fixed left-4 bottom-4 z-40 flex flex-col glass-panel rounded-lg overflow-hidden transition-all duration-300 ${isExpanded ? 'w-[600px] h-[80vh]' : 'w-[400px] h-[300px]'
                    }`}
            >
                {/* Holographic Grid Background */}
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-grid-pattern" />

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between px-4 py-2 bg-cyan-950/50 border-b border-cyan-500/30">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <Terminal size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {title ? (title.length > 30 ? `${title.substring(0, 30)}...` : title) : 'Gnani Terminal'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={clearMessages}
                            className="p-1.5 text-cyan-400/60 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                            title="Clear History"
                        >
                            <Trash2 size={12} />
                        </button>

                        <button
                            onClick={() => setShowInput(!showInput)}
                            className={`p-1.5 rounded transition-colors ${showInput ? 'text-cyan-300 bg-cyan-900/40' : 'text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-900/20'}`}
                            title="Toggle Keyboard Input"
                        >
                            <Keyboard size={12} />
                        </button>

                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1.5 text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-900/20 rounded transition-colors"
                            title={isExpanded ? "Minimize" : "Maximize"}
                        >
                            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                        </button>

                        <button
                            onClick={onToggle}
                            className="p-1.5 text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-900/20 rounded transition-colors"
                            title="Close Terminal"
                        >
                            <ChevronDown size={14} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    ref={scrollRef}
                    className="relative z-10 flex-1 overflow-y-auto p-4 custom-scrollbar scroll-smooth"
                >
                    <AnimatePresence initial={false}>
                        {messages.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center text-cyan-500/30 gap-2"
                            >
                                <Terminal size={32} />
                                <p className="text-xs font-mono">System Ready. Waiting for input...</p>
                            </motion.div>
                        ) : (
                            messages.map((msg, index) => {
                                const isLatest = index === messages.length - 1;
                                const prevMsg = index > 0 ? messages[index - 1] : null;
                                const showDateSeparator = !prevMsg || !isSameDate(msg.timestamp, prevMsg.timestamp);

                                if (msg.type === 'system') {
                                    return <StateIndicator key={msg.id} message={msg} />;
                                }

                                if (msg.type === 'action') {
                                    return <ActionIndicator key={msg.id} message={msg} />;
                                }

                                return (
                                    <React.Fragment key={msg.id}>
                                        {showDateSeparator && <DateSeparator timestamp={msg.timestamp} />}
                                        <MessageBubble
                                            message={msg}
                                            isLatest={isLatest}
                                            showTimestamp={user?.settings?.showTimestamps !== false}
                                        />
                                    </React.Fragment>
                                );
                            })
                        )}

                        {/* Typing Indicator */}
                        <TypingIndicator status={typingStatus} message={typingMessage} />
                    </AnimatePresence>
                </div>

                {/* Attached Files List */}
                {attachedFiles.length > 0 && (
                    <div className="relative z-10 px-4">
                        <AttachedFilesList
                            files={attachedFiles}
                            onRemove={removeAttachedFile}
                        />
                    </div>
                )}

                {/* Attached Images Gallery */}
                {attachedImages.length > 0 && (
                    <div className="relative z-10 px-4">
                        <ImageGallery
                            images={attachedImages}
                            onRemove={removeAttachedImage}
                        />
                    </div>
                )}

                {/* Text Input Area with File and Image Attachment Buttons */}
                <div className="relative z-10">
                    {showInput && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-cyan-950/30 border-t border-cyan-500/20">
                            <FileAttachmentButton
                                onFileSelect={handleFileSelect}
                                disabled={isUploadingFile || isUploadingImage}
                            />
                            <ImageAttachmentButton
                                onImageSelect={handleImageSelect}
                                disabled={isUploadingFile || isUploadingImage}
                            />
                        </div>
                    )}
                    <TextInput
                        isVisible={showInput}
                        onClose={() => setShowInput(false)}
                        onSend={handleSendText}
                    />
                </div>

                {/* Footer / Input Status */}
                <div className="relative z-10 px-4 py-1.5 bg-cyan-950/30 border-t border-cyan-500/20 flex justify-between items-center text-[10px] font-mono text-cyan-500/60">
                    <span>STATUS: {connectivityStatus?.online ? 'ONLINE' : 'OFFLINE'}</span>
                    <span>MEM: {systemStatus?.memory.usagePercent ? `${Math.round(systemStatus.memory.usagePercent)}%` : '--%'}</span>
                </div>
            </motion.div>
        </FileUploadZone>
    );
};

export default TerminalPanel;
