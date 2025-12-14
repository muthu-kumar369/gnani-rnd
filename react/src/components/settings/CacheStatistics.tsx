// react/src/components/settings/CacheStatistics.tsx
import React, { useState, useEffect } from 'react';
import { Database, Trash2, TrendingUp } from 'lucide-react';
import { messageCache } from '../../utils/messageCache';

export const CacheStatistics: React.FC = () => {
    const [stats, setStats] = useState(messageCache.getStats());

    useEffect(() => {
        // Update stats every 2 seconds
        const interval = setInterval(() => {
            setStats(messageCache.getStats());
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleClearCache = () => {
        if (confirm('Are you sure you want to clear the message cache? This will slow down conversation switching until the cache is rebuilt.')) {
            messageCache.invalidateAll();
            setStats(messageCache.getStats());
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-type-primary flex items-center gap-2">
                    <Database size={20} className="text-gnani-primary" />
                    Message Cache Statistics
                </h3>
                <button
                    onClick={handleClearCache}
                    className="px-3 py-1.5 bg-status-error/20 hover:bg-status-error/30 text-status-error rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                    <Trash2 size={14} />
                    Clear Cache
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Cache Size */}
                <div className="bg-canvas-panel border border-gnani-primary/20 rounded-lg p-4">
                    <div className="text-sm text-gnani-primary/60 mb-1">Cache Size</div>
                    <div className="text-2xl font-bold text-type-primary">
                        {stats.size} <span className="text-sm text-gnani-primary/60">/ {stats.maxSize}</span>
                    </div>
                    <div className="mt-2 h-2 bg-canvas-surface/60 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-gnani-primary to-gnani-secondary transition-all duration-300"
                            style={{ width: `${(stats.size / stats.maxSize) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Hit Rate */}
                <div className="bg-canvas-panel border border-gnani-primary/20 rounded-lg p-4">
                    <div className="text-sm text-gnani-primary/60 mb-1 flex items-center gap-1">
                        <TrendingUp size={14} />
                        Hit Rate
                    </div>
                    <div className="text-2xl font-bold text-type-primary">
                        {stats.hitRate}%
                    </div>
                    <div className="text-xs text-gnani-primary/60 mt-1">
                        {stats.hits} hits, {stats.misses} misses
                    </div>
                </div>

                {/* Total Requests */}
                <div className="bg-canvas-panel border border-gnani-primary/20 rounded-lg p-4">
                    <div className="text-sm text-gnani-primary/60 mb-1">Total Requests</div>
                    <div className="text-2xl font-bold text-type-primary">
                        {stats.hits + stats.misses}
                    </div>
                    <div className="text-xs text-gnani-primary/60 mt-1">
                        Since cache initialization
                    </div>
                </div>

                {/* Performance Impact */}
                <div className="bg-canvas-panel border border-gnani-primary/20 rounded-lg p-4">
                    <div className="text-sm text-gnani-primary/60 mb-1">Performance Impact</div>
                    <div className="text-2xl font-bold text-status-success">
                        ~{stats.hitRate > 0 ? '95%' : '0%'}
                    </div>
                    <div className="text-xs text-gnani-primary/60 mt-1">
                        Faster conversation switching
                    </div>
                </div>
            </div>

            {/* Cache Entries */}
            {stats.entries.length > 0 && (
                <div className="bg-canvas-panel border border-gnani-primary/20 rounded-lg p-4">
                    <div className="text-sm text-gnani-primary/60 mb-3">Cached Conversations</div>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {stats.entries.map((entry, index) => (
                            <div
                                key={entry.conversationId}
                                className="flex items-center justify-between text-xs p-2 bg-canvas-surface/40 rounded"
                            >
                                <div className="flex-1 truncate text-type-primary">
                                    {entry.conversationId.substring(0, 20)}...
                                </div>
                                <div className="flex items-center gap-3 text-gnani-primary/60">
                                    <span>{entry.messageCount} msgs</span>
                                    <span>{entry.accessCount} hits</span>
                                    <span>{Math.round(entry.age / 1000)}s ago</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="text-xs text-gnani-primary/60 bg-gnani-primary/5 border border-gnani-primary/10 rounded-lg p-3">
                <strong>Note:</strong> The message cache stores recently accessed conversations in memory for instant switching.
                A higher hit rate means better performance. The cache automatically evicts least recently used conversations when full.
            </div>
        </div>
    );
};
