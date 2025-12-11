import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../../api/client';

interface CostSummary {
    totalTokens: number;
    totalCost: number;
    messageCount: number;
    // We ideally need comparison data from API, but for MVP we'll show totals
}

export const CostEstimator: React.FC = () => {
    const [summary, setSummary] = useState<CostSummary | null>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await import('../../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                    api.get('/analytics/stats')
                ));
                setSummary(response.data);
            } catch (error) {
                console.error('Failed to fetch stats', error);
            }
        };

        fetchSummary();
    }, []);

    if (!summary) {
        return <div className="animate-pulse h-24 bg-white/5 rounded-lg"></div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                <div className="text-white/50 text-xs mb-1">Total Cost (All Time)</div>
                <div className="text-2xl font-semibold text-green-400 flex items-center gap-2">
                    <DollarSign size={20} />
                    {summary.totalCost.toFixed(4)}
                </div>
            </div>

            <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                <div className="text-white/50 text-xs mb-1">Total Tokens</div>
                <div className="text-2xl font-semibold text-blue-400">
                    {summary.totalTokens.toLocaleString()}
                </div>
            </div>

            <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                <div className="text-white/50 text-xs mb-1">Total Messages</div>
                <div className="text-2xl font-semibold text-purple-400">
                    {summary.messageCount}
                </div>
            </div>
        </div>
    );
};
