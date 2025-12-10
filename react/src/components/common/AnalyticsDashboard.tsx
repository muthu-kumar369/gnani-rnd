import React, { useEffect, useState } from 'react';
import { BarChart3, MessageSquare, DollarSign, Hash } from 'lucide-react';
import api from '../../api/client';

interface AnalyticsStats {
    totalTokens: number;
    totalCost: number;
    conversationCount: number;
    messageCount: number;
}

const AnalyticsDashboard: React.FC = () => {
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await api.get('/analytics/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-cyan-500">Loading analytics...</div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-red-500">Failed to load analytics</div>
            </div>
        );
    }

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const statCards = [
        {
            icon: Hash,
            title: 'Total Tokens',
            value: formatNumber(stats.totalTokens),
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-500/10',
            borderColor: 'border-cyan-500/30',
        },
        {
            icon: DollarSign,
            title: 'Total Cost',
            value: `$${stats.totalCost.toFixed(4)}`,
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/30',
        },
        {
            icon: BarChart3,
            title: 'Conversations',
            value: stats.conversationCount.toString(),
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/30',
        },
        {
            icon: MessageSquare,
            title: 'Messages',
            value: formatNumber(stats.messageCount),
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/30',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
            {statCards.map((card) => (
                <div
                    key={card.title}
                    className={`flex flex-col gap-2 p-4 rounded-lg border ${card.borderColor} ${card.bgColor} backdrop-blur-sm`}
                >
                    <div className="flex items-center gap-2">
                        <card.icon size={20} className={card.color} />
                        <span className="text-xs text-cyan-500/60">{card.title}</span>
                    </div>
                    <div className={`text-2xl font-bold ${card.color}`}>
                        {card.value}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AnalyticsDashboard;
