import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Share2, Eye, AlertCircle } from 'lucide-react';
import api from '../api/client';
import MessageBubble from '../components/terminal/MessageBubble';
import type { ConversationMessage } from '../store/useConversationStore';

interface SharedConversationData {
    conversation: {
        id: string;
        title: string;
        messages: ConversationMessage[];
        createdAt: string;
    };
    viewCount: number;
}

const SharedConversationPage: React.FC = () => {
    const { shareId } = useParams<{ shareId: string }>();
    const [data, setData] = useState<SharedConversationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSharedConversation = async () => {
            try {
                const response = await api.get(`/share/${shareId}`);
                setData(response.data);
            } catch (err: any) {
                if (err.response?.status === 404) {
                    setError('This shared conversation was not found.');
                } else if (err.response?.status === 410) {
                    setError('This shared link has expired.');
                } else {
                    setError('Failed to load shared conversation.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (shareId) {
            fetchSharedConversation();
        }
    }, [shareId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-cyan-400 text-lg">Loading shared conversation...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl text-red-400 mb-2">Error</h2>
                    <p className="text-cyan-500/60">{error}</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <div className="max-w-4xl mx-auto p-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 pb-6 border-b border-cyan-500/30"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Share2 size={24} className="text-cyan-400" />
                        <h1 className="text-2xl font-bold text-cyan-400">
                            {data.conversation.title || 'Shared Conversation'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-cyan-500/60">
                        <div className="flex items-center gap-1">
                            <Eye size={14} />
                            <span>{data.viewCount} views</span>
                        </div>
                        <span>
                            Shared on {new Date(data.conversation.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </motion.div>

                {/* Messages */}
                <div className="space-y-4">
                    {data.conversation.messages.map((message, index) => {
                        // Ensure message has all required fields for MessageBubble
                        const typedMessage: ConversationMessage = {
                            ...message,
                            metadata: message.metadata || {},
                        };

                        return (
                            <motion.div
                                key={message.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <MessageBubble
                                    message={typedMessage}
                                    isLatest={index === data.conversation.messages.length - 1}
                                    showTimestamp={true}
                                />
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 pt-6 border-t border-cyan-500/30 text-center"
                >
                    <p className="text-cyan-500/60 text-sm">
                        Powered by <span className="text-cyan-400 font-semibold">Gnani</span>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default SharedConversationPage;
