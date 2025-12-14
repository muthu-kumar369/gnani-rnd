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
                    <h2 className="text-2xl font-bold text-type-primary mb-1">Analytics & Usage</h2>
                    <p className="text-type-muted text-sm">Track your AI usage trends and costs</p>
                </div>
                <ExportButton />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-line-base">
                <button
                    onClick={() => setActiveTab('usage')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'usage'
                        ? 'text-gnani-primary border-b-2 border-gnani-primary'
                        : 'text-type-muted hover:text-type-secondary'
                        }`}
                >
                    Usage & Costs
                </button>
                <button
                    onClick={() => setActiveTab('replay')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'replay'
                        ? 'text-gnani-primary border-b-2 border-gnani-primary'
                        : 'text-type-muted hover:text-type-secondary'
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
                    <div className="bg-gnani-primary/10 border border-gnani-primary/30 rounded-lg p-4 text-sm text-gnani-primary">
                        <p>
                            <strong>Note:</strong> Costs are estimated based on input/output token rates for each model.
                            Local models (e.g., Llama 3) are tracked as $0.00 cost.
                        </p>
                    </div>
                </>
            ) : (
                <div>
                    <div className="mb-4">
                        <label className="block text-sm text-type-secondary mb-2">Session ID</label>
                        <input
                            type="text"
                            value={selectedSession}
                            onChange={(e) => setSelectedSession(e.target.value)}
                            placeholder="Enter session ID to replay"
                            className="w-full px-4 py-2 bg-canvas-surface border border-line-base rounded-lg text-type-primary focus:outline-none focus:border-gnani-primary"
                        />
                    </div>
                    {selectedSession && <SessionReplayViewer sessionId={selectedSession} />}
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;

