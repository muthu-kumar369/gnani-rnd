import React, { useEffect, useState } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toolService, type Tool } from '../../api/toolService';
import ToolCard from './ToolCard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Loader from '../ui/Loader';

const ToolMarketplace: React.FC = () => {
    const [tools, setTools] = useState<Tool[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        loadTools();
    }, []);

    const loadTools = async () => {
        try {
            setIsLoading(true);
            const data = await toolService.getAll();
            // Ensure data is an array, default to empty array if null/undefined
            setTools(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load tools:', error);
            // Set empty array on error to prevent null/undefined issues
            setTools([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (id: string, isEnabled: boolean) => {
        try {
            const updatedTool = await toolService.toggle(id, isEnabled);
            setTools(prev => prev.map(t => t._id === id ? updatedTool : t));
        } catch (error) {
            console.error('Failed to toggle tool:', error);
        }
    };

    const handleUpdateConfig = async (id: string, config: any) => {
        try {
            const updatedTool = await toolService.updateConfig(id, config);
            setTools(prev => prev.map(t => t._id === id ? updatedTool : t));
        } catch (error) {
            console.error('Failed to update tool config:', error);
        }
    };

    const filteredTools = tools.filter(tool => {
        if (!tool) return false; // Skip null/undefined tools

        const matchesSearch = (tool.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (tool.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' ||
            (filter === 'enabled' && tool.isEnabled) ||
            (filter === 'disabled' && !tool.isEnabled);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-6 space-y-6">
            {/* Search and Filter Bar */}
            <div className="relative z-30 flex flex-col md:flex-row gap-3 items-center justify-between bg-[#0a0a15]/50 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search tools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-md text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                    />
                </div>

                {/* Custom Filter Dropdown */}
                <div className="relative group w-full md:w-48 z-50">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="w-full flex items-center justify-between bg-black/40 border border-white/10 rounded-md py-2 px-3 text-sm text-cyan-400 font-medium hover:border-cyan-500/30 transition-all focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                    >
                        <span className="capitalize">{filter === 'all' ? 'All Tools' : filter}</span>
                        <ChevronDown size={14} className={`transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isFilterOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute top-full right-0 left-0 mt-2 bg-[#0F0F1A] border border-white/10 rounded-lg shadow-xl overflow-hidden backdrop-blur-xl z-50"
                            >
                                {(['all', 'enabled', 'disabled'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => {
                                            setFilter(f);
                                            setIsFilterOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${filter === f
                                            ? 'bg-cyan-500/10 text-cyan-400 font-semibold'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <span className="capitalize">{f === 'all' ? 'All Tools' : f}</span>
                                        {filter === f && <Check size={12} />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Backdrop to close */}
                    {isFilterOpen && (
                        <div className="fixed inset-0 z-[-1] cursor-default" onClick={() => setIsFilterOpen(false)} />
                    )}
                </div>
            </div>

            {/* Tools Grid */}
            <div className="relative min-h-[400px]">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader size="md" text="Loading tools..." />
                    </div>
                ) : filteredTools.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/5 to-purple-500/5 ring-1 ring-white/5 flex items-center justify-center mb-4">
                            <Search size={24} className="text-slate-600" />
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1">No tools found</h3>
                        <p className="text-xs text-slate-500 max-w-sm">
                            {(searchQuery || filter !== 'all')
                                ? "Try adjusting your search or filters to find what you're looking for."
                                : "No tools are currently available in the marketplace."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTools.map(tool => (
                            <div key={tool._id} className="h-full">
                                <ToolCard
                                    tool={tool}
                                    onToggle={handleToggle}
                                    onUpdateConfig={handleUpdateConfig}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToolMarketplace;
