import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Battery, BatteryCharging, ChevronDown, Cpu, Activity, Check, Search, Share } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeviceAwareness } from '../../hooks/useDeviceAwareness';
import { useConversationStore } from '../../store/useConversationStore';
import { useUserStore } from '../../store/useUserStore';
import ShareModal from '../common/ShareModal';

interface ChatHeaderProps {
    modelName?: string; // Fallback if not in store
    className?: string;
    onOpenSearch?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ modelName = 'Gnani v2.0 (GPT-4o)', className = '', onOpenSearch }) => {
    const { batteryStatus, connectivityStatus, systemStatus } = useDeviceAwareness();
    const { models, fetchModels, selectedModel, setSelectedModel, conversationId, updateConversationModel } = useConversationStore();
    const { accessToken } = useUserStore();
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (accessToken && models.length === 0) {
            fetchModels(accessToken);
        }
    }, [accessToken, models.length, fetchModels]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleModelSelect = async (modelId: string) => {
        setSelectedModel(modelId);
        setIsOpen(false);
        if (conversationId && accessToken) {
            await updateConversationModel(conversationId, modelId, accessToken);
        }
    };

    const selectedIdx = models.findIndex(m => m.id === selectedModel);
    const displayModel = selectedIdx !== -1 ? models[selectedIdx].displayName : (selectedModel || modelName);

    return (
        <div className={`h-14 border-b border-jarvis-border/30 bg-jarvis-bg/50 backdrop-blur-md flex items-center justify-between px-6 ${className} z-20 relative`}>
            {/* Left: Model Selector */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 text-jarvis-text hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors group"
                >
                    <span className="text-lg font-semibold text-jarvis-blue/90 group-hover:text-jarvis-blue">
                        {displayModel}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 group-hover:text-jarvis-text transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-jarvis-bg border border-jarvis-border rounded-xl shadow-xl overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                        {models.length > 0 ? (
                            models.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => handleModelSelect(model.id)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center justify-between"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">{model.displayName}</span>
                                        {model.description && <span className="text-xs text-gray-500">{model.description}</span>}
                                    </div>
                                    {selectedModel === model.id && <Check className="w-4 h-4 text-jarvis-blue" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading models...</div>
                        )}
                    </div>
                )}
            </div>

            {/* Share Button (Task 2.7) */}
            <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title="Share Conversation"
            >
                <Share size={18} />
                <span className="text-sm hidden md:inline">Share</span>
            </button>

            {/* STAGE 2: Advanced Search Button */}
            <button
                onClick={() => onOpenSearch ? onOpenSearch() : navigate('/search')}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title="Advanced Search"
            >
                <Search size={18} />
                <span className="text-sm hidden md:inline">Search</span>
            </button>

            {/* System Stats (CPU/RAM) if available */}
            {systemStatus && (
                <div className="hidden md:flex items-center gap-3 mr-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono bg-white/5 px-2 py-1 rounded border border-white/5">
                        <Cpu className="w-3 h-3 text-cyan-400" />
                        <span>{Math.round(systemStatus.cpu.usage)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono bg-white/5 px-2 py-1 rounded border border-white/5">
                        <Activity className="w-3 h-3 text-purple-400" />
                        <span>{Math.round(systemStatus.memory.usagePercent)}%</span>
                    </div>
                </div>
            )}

            {/* Network */}
            {connectivityStatus && (
                <div className={`flex items-center gap-1.5 text-xs font-mono bg-black/20 px-2 py-1 rounded border ${connectivityStatus.online ? 'border-green-500/20 text-green-400' : 'border-red-500/20 text-red-400'}`}>
                    {connectivityStatus.online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                    <span>{connectivityStatus.online ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
            )}

            {/* Battery */}
            {batteryStatus && batteryStatus.hasBattery && (
                <div className={`flex items-center gap-1.5 text-xs font-mono bg-black/20 px-2 py-1 rounded border ${batteryStatus.isCharging ? 'border-jarvis-blue/30 text-jarvis-blue' : 'border-white/10'}`}>
                    {batteryStatus.isCharging ?
                        <BatteryCharging className="w-3.5 h-3.5" /> :
                        <Battery className="w-3.5 h-3.5" />
                    }
                    <span>{Math.round(batteryStatus.level)}%</span>
                </div>
            )}
            {/* Share Modal */}
            {isShareModalOpen && conversationId && (
                <ShareModal
                    conversationId={conversationId}
                    onClose={() => setIsShareModalOpen(false)}
                />
            )}
        </div>
    );
};

export default ChatHeader;
