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

    return (
        <motion.div
            layout
            className={`relative bg-jarvis-bg border ${tool.isEnabled ? 'border-jarvis-blue/50 shadow-jarvis-glow' : 'border-jarvis-border'} rounded-lg p-4 transition-all duration-300`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${tool.isEnabled ? 'bg-jarvis-blue/20 text-jarvis-blue' : 'bg-jarvis-border/30 text-jarvis-text/50'}`}>
                        <Icon size={24} />
                    </div>
                    <div>
                        <h3 className={`font-semibold ${tool.isEnabled ? 'text-jarvis-text' : 'text-jarvis-text/60'}`}>
                            {tool.name}
                        </h3>
                        <span className="text-[10px] text-jarvis-cyan/50 uppercase tracking-wider border border-jarvis-cyan/20 px-1.5 py-0.5 rounded">
                            v{tool.version}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => onToggle(tool._id, !tool.isEnabled)}
                    className={`transition-colors ${tool.isEnabled ? 'text-jarvis-blue hover:text-jarvis-cyan' : 'text-jarvis-text/40 hover:text-jarvis-text'}`}
                >
                    {tool.isEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
            </div>

            <p className="text-sm text-jarvis-cyan/60 mb-4 line-clamp-2 min-h-[2.5em]">
                {tool.description}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-jarvis-border/50">
                <span className="text-xs text-jarvis-text/40">
                    By {tool.author}
                </span>
                {tool?.configSchema && Object.keys(tool.configSchema).length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsConfigOpen(true)}
                        leftIcon={<Settings size={16} />}
                    />
                )}
            </div>

            <AnimatePresence>
                {isConfigOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute inset-0 bg-jarvis-bg z-10 p-4 rounded-lg flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-jarvis-blue">Configuration</h4>
                            <button onClick={() => setIsConfigOpen(false)} className="text-jarvis-text/50 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>
                        <textarea
                            value={config}
                            onChange={(e) => setConfig(e.target.value)}
                            className="flex-1 w-full bg-black/30 border border-jarvis-border rounded p-2 text-xs font-mono text-jarvis-cyan focus:border-jarvis-blue focus:outline-none resize-none mb-2"
                        />
                        {configError && <p className="text-xs text-red-400 mb-2">{configError}</p>}
                        <Button
                            onClick={handleConfigSave}
                            variant="primary"
                            size="sm"
                            className="w-full justify-center"
                            leftIcon={<Check size={14} />}
                        >
                            Save Config
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ToolCard;
