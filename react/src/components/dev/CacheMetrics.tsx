import React, { useState, useEffect } from 'react';

// Note: This component would need access to cache metrics
// For now, it's a placeholder that can be enhanced later
const CacheMetrics: React.FC = () => {
    const [metrics, setMetrics] = useState({
        size: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
    });

    useEffect(() => {
        // Update metrics every second
        // In a real implementation, we'd expose cache metrics from the store
        const interval = setInterval(() => {
            // Placeholder - would need to expose conversationCache metrics
            // For now, just show the component structure
            setMetrics({
                size: 0, // conversationCache.size()
                hits: 0, // cacheHits
                misses: 0, // cacheMisses
                hitRate: 0, // (cacheHits / (cacheHits + cacheMisses)) * 100
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Only show in development
    if (import.meta.env.MODE !== 'development') {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 bg-black/80 border border-cyan-500/30 rounded p-3 text-xs font-mono z-50">
            <div className="text-cyan-400 mb-2 font-semibold">Cache Metrics</div>
            <div className="text-cyan-500/60 space-y-1">
                <div>Size: {metrics.size}/10</div>
                <div>Hits: {metrics.hits}</div>
                <div>Misses: {metrics.misses}</div>
                <div>Hit Rate: {metrics.hitRate.toFixed(1)}%</div>
            </div>
            <div className="text-cyan-500/40 text-[10px] mt-2">
                Check console for cache logs
            </div>
        </div>
    );
};

export default CacheMetrics;
