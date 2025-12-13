import React, { useState } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';

import { MessageSquare, Clock, Trash2 } from 'lucide-react';
import Loader from '../../ui/Loader';

const ActivityHistorySection: React.FC = () => {
    const { user, loading, clearHistory, deleteHistoryItem } = useUserStore();
    const { addToast } = useToast();
    const [isClearing, setIsClearing] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    if (loading || !user) return <div className="flex justify-center p-8"><Loader text="Loading history..." /></div>;

    const handleClearAll = async () => {
        if (!confirm('Are you sure you want to clear all history?')) return;

        setIsClearing(true);
        try {
            await clearHistory();
            addToast('History cleared successfully', 'success');
        } catch (error) {
            console.error('Failed to clear history:', error);
            addToast('Failed to clear history', 'error');
        } finally {
            setIsClearing(false);
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Delete this history item?')) return;

        setDeletingId(id);
        try {
            await deleteHistoryItem(id);
            addToast('Item deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete item:', error);
            addToast('Failed to delete item', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-end mb-2">
                <button
                    onClick={handleClearAll}
                    disabled={isClearing || user.history.length === 0}
                    className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors tracking-wider"
                >
                    <Trash2 size={10} />
                    Clear History
                </button>
            </div>

            <div className="space-y-3">
                {user.history.length === 0 ? (
                    <div className="text-center text-slate-500 text-xs py-8 italic">
                        No activity history found.
                    </div>
                ) : (
                    user.history.map((item: any) => (
                        <div
                            key={item.id}
                            className="bg-black/20 border border-white/5 rounded-lg p-3 hover:border-cyan-500/20 transition-colors group relative"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                                    <Clock size={10} />
                                    {formatTime(item.timestamp)}
                                </span>
                                <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    disabled={deletingId === item.id}
                                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity p-1"
                                    title="Delete Item"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <div className="mt-0.5 min-w-[20px] flex justify-center">
                                        <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-[10px] font-bold border border-cyan-500/20">
                                            U
                                        </div>
                                    </div>
                                    <p className="text-slate-200 text-xs leading-relaxed">{item.query}</p>
                                </div>

                                <div className="flex gap-2">
                                    <div className="mt-0.5 min-w-[20px] flex justify-center">
                                        <div className="w-5 h-5 rounded-full bg-cyan-900/40 flex items-center justify-center text-cyan-300 border border-cyan-500/20">
                                            <MessageSquare size={10} />
                                        </div>
                                    </div>
                                    <p className="text-slate-400 text-[11px] leading-relaxed">{item.response}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActivityHistorySection;
