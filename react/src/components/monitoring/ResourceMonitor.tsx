import React, { useState, useEffect } from 'react';
import { resourceTracker } from '../../utils/resourceTracker';

export const ResourceMonitor: React.FC = () => {
    const [resources, setResources] = useState(resourceTracker.getAll());
    const [leaks, setLeaks] = useState(resourceTracker.getLeaks(60000));

    useEffect(() => {
        const interval = setInterval(() => {
            setResources(resourceTracker.getAll());
            setLeaks(resourceTracker.getLeaks(60000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const counts = {
        timer: resources.filter(r => r.type === 'timer').length,
        listener: resources.filter(r => r.type === 'listener').length,
        stream: resources.filter(r => r.type === 'stream').length,
        custom: resources.filter(r => r.type === 'custom').length,
        total: resources.length
    };

    return (
        <div className="bg-canvas-panel p-4 rounded-lg border border-line-base">
            <h3 className="text-lg font-semibold text-type-primary mb-4">Resource Tracking</h3>

            <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-canvas-surface p-2 rounded text-center">
                    <p className="text-type-muted text-[10px] uppercase">Timers</p>
                    <p className="text-xl font-bold text-gnani-secondary">{counts.timer}</p>
                </div>
                <div className="bg-canvas-surface p-2 rounded text-center">
                    <p className="text-type-muted text-[10px] uppercase">Listeners</p>
                    <p className="text-xl font-bold text-gnani-primary">{counts.listener}</p>
                </div>
                <div className="bg-canvas-surface p-2 rounded text-center">
                    <p className="text-type-muted text-[10px] uppercase">Streams</p>
                    <p className="text-xl font-bold text-status-success">{counts.stream}</p>
                </div>
                <div className="bg-canvas-surface p-2 rounded text-center">
                    <p className="text-type-muted text-[10px] uppercase">Total</p>
                    <p className="text-xl font-bold text-type-primary">{counts.total}</p>
                </div>
            </div>

            {leaks.length > 0 && (
                <div className="mb-4 bg-status-error/20 border border-status-error/50 p-3 rounded">
                    <h4 className="text-status-error text-xs font-bold uppercase mb-2 flex items-center">
                        <span className="w-2 h-2 bg-status-error rounded-full mr-2 animate-pulse"></span>
                        Potential Leaks Detected ({leaks.length})
                    </h4>
                    <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar">
                        {leaks.map((leak, i) => (
                            <div key={i} className="text-xs text-status-error/80 flex justify-between">
                                <span className="truncate max-w-[150px]">{leak.name}</span>
                                <span>{((Date.now() - leak.timestamp) / 60000).toFixed(1)}m</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-4">
                <p className="text-xs text-type-muted mb-2 uppercase font-semibold">Active Resources</p>
                <div className="max-h-32 overflow-y-auto text-xs space-y-1 pr-1 custom-scrollbar">
                    {resources.sort((a, b) => b.timestamp - a.timestamp).map((r, i) => (
                        <div key={i} className="flex justify-between items-center bg-canvas-surface/50 p-1.5 rounded">
                            <div className="flex items-center space-x-2 overflow-hidden">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.type === 'stream' ? 'bg-status-success' :
                                    r.type === 'timer' ? 'bg-gnani-secondary' : 'bg-gnani-primary'
                                    }`}></span>
                                <span className="truncate text-type-secondary" title={r.name}>{r.name}</span>
                            </div>
                            <span className="text-type-muted whitespace-nowrap">
                                {((Date.now() - r.timestamp) / 1000).toFixed(0)}s
                            </span>
                        </div>
                    ))}
                    {resources.length === 0 && (
                        <p className="text-type-muted italic text-center py-2">No active resources</p>
                    )}
                </div>
            </div>
        </div>
    );
};
