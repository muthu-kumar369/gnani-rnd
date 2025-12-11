import React, { useState } from 'react';
import type { PluginMetadata } from '../../types/plugin';
import { usePluginStore } from '../../utils/pluginManager';
/**
 * PLUGIN MARKETPLACE - FUTURE IMPLEMENTATION
 * 
 * This component is for the future plugin marketplace system where users
 * can browse and install community-created plugins.
 * 
 * STATUS: NOT NEEDED YET
 * - Current system uses built-in plugin/tool structure for system operations
 * - Marketplace will be implemented post-Stage 4
 * - Code preserved for future use
 * 
 * See: D:\learning\hey\gnani-rnd\reports\implementation-remaining\PLUGIN_SYSTEM_IMPLEMENTATION_PLAN.md
 */

/* COMMENTED OUT - FUTURE USE

import React, { useState } from 'react';
import { Search, Download, Star, Filter } from 'lucide-react';
import { PluginCard } from './PluginCard';
import type { PluginMetadata } from '../../types/plugin';

const PluginMarketplace: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [plugins, setPlugins] = useState<PluginMetadata[]>([
        {
            id: 'weather-plugin',
            name: 'Weather Info',
            version: '1.0.0',
            author: 'Gnani Team',
            description: 'Get real-time weather information for any location',
            icon: '🌤️',
            category: 'utility',
            downloads: 1250,
            rating: 4.5,
            installed: false,
            enabled: false,
        },
        {
            id: 'calculator-plugin',
            name: 'Advanced Calculator',
            version: '2.1.0',
            author: 'Gnani Team',
            description: 'Perform complex mathematical calculations',
            icon: '🧮',
            category: 'utility',
            downloads: 3400,
            rating: 4.8,
            installed: true,
            enabled: true,
        },
        {
            id: 'notion-plugin',
            name: 'Notion Integration',
            version: '1.2.0',
            author: 'Community',
            description: 'Connect Gnani with your Notion workspace',
            icon: '📝',
            category: 'productivity',
            downloads: 890,
            rating: 4.3,
            installed: false,
            enabled: false,
        },
    ]);

    const categories = ['all', 'productivity', 'utility', 'integration', 'ui', 'other'];

    const filteredPlugins = plugins.filter((plugin) => {
        const matchesSearch =
            plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Plugin Marketplace</h1>
                <p className="text-gray-400">Extend Gnani with community plugins</p>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search plugins..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                    />
            {filteredPlugins.length === 0 && (
                <div className="text-center text-cyan-500/60 py-12">
                    No plugins found in this category
                </div>
            )}
        </div>
    );
};

export default PluginMarketplace; */
