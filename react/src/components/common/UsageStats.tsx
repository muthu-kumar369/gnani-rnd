import React from 'react';
import { BarChart3, MessageSquare, Hash, Clock } from 'lucide-react';
import { useAnalyticsStore } from '../../store/useAnalyticsStore';

const UsageStats: React.FC = () => {
    const { stats } = useAnalyticsStore();

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatLastActive = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    const statItems = [
        {
            icon: MessageSquare,
            label: 'Messages',
            value: formatNumber(stats.totalMessages),
            color: 'text-cyan-400',
        },
        {
            icon: BarChart3,
            label: 'Conversations',
            value: formatNumber(stats.totalConversations),
            color: 'text-blue-400',
        },
        {
            icon: Hash,
            label: 'Tokens',
            value: formatNumber(stats.totalTokens),
            color: 'text-purple-400',
        },
        {
            icon: Clock,
            label: 'Last Active',
            value: formatLastActive(stats.lastActive),
            color: 'text-green-400',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
            {statItems.map((item) => (
                <div
                    key={item.label}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-cyan-500/20 backdrop-blur-sm"
                >
                    <item.icon size={16} className={item.color} />
                    <div className="flex-1">
                        <div className={`text-sm font-semibold ${item.color}`}>
                            {item.value}
                        </div>
                        <div className="text-xs text-cyan-500/60">{item.label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default UsageStats;
