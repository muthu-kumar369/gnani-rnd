import React from 'react';
import { CostEstimator } from '../analytics/CostEstimator';
import { UsageChart } from '../analytics/UsageChart';
import { ExportButton } from '../analytics/ExportButton';

const AnalyticsDashboard: React.FC = () => {
    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full h-full overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Analytics & Usage</h2>
                    <p className="text-white/50 text-sm">Track your AI usage trends and costs</p>
                </div>
                <ExportButton />
            </div>

            <CostEstimator />

            <div className="mb-6">
                <UsageChart />
            </div>

            {/* Additional info or breakdowns could go here */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
                <p>
                    <strong>Note:</strong> Costs are estimated based on input/output token rates for each model.
                    Local models (e.g., Llama 3) are tracked as $0.00 cost.
                </p>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
