import React from 'react';
import { CacheMonitor } from '../components/monitoring/CacheMonitor';
import { ResourceMonitor } from '../components/monitoring/ResourceMonitor';
import { NetworkMonitor } from '../components/monitoring/NetworkMonitor';
import { ErrorMonitor } from '../components/monitoring/ErrorMonitor';
import { useNavigate } from 'react-router-dom';

const MonitoringPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-mono">
            <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-jarvis-blue">Gnani System Monitor</h1>
                    <p className="text-gray-500 text-sm mt-1">Real-time system health and resource tracking</p>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                >
                    Back to App
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ResourceMonitor />
                <CacheMonitor />
                <NetworkMonitor />
                <ErrorMonitor />
            </div>

            <div className="mt-8 p-4 bg-gray-800/50 rounded border border-gray-800 text-xs text-gray-500">
                <p>System Version: 2.0.0-rc1 | Environment: {import.meta.env.MODE}</p>
                <p className="mt-1">
                    This dashboard pulls data directly from application singletons (`resourceTracker`, `messageCache`, `offlineQueue`).
                    Polling interval: 1000ms.
                </p>
            </div>
        </div>
    );
};

export default MonitoringPage;
