import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../../api/client';
import { useThemeStore } from '../../store/themeStore';

interface CostSummary {
    totalTokens: number;
    totalCost: number;
    messageCount: number;
    // We ideally need comparison data from API, but for MVP we'll show totals
}

export const CostEstimator: React.FC = () => {
    const [summary, setSummary] = useState<CostSummary | null>(null);
    const { theme } = useThemeStore();

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
            <div className={`rounded-xl p-5 shadow-lg ${theme === 'dark' ? 'bg-black/20' : 'bg-white border border-gray-100'}`}>
                <div className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total Cost (All Time)</div>
                <div className="text-xl font-bold text-green-400 flex items-center gap-1">
                    <span className="text-sm opacity-50">$</span>
                    {summary.totalCost.toFixed(4)}
                </div>
            </div>

            <div className={`rounded-xl p-5 shadow-lg ${theme === 'dark' ? 'bg-black/20' : 'bg-white border border-gray-100'}`}>
                <div className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total Tokens</div>
                <div className="text-xl font-bold text-blue-400">
                    {summary.totalTokens.toLocaleString()}
                </div>
            </div>

            <div className={`rounded-xl p-5 shadow-lg ${theme === 'dark' ? 'bg-black/20' : 'bg-white border border-gray-100'}`}>
                <div className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total Messages</div>
                <div className="text-xl font-bold text-purple-400">
                    {summary.messageCount}
                </div>
            </div>
        </div>
    );
};
