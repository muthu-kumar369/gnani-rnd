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
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Resource Tracking</h3>

            <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-gray-900 p-2 rounded text-center">
                    <p className="text-gray-400 text-[10px] uppercase">Timers</p>
                    <p className="text-xl font-bold text-blue-400">{counts.timer}</p>
                </div>
                <div className="bg-gray-900 p-2 rounded text-center">
                    <p className="text-gray-400 text-[10px] uppercase">Listeners</p>
                    <p className="text-xl font-bold text-purple-400">{counts.listener}</p>
                </div>
                <div className="bg-gray-900 p-2 rounded text-center">
                    <p className="text-gray-400 text-[10px] uppercase">Streams</p>
                    <p className="text-xl font-bold text-green-400">{counts.stream}</p>
                </div>
                <div className="bg-gray-900 p-2 rounded text-center">
                    <p className="text-gray-400 text-[10px] uppercase">Total</p>
                    <p className="text-xl font-bold text-gray-200">{counts.total}</p>
                </div>
            </div>

            {leaks.length > 0 && (
                <div className="mb-4 bg-red-900/20 border border-red-900/50 p-3 rounded">
                    <h4 className="text-red-400 text-xs font-bold uppercase mb-2 flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                        Potential Leaks Detected ({leaks.length})
                    </h4>
                    <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar">
                        {leaks.map((leak, i) => (
                            <div key={i} className="text-xs text-red-300 flex justify-between">
                                <span className="truncate max-w-[150px]">{leak.name}</span>
                                <span>{((Date.now() - leak.timestamp) / 60000).toFixed(1)}m</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">Active Resources</p>
                <div className="max-h-32 overflow-y-auto text-xs space-y-1 pr-1 custom-scrollbar">
                    {resources.sort((a, b) => b.timestamp - a.timestamp).map((r, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-900/50 p-1.5 rounded">
                            <div className="flex items-center space-x-2 overflow-hidden">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.type === 'stream' ? 'bg-green-500' :
                                        r.type === 'timer' ? 'bg-blue-500' : 'bg-purple-500'
                                    }`}></span>
                                <span className="truncate text-gray-300" title={r.name}>{r.name}</span>
                            </div>
                            <span className="text-gray-500 whitespace-nowrap">
                                {((Date.now() - r.timestamp) / 1000).toFixed(0)}s
                            </span>
                        </div>
                    ))}
                    {resources.length === 0 && (
                        <p className="text-gray-600 italic text-center py-2">No active resources</p>
                    )}
                </div>
            </div>
        </div>
    );
};
