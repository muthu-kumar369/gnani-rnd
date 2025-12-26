import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useThemeStore } from '../../store/themeStore';
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
    const { theme } = useThemeStore();
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
        <div className={`rounded-xl p-5 shadow-lg border-none ${theme === 'dark' ? 'bg-black/20' : 'bg-white border border-gray-100'}`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Usage Trends</h3>
                <div className={`flex rounded-lg p-1 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                    {(['week', 'month', 'year'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${timeRange === range
                                ? (theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm')
                                : (theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')
                                }`}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {data.length > 0 ? (
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value.split('-').slice(1).join('/')}
                                dy={10}
                            />
                            <YAxis
                                yAxisId="left"
                                stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                                dx={10}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#1a2639' : '#ffffff',
                                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    color: theme === 'dark' ? '#fff' : '#111'
                                }}
                                itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                                labelStyle={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '4px', fontSize: '12px' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Line
                                yAxisId="left"
                                type="basis"
                                dataKey="tokens"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                name="Tokens"
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                            <Line
                                yAxisId="right"
                                type="basis"
                                dataKey="cost"
                                stroke="#10b981"
                                strokeWidth={3}
                                name="Cost ($)"
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-[300px] w-full flex flex-col items-center justify-center text-center">
                    <div className={`p-4 rounded-full mb-3 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 15h18" /><path d="m3 9 18-6" /><path d="M21 9v6" /></svg>
                    </div>
                    <h3 className={`text-base font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>No Usage Data</h3>
                    <p className={`text-sm mt-1 max-w-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        There is no usage activity recorded for this time range. Try selecting a different period.
                    </p>
                </div>
            )}
        </div>
    );
};
