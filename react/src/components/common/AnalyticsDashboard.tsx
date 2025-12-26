import React, { useState } from 'react';
import { CostEstimator } from '../analytics/CostEstimator';
import { UsageChart } from '../analytics/UsageChart';
import { ExportButton } from '../analytics/ExportButton';
import SessionReplayViewer from '../analytics/SessionReplayViewer';
import { useThemeStore } from '../../store/themeStore';

const AnalyticsDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'usage' | 'replay'>('usage');
    const [selectedSession, setSelectedSession] = useState<string>('');
    const { theme } = useThemeStore();

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full h-full overflow-y-auto custom-scrollbar">
            <div className="flex justify-end items-center mb-2">
                <ExportButton />
            </div>

            {/* Tabs */}
            <div className={`flex gap-1 border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
                <button
                    onClick={() => setActiveTab('usage')}
                    className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${activeTab === 'usage'
                        ? (theme === 'dark' ? 'text-cyan-400 border-cyan-400' : 'text-blue-600 border-blue-600')
                        : (theme === 'dark' ? 'text-gray-400 border-transparent hover:text-gray-300' : 'text-gray-500 border-transparent hover:text-gray-700')
                        }`}
                >
                    Usage & Costs
                </button>
                <button
                    onClick={() => setActiveTab('replay')}
                    className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${activeTab === 'replay'
                        ? (theme === 'dark' ? 'text-cyan-400 border-cyan-400' : 'text-blue-600 border-blue-600')
                        : (theme === 'dark' ? 'text-gray-400 border-transparent hover:text-gray-300' : 'text-gray-500 border-transparent hover:text-gray-700')
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
                    <div className={`rounded-lg p-4 text-sm border flex gap-3 ${theme === 'dark' ? 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                        <div className="shrink-0 mt-0.5">
                            <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${theme === 'dark' ? 'bg-cyan-500/20' : 'bg-blue-200'}`}>i</span>
                        </div>
                        <p className="leading-relaxed">
                            <strong className="font-semibold block mb-1">Cost Estimation Note</strong>
                            Costs are estimated based on input/output token rates for each model.
                            Local models (e.g., Llama 3) are tracked as <span className="font-mono font-bold">$0.00</span> cost.
                        </p>
                    </div>
                </>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="mb-6">
                        <label className={`block text-sm font-semibold mb-2 ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Enter Session ID
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={selectedSession}
                                onChange={(e) => setSelectedSession(e.target.value)}
                                placeholder="e.g. sess_123456789"
                                className={`w-full px-4 py-2.5 pl-10 rounded-lg text-sm transition-all border outline-none ${theme === 'dark'
                                    ? 'bg-black/20 border-white/5 text-white placeholder-gray-600 focus:border-cyan-500/50 focus:bg-black/40'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                                    }`}
                            />
                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[400px]">
                        {selectedSession ? (
                            <SessionReplayViewer sessionId={selectedSession} />
                        ) : (
                            <div className={`flex flex-col items-center justify-center h-full rounded-2xl border-2 border-dashed ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                                <div className={`p-4 rounded-full mb-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                </div>
                                <h3 className={`text-base font-semibold mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>No Session Selected</h3>
                                <p className={`text-sm max-w-xs text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                    Enter a valid session ID above to load and replay the conversation history.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;
