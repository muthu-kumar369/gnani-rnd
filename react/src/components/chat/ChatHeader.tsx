import React, { useState, useEffect, useRef } from 'react';
import { eventManager } from '../../utils/eventManager';
import { Wifi, WifiOff, Battery, BatteryCharging, ChevronDown, Check, Search, Share, Menu, Moon, Sun, Monitor, X, Activity, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeviceAwareness } from '../../hooks/useDeviceAwareness';
import { useConversationStore } from '../../store/useConversationStore';
import { useUserStore } from '../../store/useUserStore';
import { useThemeStore } from '../../store/themeStore'; // Import Theme Store
import ShareButton from '../common/ShareButton';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatHeaderProps {
    modelName?: string;
    className?: string;
    onOpenSearch?: () => void;
    onToggleSidebar?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ modelName, className = '', onOpenSearch, onToggleSidebar }) => {
    const { batteryStatus, connectivityStatus, systemStatus } = useDeviceAwareness();
    const { models, fetchModels, selectedModel, setSelectedModel, conversationId, handleModelSelect } = useConversationStore();
    const { accessToken } = useUserStore();
    const { theme, toggleTheme } = useThemeStore(); // Use Theme Store
    const navigate = useNavigate();

    const [isModelOpen, setIsModelOpen] = useState(false);
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (accessToken && models.length === 0) {
            fetchModels(accessToken);
        }
    }, [accessToken, models.length, fetchModels]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsModelOpen(false);
            }
            if (statsRef.current && !statsRef.current.contains(event.target as Node)) {
                setIsStatsOpen(false);
            }
        };

        const handleEscape = () => {
            setIsModelOpen(false);
            setIsStatsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        // Use eventManager for Esc key
        const cleanupEsc = eventManager.addEventListener('keyboard:escape', handleEscape, undefined, 'ChatHeader');

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            cleanupEsc();
        };
    }, []);

    const onModelSelect = async (modelId: string) => {
        setIsModelOpen(false);
        await handleModelSelect(modelId);
    };

    const selectedIdx = models.findIndex(m => m.id === selectedModel);
    // Display logic: Selected Model Name -> First Model Name -> Fallback/Loading
    const displayModel = selectedIdx !== -1
        ? models[selectedIdx].displayName
        : (models.length > 0 ? models[0].displayName : (modelName || 'Loading...'));

    return (
        <div className={`h-16 border-b border-glass-border bg-canvas-popover backdrop-blur-md flex items-center justify-between px-4 md:px-6 ${className} z-20 relative transition-all duration-300`}>
            {/* Left: Menu & Model Selector */}
            <div className="flex items-center gap-3 w-1/3">
                <button
                    onClick={onToggleSidebar}
                    className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsModelOpen(!isModelOpen)}
                        title={displayModel}
                        className="w-[160px] flex items-center justify-between gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 group"
                    >
                        <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">
                            {displayModel}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-transform duration-200 ${isModelOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isModelOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 mt-2 w-64 bg-canvas-popover border border-glass-border rounded-xl shadow-2xl overflow-hidden py-1 z-50"
                            >
                                {models.length > 0 ? (
                                    models.map((model) => (
                                        <button
                                            key={model.id}
                                            onClick={() => onModelSelect(model.id)}
                                            className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-white/5 transition-colors ${selectedModel === model.id ? 'bg-gnani-primary/10 text-gnani-primary' : 'text-gray-300'}`}
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-medium">{model.displayName}</span>
                                                {model.description && <span className="text-[10px] text-gray-500">{model.description}</span>}
                                            </div>
                                            {selectedModel === model.id && <Check className="w-4 h-4 text-gnani-primary" />}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading models...</div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Center: Search Trigger */}


            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-2 w-1/3">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                </button>

                {/* Share Button */}
                {conversationId && (
                    <ShareButton conversationId={conversationId} />
                )}

                {/* System Stats Toggle */}
                <div className="relative" ref={statsRef}>
                    <button
                        onClick={() => setIsStatsOpen(!isStatsOpen)}
                        className={`p-2 rounded-lg transition-colors ${isStatsOpen ? 'text-gnani-primary bg-gnani-primary/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        title="System Status"
                    >
                        <Activity size={18} />
                    </button>

                    {/* Stats Slide-out Panel */}
                    <AnimatePresence>
                        {isStatsOpen && (
                            <motion.div
                                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                className="absolute top-full right-0 mt-3 w-72 bg-canvas-popover backdrop-blur-xl border border-glass-border rounded-2xl shadow-2xl overflow-hidden z-50"
                            >
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Status</span>
                                        <button onClick={() => setIsStatsOpen(false)} className="text-gray-500 hover:text-white">
                                            <X size={14} />
                                        </button>
                                    </div>

                                    {/* CPU & Memory */}
                                    {systemStatus && (
                                        <div className="space-y-3">
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                                        <Cpu size={14} className="text-gnani-primary" />
                                                        <span>CPU Usage</span>
                                                    </div>
                                                    <span className="text-sm font-mono">{Math.round(systemStatus.cpu.usage)}%</span>
                                                </div>
                                                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gnani-primary transition-all duration-500"
                                                        style={{ width: `${Math.min(systemStatus.cpu.usage, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-white/5 rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                                        <Activity size={14} className="text-gnani-secondary" />
                                                        <span>Memory</span>
                                                    </div>
                                                    <span className="text-sm font-mono">{Math.round(systemStatus.memory.usagePercent)}%</span>
                                                </div>
                                                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gnani-secondary transition-all duration-500"
                                                        style={{ width: `${Math.min(systemStatus.memory.usagePercent, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Connectivity */}
                                    {connectivityStatus && (
                                        <div className={`flex items-center justify-between p-3 rounded-lg border ${connectivityStatus.online ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                            <div className="flex items-center gap-2">
                                                {connectivityStatus.online ? <Wifi size={16} className="text-green-400" /> : <WifiOff size={16} className="text-red-400" />}
                                                <span className={`text-sm ${connectivityStatus.online ? 'text-green-400' : 'text-red-400'}`}>
                                                    {connectivityStatus.online ? 'Online' : 'Offline'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500 font-mono">{connectivityStatus.latency || 0}ms</span>
                                        </div>
                                    )}

                                    {/* Battery */}
                                    {batteryStatus && batteryStatus.hasBattery && (
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-2">
                                                {batteryStatus.isCharging ? <BatteryCharging size={16} className="text-yellow-400" /> : <Battery size={16} className="text-gray-400" />}
                                                <span className="text-sm text-gray-300">{Math.round(batteryStatus.level)}%</span>
                                            </div>
                                            <span className="text-xs text-gray-500">{batteryStatus.isCharging ? 'Charging' : 'Battery'}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ChatHeader;
