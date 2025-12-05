import React, { useEffect, useRef, useState } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { motion } from 'framer-motion';
import { Terminal, ChevronDown, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { useConversationStore } from '../../store/useConversationStore';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { useGnaniStore } from '../../store/useGnaniStore';
import { useDeviceAwareness } from '../../hooks/useDeviceAwareness';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useUserStore } from '../../store/useUserStore';
import { useAudioStream } from '../../hooks/useAudioStream';
import MessageBubble from './MessageBubble';
import DateSeparator from './DateSeparator';
import { isSameDate } from '../../utils/date-formatter';
import StateIndicator from './StateIndicator';
import ActionIndicator from './ActionIndicator';
import TextInput from './TextInput';
import FileUploadZone from './FileUploadZone';
import AttachedFilesList from './AttachedFilesList';
import ImageGallery from './ImageGallery';
import TypingIndicator from './TypingIndicator';
import '../../styles/typingIndicator.css';

interface TerminalPanelProps {
    isVisible: boolean;
    onToggle: () => void;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ isVisible, onToggle }) => {
    const { sendText } = useAudioStream();
    const {
        messages,
        clearMessages,
        title,
        sendMessage,
        sessionId,
        selectedModel,
        selectedTemplate,
        setSelectedModel,
        setSelectedTemplate,
        updateConversationModel,
        updateConversationTemplate
    } = useConversationStore();
    const { lastUsedModel, lastUsedTemplate, setLastUsedModel, setLastUsedTemplate, savePreferences } = usePreferencesStore();
    const { user, accessToken } = useUserStore();
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
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    // showInput is now always true by default for better UX
    const [showInput] = useState(true);

    // File upload hook
    const { uploadFile, isUploading: isUploadingFile } = useFileUpload('default-user');

    // Image upload hook
    const { uploadImage, isUploading: isUploadingImage } = useImageUpload('default-user');

    // Initialize from preferences on mount
    useEffect(() => {
        if (lastUsedModel && !selectedModel) {
            setSelectedModel(lastUsedModel);
        }
        if (lastUsedTemplate && !selectedTemplate) {
            setSelectedTemplate(lastUsedTemplate);
        }
    }, [lastUsedModel, lastUsedTemplate, selectedModel, selectedTemplate, setSelectedModel, setSelectedTemplate]);

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

    const handleModelChange = async (modelId: string) => {
        setSelectedModel(modelId);
        setLastUsedModel(modelId);
        if (sessionId && accessToken) {
            await updateConversationModel(sessionId, modelId, accessToken);
        }
        if (accessToken) {
            await savePreferences(accessToken);
        }
    };

    const handleTemplateChange = async (templateId: string) => {
        setSelectedTemplate(templateId);
        setLastUsedTemplate(templateId);
        if (sessionId && accessToken) {
            await updateConversationTemplate(sessionId, templateId, accessToken);
        }
        if (accessToken) {
            await savePreferences(accessToken);
        }
    };

    const handleSendText = async (text: string) => {
        if (!accessToken) {
            console.error("No access token available");
            return;
        }

        // Include file IDs and image IDs if attachments exist
        const fileIds = attachedFiles.map(f => f.id);
        const imageIds = attachedImages.map(img => img.id);

        console.log('Sending attachments:', fileIds, imageIds);

        // Use the unified sendMessage action
        // Always pass sendText if available, the store handles the fallback logic
        await sendMessage(text, accessToken, sendText);

        // Clear attached files and images after sending
        if (attachedFiles.length > 0) {
            clearAttachedFiles();
        }
        if (attachedImages.length > 0) {
            clearAttachedImages();
        }

        // Trigger state transition to 'thinking'
        transition('text-input');
    };

    // Auto-scroll to bottom
    // Auto-scroll handled by Virtuoso's followOutput
    useEffect(() => {
        if (messages.length > 0) {
            // Small delay to ensure content is rendered
            setTimeout(() => {
                virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: 'end', behavior: 'smooth' });
            }, 100);
        }
    }, [messages.length, isVisible, isExpanded]);

    if (!isVisible) return null;

    return (
        <FileUploadZone onFileDrop={handleFileSelect} disabled={isUploadingFile || isUploadingImage}>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className={`fixed left-4 bottom-4 z-50 flex flex-col glass-panel rounded-lg overflow-hidden transition-all duration-300 ${isExpanded ? 'w-[600px] h-[80vh]' : 'w-[400px] h-[300px]'
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

                        {/* Keyboard toggle removed as input is now always visible/accessible via bottom area */}

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
                <div className="relative z-10 flex-1 overflow-hidden p-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-cyan-500/30 gap-2">
                            <Terminal size={32} />
                            <p className="text-xs font-mono">System Ready. Waiting for input...</p>
                        </div>
                    ) : (
                        <Virtuoso
                            ref={virtuosoRef}
                            style={{ height: '100%' }}
                            className="custom-scrollbar"
                            data={messages}
                            followOutput={'auto'}
                            itemContent={(index, msg) => {
                                const isLatest = index === messages.length - 1;
                                const prevMsg = index > 0 ? messages[index - 1] : null;
                                const showDateSeparator = !prevMsg || !isSameDate(msg.timestamp, prevMsg.timestamp);

                                return (
                                    <div className="pb-2">
                                        {showDateSeparator && <DateSeparator timestamp={msg.timestamp} />}
                                        {msg.type === 'system' ? (
                                            <StateIndicator message={msg} />
                                        ) : msg.type === 'action' ? (
                                            <ActionIndicator message={msg} />
                                        ) : (
                                            <MessageBubble
                                                message={msg}
                                                isLatest={isLatest}
                                                showTimestamp={user?.settings?.showTimestamps !== false}
                                            />
                                        )}
                                    </div>
                                );
                            }}
                            components={{
                                Footer: () => (
                                    <div className="pb-4">
                                        <TypingIndicator status={typingStatus} message={typingMessage} />
                                    </div>
                                )
                            }}
                        />
                    )}
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

                {/* Text Input Area with New Modern Design */}
                <div className="relative">
                    <TextInput
                        isVisible={showInput}
                        onClose={() => { /* No-op or maybe minimize? For now, keep it open */ }}
                        onSend={handleSendText}
                        onFileSelect={handleFileSelect}
                        onImageSelect={handleImageSelect}
                        selectedModel={selectedModel}
                        selectedTemplate={selectedTemplate}
                        onModelChange={handleModelChange}
                        onTemplateChange={handleTemplateChange}
                        disabled={isUploadingFile || isUploadingImage}
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
