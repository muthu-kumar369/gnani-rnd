import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ChevronDown, Trash2, Maximize2, Minimize2, Keyboard } from 'lucide-react';
import { useConversation } from '../../context/ConversationContext';
import { useGnaniStateContext } from '../../context/GnaniStateContext';
import { useDeviceAwareness } from '../../hooks/useDeviceAwareness';
import MessageBubble from './MessageBubble';
import StateIndicator from './StateIndicator';
import ActionIndicator from './ActionIndicator';
import TextInput from './TextInput';

interface TerminalPanelProps {
    isVisible: boolean;
    onToggle: () => void;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ isVisible, onToggle }) => {
    const { messages, clearMessages, addMessage } = useConversation();
    const { transition } = useGnaniStateContext();
    const { systemStatus, connectivityStatus } = useDeviceAwareness();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showInput, setShowInput] = useState(false);

    const handleSendText = (text: string) => {
        if (window.gnani && window.gnani.stream && window.gnani.stream.sendText) {
            // 1. Send text to backend
            window.gnani.stream.sendText(text);

            // 2. Trigger state transition to 'thinking'
            transition('text-input');

            // 3. Optimistically add message to conversation
            addMessage({
                type: 'user',
                message: text,
            });
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
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed left-4 bottom-4 z-40 flex flex-col bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.15)] overflow-hidden transition-all duration-300 ${isExpanded ? 'w-[600px] h-[80vh]' : 'w-[400px] h-[300px]'
                }`}
        >
            {/* Holographic Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                }}
            />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-4 py-2 bg-cyan-950/50 border-b border-cyan-500/30">
                <div className="flex items-center gap-2 text-cyan-400">
                    <Terminal size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Gnani Terminal</span>
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

                            if (msg.type === 'system') {
                                return <StateIndicator key={msg.id} message={msg} />;
                            }

                            if (msg.type === 'action') {
                                return <ActionIndicator key={msg.id} message={msg} />;
                            }

                            return (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    isLatest={isLatest}
                                />
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Text Input Area */}
            <TextInput
                isVisible={showInput}
                onClose={() => setShowInput(false)}
                onSend={handleSendText}
            />

            {/* Footer / Input Status */}
            <div className="relative z-10 px-4 py-1.5 bg-cyan-950/30 border-t border-cyan-500/20 flex justify-between items-center text-[10px] font-mono text-cyan-500/60">
                <span>STATUS: {connectivityStatus?.online ? 'ONLINE' : 'OFFLINE'}</span>
                <span>MEM: {systemStatus?.memory.usagePercent ? `${Math.round(systemStatus.memory.usagePercent)}%` : '--%'}</span>
            </div>
        </motion.div>
    );
};

export default TerminalPanel;
