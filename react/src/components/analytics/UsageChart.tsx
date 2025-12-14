import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useThemeColors } from '../../hooks/useThemeColors';
import api from '../../api/client';

interface UsageData {
    date: string;
    tokens: number;
    cost: number;
    messages: number;
}

import { apiCircuitBreaker } from '../../utils/circuitBreaker';

export const UsageChart: React.FC = () => {
    const [data, setData] = useState<UsageData[]>([]);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
    const colors = useThemeColors();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
                const response = await apiCircuitBreaker.execute(() =>
                    api.get(`/analytics/usage?days=${days}`)
                );
                setData(response.data);
            } catch (error) {
                console.error('Failed to fetch usage data', error);
            }
        };

        fetchData();
    }, [timeRange]);

    return (
        <div className="bg-canvas-panel rounded-lg p-4 border border-line-base">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-type-primary">Usage Trends</h3>
                <div className="flex bg-canvas-surface/50 rounded p-1">
                    {(['week', 'month', 'year'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-xs rounded transition-colors ${timeRange === range
                                ? 'bg-gnani-info/20 text-gnani-info'
                                : 'text-type-muted hover:text-type-secondary'
                                }`}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--line-base), 0.5)" />
                        <XAxis
                            dataKey="date"
                            stroke="rgb(var(--type-muted))"
                            fontSize={12}
                            tickFormatter={(value) => value.split('-').slice(1).join('/')}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke={colors.primary}
                            fontSize={12}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke={colors.secondary}
                            fontSize={12}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgb(var(--canvas-popover))', borderColor: 'rgb(var(--glass-border))' }}
                            itemStyle={{ fontSize: '12px', color: 'rgb(var(--type-primary))' }}
                        />
                        <Legend />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="tokens"
                            stroke={colors.primary}
                            name="Tokens"
                            dot={false}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="cost"
                            stroke={colors.secondary}
                            name="Cost ($)"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
