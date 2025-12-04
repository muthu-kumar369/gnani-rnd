import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
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
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-jarvis-blue tracking-wide">Tool Marketplace</h2>
                    <p className="text-sm text-jarvis-cyan/60">Manage and configure AI capabilities</p>
                </div>

                <div className="flex gap-3 items-center">
                    <div className="w-64">
                        <Input
                            leftIcon={<Search size={16} />}
                            placeholder="Search tools..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'enabled', 'disabled'] as const).map((f) => (
                            <Button
                                key={f}
                                variant={filter === f ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setFilter(f)}
                                className="capitalize"
                            >
                                {f}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader size="md" text="Loading tools..." />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTools.map(tool => (
                            <ToolCard
                                key={tool._id}
                                tool={tool}
                                onToggle={handleToggle}
                                onUpdateConfig={handleUpdateConfig}
                            />
                        ))}
                        {filteredTools.length === 0 && (
                            <div className="col-span-full text-center py-12 text-jarvis-text/40">
                                No tools found matching your criteria.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToolMarketplace;
