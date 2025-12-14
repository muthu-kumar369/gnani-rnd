import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ToggleLeft, ToggleRight, Box, Calculator, Globe, FolderOpen, Terminal, Check, X } from 'lucide-react';
import type { Tool } from '../../api/toolService';
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

        <div className="group relative h-full bg-[#0a0a15] hover:bg-[#0f0f1a] border border-white/5 hover:border-cyan-500/20 rounded-xl p-4 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(6,182,212,0.1)] flex flex-col overflow-hidden">
            {/* Hover Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-purple-500/0 group-hover:from-cyan-500/5 group-hover:to-purple-500/5 duration-500 transition-all opacity-0 group-hover:opacity-100" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div className={`shrink-0 p-2 rounded-lg transition-all duration-500 ${tool.isEnabled
                            ? 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30'
                            : 'bg-white/5 text-slate-500 ring-1 ring-white/5 group-hover:ring-white/10'
                            }`}>
                            <Icon size={18} strokeWidth={1.5} className={tool.isEnabled ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]' : 'text-slate-500'} />
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                            <h3 className="font-bold text-sm text-white group-hover:text-cyan-100 transition-colors tracking-tight leading-5">
                                {formatToolName(tool.name)}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 group-hover:text-cyan-500/50 transition-colors">
                                    v{tool.version}
                                </span>
                                {tool.isEnabled && (
                                    <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[8px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                                        Active
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 pt-0.5">
                        <button
                            onClick={() => onToggle(tool._id, !tool.isEnabled)}
                            className={`transition-all duration-500 transform hover:scale-105 active:scale-95 ${tool.isEnabled
                                ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                                : 'text-slate-700 hover:text-slate-400'
                                } cursor-pointer`}
                            title={tool.isEnabled ? 'Disable Tool' : 'Enable Tool'}
                        >
                            {tool.isEnabled ? <ToggleRight size={28} strokeWidth={1.5} /> : <ToggleLeft size={28} strokeWidth={1.5} />}
                        </button>
                    </div>
                </div>

                <p className="text-xs text-slate-400/80 mb-4 line-clamp-2 leading-relaxed flex-1 group-hover:text-slate-300/80 transition-colors">
                    {tool.description}
                </p>

                <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between group-hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-600 group-hover:text-slate-500 transition-colors">
                        <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-cyan-500/30 transition-colors"></span>
                        <span className="font-medium">{tool.author}</span>
                    </div>

                    {tool?.configSchema && Object.keys(tool.configSchema).length > 0 && (
                        <button
                            onClick={() => setIsConfigOpen(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 transition-all duration-300 border border-transparent hover:border-cyan-500/20 group/btn cursor-pointer"
                        >
                            <span className="text-[10px] font-medium uppercase tracking-wide">Config</span>
                            <Settings size={12} className="group-hover/btn:rotate-90 transition-transform duration-500" />
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isConfigOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 bg-[#0a0a15] z-20 p-6 rounded-2xl flex flex-col border border-cyan-500/30 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Settings size={14} className="text-cyan-400" />
                                Configuration
                            </h4>
                            <button
                                onClick={() => setIsConfigOpen(false)}
                                className="text-slate-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <textarea
                            value={config}
                            onChange={(e) => setConfig(e.target.value)}
                            className="flex-1 w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-cyan-300 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none resize-none mb-4 custom-scrollbar"
                            placeholder="{}"
                        />
                        {configError && (
                            <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-red-400"></span>
                                {configError}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setIsConfigOpen(false)}
                                variant="ghost"
                                size="sm"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfigSave}
                                variant="primary"
                                size="sm"
                                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] border-none"
                                leftIcon={<Check size={14} />}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ToolCard;
