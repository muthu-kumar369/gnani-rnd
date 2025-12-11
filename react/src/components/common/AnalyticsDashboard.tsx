import React, { useState } from 'react';
import { CostEstimator } from '../analytics/CostEstimator';
import { UsageChart } from '../analytics/UsageChart';
import { ExportButton } from '../analytics/ExportButton';
import SessionReplayViewer from '../analytics/SessionReplayViewer';

const AnalyticsDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'usage' | 'replay'>('usage');
    const [selectedSession, setSelectedSession] = useState<string>('');

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full h-full overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Analytics & Usage</h2>
                    <p className="text-white/50 text-sm">Track your AI usage trends and costs</p>
                </div>
                <ExportButton />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('usage')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'usage'
                            ? 'text-cyan-400 border-b-2 border-cyan-400'
                            : 'text-white/50 hover:text-white/70'
                        }`}
                >
                    Usage & Costs
                </button>
                <button
                    onClick={() => setActiveTab('replay')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'replay'
                            ? 'text-cyan-400 border-b-2 border-cyan-400'
                            : 'text-white/50 hover:text-white/70'
                        }`}
                >
                    Session Replay
                </button>
            </div>

            {/* Content */}
            {activeTab === 'usage' ? (
                <>
                    <CostEstimator />
                    <div className="mb-6">
                        <UsageChart />
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
                        <p>
                            <strong>Note:</strong> Costs are estimated based on input/output token rates for each model.
                            Local models (e.g., Llama 3) are tracked as $0.00 cost.
                        </p>
                    </div>
                </>
            ) : (
                <div>
                    <div className="mb-4">
                        <label className="block text-sm text-white/70 mb-2">Session ID</label>
                        <input
                            type="text"
                            value={selectedSession}
                            onChange={(e) => setSelectedSession(e.target.value)}
                            placeholder="Enter session ID to replay"
                            className="w-full px-4 py-2 bg-gray-800 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    {selectedSession && <SessionReplayViewer sessionId={selectedSession} />}
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;

