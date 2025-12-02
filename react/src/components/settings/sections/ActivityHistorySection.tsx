import React, { useState } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';
import SectionHeader from '../SectionHeader';
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
        <div>
            <SectionHeader
                title="Activity History"
                description="View and manage your conversation history."
            />

            <div className="flex justify-end mb-4">
                <button
                    onClick={handleClearAll}
                    disabled={isClearing || user.history.length === 0}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Trash2 size={12} />
                    Clear History
                </button>
            </div>

            <div className="space-y-4">
                {user.history.length === 0 ? (
                    <div className="text-center text-cyan-400/40 py-8">
                        No activity history found.
                    </div>
                ) : (
                    user.history.map((item: any) => (
                        <div
                            key={item.id}
                            className="bg-cyan-900/5 border border-cyan-500/10 rounded-xl p-4 hover:bg-cyan-900/10 transition-colors group relative"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs text-cyan-500/60 flex items-center gap-1">
                                    <Clock size={10} />
                                    {formatTime(item.timestamp)}
                                </span>
                                <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    disabled={deletingId === item.id}
                                    className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-opacity p-1"
                                    title="Delete Item"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <div className="mt-1 min-w-[24px] flex justify-center">
                                        <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 text-xs font-bold">
                                            U
                                        </div>
                                    </div>
                                    <p className="text-cyan-100 text-sm">{item.query}</p>
                                </div>

                                <div className="flex gap-3">
                                    <div className="mt-1 min-w-[24px] flex justify-center">
                                        <div className="w-6 h-6 rounded-full bg-cyan-700/40 flex items-center justify-center text-cyan-300">
                                            <MessageSquare size={12} />
                                        </div>
                                    </div>
                                    <p className="text-cyan-400/80 text-sm">{item.response}</p>
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
