import React from 'react';
import { Download, Trash2, Power, Settings, Star, Users, Shield, AlertTriangle } from 'lucide-react';
import type { PluginMetadata } from '../../types/plugin';

interface PluginCardProps {
    plugin: PluginMetadata;
    onInstall: () => void;
    onUninstall: () => void;
    onToggle: () => void;
    onSettings?: () => void;
}

const SecurityBadge: React.FC<{ plugin: PluginMetadata }> = ({ plugin }) => {
    const hasPermissions = plugin.requiredPermissions &&
        Object.keys(plugin.requiredPermissions).length > 0;

    // In PluginMetadata, requiredPermissions is an object.
    const permissionCount = hasPermissions && plugin.requiredPermissions
        ? Object.keys(plugin.requiredPermissions).length
        : 0;

    if (!hasPermissions) {
        return (
            <div className="flex items-center gap-1 text-green-400 text-[10px] bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                <Shield size={10} />
                <span>Safe</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 text-yellow-400 text-[10px] bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
            <AlertTriangle size={10} />
            <span>{permissionCount} Perms</span>
        </div>
    );
};

const PluginCard: React.FC<PluginCardProps> = ({
    plugin,
    onInstall,
    onUninstall,
    onToggle,
    onSettings,
}) => {
    return (
        <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-4 hover:border-cyan-500/50 transition-colors">
            {/* Plugin Header */}
            <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{plugin.icon}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-cyan-400 font-semibold truncate">{plugin.name}</h3>
                        <SecurityBadge plugin={plugin} />
                    </div>
                    <p className="text-xs text-cyan-500/60">
                        by {plugin.author} • v{plugin.version}
                    </p>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-cyan-500/80 mb-3 line-clamp-2">
                {plugin.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-3 text-xs text-cyan-500/60">
                <span className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-400" />
                    {plugin.rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                    <Users size={12} />
                    {plugin.downloads.toLocaleString()}
                </span>
                <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-xs capitalize">
                    {plugin.category}
                </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                {plugin.installed ? (
                    <>
                        <button
                            onClick={onToggle}
                            className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${plugin.enabled
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
                                }`}
                        >
                            <Power size={14} className="inline mr-1" />
                            {plugin.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        <button
                            onClick={onUninstall}
                            className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors"
                            title="Uninstall"
                        >
                            <Trash2 size={14} />
                        </button>
                        {onSettings && (
                            <button
                                onClick={onSettings}
                                className="px-3 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-500/30 transition-colors"
                                title="Settings"
                            >
                                <Settings size={14} />
                            </button>
                        )}
                    </>
                ) : (
                    <button
                        onClick={onInstall}
                        className="flex-1 px-3 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-500/30 transition-colors text-sm"
                    >
                        <Download size={14} className="inline mr-1" />
                        Install
                    </button>
                )}
            </div>
        </div>
    );
};

export default PluginCard;
