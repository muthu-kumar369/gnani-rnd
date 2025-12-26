import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ToggleLeft, ToggleRight, Box, Calculator, Globe, FolderOpen, Terminal, Check, X } from 'lucide-react';
import type { Tool } from '../../api/toolService';
import { useThemeStore } from '../../store/themeStore';
import Button from '../ui/Button';

interface ToolCardProps {
    tool: Tool;
    onToggle: (id: string, isEnabled: boolean) => void;
    onUpdateConfig: (id: string, config: any) => void;
}

const ICON_MAP: Record<string, any> = {
    Box, Calculator, Globe, FolderOpen, Terminal
};

const ToolCard: React.FC<ToolCardProps> = ({ tool, onToggle, onUpdateConfig }) => {
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const { theme } = useThemeStore();
    const [config, setConfig] = useState(JSON.stringify(tool.config, null, 2));
    const [configError, setConfigError] = useState<string | null>(null);

    const Icon = ICON_MAP[tool.icon] || Box;

    const handleConfigSave = () => {
        try {
            const parsedConfig = JSON.parse(config);
            onUpdateConfig(tool._id, parsedConfig);
            setIsConfigOpen(false);
            setConfigError(null);
        } catch (e) {
            setConfigError('Invalid JSON format');
        }
    };

    const formatToolName = (name: string) => {
        return name.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (

        <div className={`group relative h-full rounded-2xl p-5 transition-all duration-300 flex flex-col overflow-hidden ${theme === 'dark'
            ? 'bg-[#1a2639] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] ring-1 ring-white/5 hover:bg-[#1f2d42] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.6)]'
            : 'bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] ring-1 ring-black/5 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)]'
            }`}>
            {/* Hover Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 opacity-0 group-hover:opacity-100 ${theme === 'dark'
                ? 'from-cyan-500/5 via-transparent to-purple-500/5'
                : 'from-blue-500/5 via-transparent to-indigo-500/5'
                }`} />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`shrink-0 p-2.5 rounded-xl transition-all duration-500 ${tool.isEnabled
                            ? (theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30' : 'bg-blue-50 text-blue-600 ring-1 ring-blue-100')
                            : (theme === 'dark' ? 'bg-black/20 text-gray-500 ring-1 ring-white/5 group-hover:bg-white/5 group-hover:text-gray-300' : 'bg-gray-50 text-gray-400 ring-1 ring-black/5 group-hover:text-gray-600')
                            }`}>
                            <Icon size={20} strokeWidth={1.5} className={tool.isEnabled ? 'drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]' : ''} />
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                            <h3 className={`font-bold text-sm transition-colors tracking-tight leading-5 ${theme === 'dark' ? 'text-white group-hover:text-cyan-400' : 'text-gray-900 group-hover:text-blue-600'}`}>
                                {formatToolName(tool.name)}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className={`text-[10px] uppercase tracking-wider font-bold transition-colors ${theme === 'dark' ? 'text-gray-500 group-hover:text-cyan-400/50' : 'text-gray-400 group-hover:text-blue-600/50'}`}>
                                    v{tool.version}
                                </span>
                                {tool.isEnabled && (
                                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm ${theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400 shadow-cyan-900/20' : 'bg-blue-100 text-blue-600'}`}>
                                        Active
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 pt-0.5">
                        <button
                            onClick={() => onToggle(tool._id, !tool.isEnabled)}
                            className={`transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer ${tool.isEnabled
                                ? (theme === 'dark' ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-blue-600 drop-shadow-sm')
                                : (theme === 'dark' ? 'text-gray-600 hover:text-gray-400' : 'text-gray-300 hover:text-gray-500')
                                }`}
                            title={tool.isEnabled ? 'Disable Tool' : 'Enable Tool'}
                        >
                            {tool.isEnabled ? <ToggleRight size={32} strokeWidth={1.5} /> : <ToggleLeft size={32} strokeWidth={1.5} />}
                        </button>
                    </div>
                </div>

                <p className={`text-xs mb-5 line-clamp-2 leading-relaxed flex-1 transition-colors ${theme === 'dark' ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700'}`}>
                    {tool.description}
                </p>

                <div className={`mt-auto pt-4 flex items-center justify-between transition-colors border-t backdrop-blur-sm ${theme === 'dark' ? 'border-white/5 group-hover:border-white/10' : 'border-gray-100 group-hover:border-gray-200'}`}>
                    <div className={`flex items-center gap-2 text-[10px] transition-colors ${theme === 'dark' ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full transition-colors ${theme === 'dark' ? 'bg-gray-700 group-hover:bg-cyan-500/50' : 'bg-gray-300 group-hover:bg-blue-500/50'}`}></span>
                        <span className="font-bold tracking-wide uppercase">{tool.author}</span>
                    </div>

                    {tool?.configSchema && Object.keys(tool.configSchema).length > 0 && (
                        <button
                            onClick={() => setIsConfigOpen(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 border group/btn cursor-pointer ${theme === 'dark'
                                ? 'bg-white/5 hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-400 border-transparent hover:border-cyan-500/20'
                                : 'bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 border-gray-100 hover:border-blue-200'
                                }`}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider">Config</span>
                            <Settings size={12} className="group-hover/btn:rotate-90 transition-transform duration-500" />
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isConfigOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center px-4"
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                            onClick={() => setIsConfigOpen(false)}
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${theme === 'dark' ? 'bg-[#1a2639] ring-1 ring-white/10' : 'bg-white ring-1 ring-black/5'}`}
                        >
                            <div className={`flex items-center justify-between p-5 border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                                <h4 className={`text-base font-bold flex items-center gap-2.5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    <Settings size={18} className={theme === 'dark' ? 'text-cyan-400' : 'text-blue-500'} />
                                    <span>Configure {formatToolName(tool.name)}</span>
                                </h4>
                                <button
                                    onClick={() => setIsConfigOpen(false)}
                                    className={`transition-colors p-1.5 rounded-lg cursor-pointer ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto">
                                <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Configuration JSON
                                </label>
                                <textarea
                                    value={config}
                                    onChange={(e) => setConfig(e.target.value)}
                                    className={`w-full h-64 rounded-xl p-4 text-sm font-mono transition-all focus:outline-none focus:ring-2 resize-none custom-scrollbar leading-relaxed ${theme === 'dark'
                                        ? 'bg-black/20 text-blue-300 placeholder-white/20 focus:ring-cyan-500/20 shadow-inner'
                                        : 'bg-gray-50 text-blue-600 placeholder-gray-400 focus:ring-blue-500/20 shadow-inner'
                                        }`}
                                    placeholder="{}"
                                    spellCheck="false"
                                />
                                {configError && (
                                    <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500 flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-red-500"></span>
                                        {configError}
                                    </div>
                                )}
                            </div>

                            <div className={`p-5 border-t flex items-center justify-end gap-3 ${theme === 'dark' ? 'border-white/5 bg-[#1f2d42]/50' : 'border-gray-100 bg-gray-50/50'}`}>
                                <button
                                    type="button"
                                    onClick={() => setIsConfigOpen(false)}
                                    className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all duration-300 ${theme === 'dark' ? 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20' : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-white hover:border-gray-300'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfigSave}
                                    className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${theme === 'dark'
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]'
                                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-cyan-500/30 hover:shadow-cyan-500/50'
                                        }`}
                                >
                                    <Check size={16} />
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ToolCard;
