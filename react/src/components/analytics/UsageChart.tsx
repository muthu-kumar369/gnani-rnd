import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../api/client';

interface UsageData {
    date: string;
    tokens: number;
    cost: number;
    messages: number;
}

export const UsageChart: React.FC = () => {
    const [data, setData] = useState<UsageData[]>([]);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
                const response = await import('../../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                    api.get(`/analytics/usage?days=${days}`)
                ));
                setData(response.data);
            } catch (error) {
                console.error('Failed to fetch usage data', error);
            }
        };

        fetchData();
    }, [timeRange]);

    return (
        <div className="bg-black/20 rounded-lg p-4 border border-white/5">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-white/90">Usage Trends</h3>
                <div className="flex bg-black/30 rounded p-1">
                    {(['week', 'month', 'year'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-xs rounded transition-colors ${timeRange === range
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'text-white/50 hover:text-white/70'
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis
                            dataKey="date"
                            stroke="#ffffff50"
                            fontSize={12}
                            tickFormatter={(value) => value.split('-').slice(1).join('/')}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="#8884d8"
                            fontSize={12}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#82ca9d"
                            fontSize={12}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}
                            itemStyle={{ fontSize: '12px' }}
                        />
                        <Legend />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="tokens"
                            stroke="#8884d8"
                            name="Tokens"
                            dot={false}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="cost"
                            stroke="#82ca9d"
                            name="Cost ($)"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
