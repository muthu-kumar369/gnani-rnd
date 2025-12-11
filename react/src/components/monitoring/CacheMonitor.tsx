import React, { useState, useEffect } from 'react';
import { messageCache } from '../../utils/messageCache';

export const CacheMonitor: React.FC = () => {
    const [stats, setStats] = useState(messageCache.getStats());

    useEffect(() => {
        const interval = setInterval(() => {
            setStats(messageCache.getStats());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const hitRateColor = stats.hitRate > 80 ? 'text-green-400' : stats.hitRate > 50 ? 'text-yellow-400' : 'text-red-400';
    const usagePercent = Math.round((stats.size / stats.maxSize) * 100);

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Message Cache</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-900 p-3 rounded">
                    <p className="text-gray-400 text-xs uppercase">Hit Rate</p>
                    <p className={`text-2xl font-bold ${hitRateColor}`}>{stats.hitRate}%</p>
                </div>
                <div className="bg-gray-900 p-3 rounded">
                    <p className="text-gray-400 text-xs uppercase">Hits / Misses</p>
                    <p className="text-xl font-bold text-gray-200">{stats.hits} / {stats.misses}</p>
                </div>
            </div>

            <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Usage ({stats.size} / {stats.maxSize})</span>
                    <span>{usagePercent}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${usagePercent}%` }}
                    ></div>
                </div>
            </div>

            <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">Cached Conversations</p>
                <div className="max-h-32 overflow-y-auto text-xs space-y-1 pr-1 custom-scrollbar">
                    {stats.entries.sort((a, b) => b.age - a.age).map(entry => (
                        <div key={entry.conversationId} className="flex justify-between items-center bg-gray-900/50 p-1.5 rounded">
                            <span className="truncate max-w-[120px] text-gray-300" title={entry.conversationId}>{entry.conversationId}</span>
                            <div className="flex space-x-2 text-gray-500">
                                <span>{entry.messageCount} msgs</span>
                                <span>{(entry.age / 1000).toFixed(0)}s ago</span>
                            </div>
                        </div>
                    ))}
                    {stats.entries.length === 0 && (
                        <p className="text-gray-600 italic text-center py-2">Cache is empty</p>
                    )}
                </div>
            </div>

            <div className="mt-4 flex space-x-2">
                <button
                    onClick={() => messageCache.invalidateAll()}
                    className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs py-1.5 rounded transition-colors"
                >
                    Clear Cache
                </button>
            </div>
        </div>
    );
};
