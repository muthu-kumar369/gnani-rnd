import React, { useEffect, useState } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toolService, type Tool } from '../../api/toolService';
import { useThemeStore } from '../../store/themeStore';
import ToolCard from './ToolCard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Loader from '../ui/Loader';

const ToolMarketplace: React.FC = () => {
    const [tools, setTools] = useState<Tool[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { theme } = useThemeStore();
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
            {/* Search and Filter Bar */}
            <div className={`relative z-30 flex flex-col md:flex-row gap-3 items-center justify-between p-2 rounded-xl backdrop-blur-sm transition-all duration-300 ${theme === 'dark' ? 'bg-black/20 shadow-sm ring-1 ring-white/5' : 'bg-white ring-1 ring-black/5 shadow-sm'}`}>
                <div className="relative w-full md:w-96 group">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-gray-500 group-focus-within:text-cyan-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} size={16} />
                    <input
                        type="text"
                        placeholder="Search tools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-9 pr-4 py-2.5 rounded-lg text-sm transition-all font-mono focus:outline-none focus:ring-2 ${theme === 'dark'
                            ? 'bg-black/20 text-white placeholder-white/20 focus:ring-cyan-500/20'
                            : 'bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-blue-500/20'
                            }`}
                    />
                </div>

                {/* Custom Filter Dropdown */}
                <div className="relative group w-full md:w-48 z-50">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`w-full flex items-center justify-between rounded-lg py-2.5 px-4 text-sm font-bold transition-all focus:outline-none focus:ring-2 ${theme === 'dark'
                            ? 'bg-black/20 text-white hover:bg-black/40 focus:ring-cyan-500/20'
                            : 'bg-gray-50 text-gray-900 hover:bg-gray-100 focus:ring-blue-500/20'
                            }`}
                    >
                        <span className="capitalize">{filter === 'all' ? 'All Tools' : filter}</span>
                        <ChevronDown size={14} className={`transition-transform duration-300 opacity-50 ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isFilterOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className={`absolute top-full right-0 left-0 mt-2 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-50 ring-1 ${theme === 'dark' ? 'bg-[#1a2639] ring-white/10' : 'bg-white ring-black/5'}`}
                            >
                                {(['all', 'enabled', 'disabled'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => {
                                            setFilter(f);
                                            setIsFilterOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-between ${filter === f
                                            ? (theme === 'dark' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-blue-50 text-blue-600')
                                            : (theme === 'dark' ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900')
                                            }`}
                                    >
                                        <span className="capitalize">{f === 'all' ? 'All Tools' : f}</span>
                                        {filter === f && <Check size={14} />}
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
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gnani-primary/5 to-gnani-secondary/5 ring-1 ring-glass-border flex items-center justify-center mb-4">
                            <Search size={24} className="text-type-muted" />
                        </div>
                        <h3 className="text-sm font-bold text-type-primary mb-1">No tools found</h3>
                        <p className="text-xs text-type-muted max-w-sm">
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
