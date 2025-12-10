import React, { useState } from 'react';
import type { PluginMetadata } from '../../types/plugin';
import { usePluginStore } from '../../utils/pluginManager';
import { EXAMPLE_PLUGINS } from '../../plugins/examplePlugins';
import PluginCard from './PluginCard';

const PluginMarketplace: React.FC = () => {
    const { installedPlugins, enabledPlugins, installPlugin, uninstallPlugin, enablePlugin, disablePlugin } = usePluginStore();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Mock marketplace plugins (in real app, fetch from API)
    const marketplacePlugins: PluginMetadata[] = EXAMPLE_PLUGINS.map((plugin) => ({
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        author: plugin.author,
        description: plugin.description || '',
        icon: plugin.icon || '🔌',
        category: 'utility',
        downloads: Math.floor(Math.random() * 10000),
        rating: 4 + Math.random(),
        installed: installedPlugins.includes(plugin.id),
        enabled: enabledPlugins.includes(plugin.id),
    }));

    const handleInstall = async (pluginId: string) => {
        await installPlugin(pluginId);
    };

    const handleUninstall = async (pluginId: string) => {
        await uninstallPlugin(pluginId);
    };

    const handleToggle = async (pluginId: string, enabled: boolean) => {
        if (enabled) {
            await disablePlugin(pluginId);
        } else {
            await enablePlugin(pluginId);
        }
    };

    const categories = ['all', 'productivity', 'utility', 'integration', 'ui'];

    const filteredPlugins = selectedCategory === 'all'
        ? marketplacePlugins
        : marketplacePlugins.filter((p) => p.category === selectedCategory);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">Plugin Marketplace</h2>
                <p className="text-cyan-500/60">Extend Gnani with powerful plugins</p>
            </div>

            {/* Categories */}
            <div className="flex gap-2 mb-6">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded transition-colors capitalize ${selectedCategory === category
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'bg-black/40 text-cyan-500/60 hover:text-cyan-400 border border-cyan-500/20'
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Plugin Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlugins.map((plugin) => (
                    <PluginCard
                        key={plugin.id}
                        plugin={plugin}
                        onInstall={() => handleInstall(plugin.id)}
                        onUninstall={() => handleUninstall(plugin.id)}
                        onToggle={() => handleToggle(plugin.id, plugin.enabled)}
                    />
                ))}
            </div>

            {filteredPlugins.length === 0 && (
                <div className="text-center text-cyan-500/60 py-12">
                    No plugins found in this category
                </div>
            )}
        </div>
    );
};

export default PluginMarketplace;
