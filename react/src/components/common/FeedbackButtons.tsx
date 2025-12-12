import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';

interface FeedbackButtonsProps {
    messageId: string;
    conversationId: string;
}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({ messageId, conversationId }) => {
    const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [comment, setComment] = useState('');
    const [category, setCategory] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleRating = (newRating: 'positive' | 'negative') => {
        setRating(newRating);
        if (newRating === 'negative') {
            setShowModal(true);
        } else {
            submitFeedback(newRating);
        }
    };

    const submitFeedback = async (feedbackRating: 'positive' | 'negative', feedbackComment?: string, feedbackCategory?: string) => {
        setSubmitting(true);
        try {
            await import('../../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                api.post('/feedback', {
                    conversationId,
                    messageId,
                    rating: feedbackRating,
                    comment: feedbackComment || comment,
                    category: feedbackCategory || category,
                })
            ));
            setShowModal(false);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitModal = () => {
        if (rating) {
            submitFeedback(rating, comment, category);
        }
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handleRating('positive')}
                    className={`p-1.5 rounded transition-colors ${rating === 'positive'
                        ? 'bg-green-500/20 text-green-400'
                        : 'text-cyan-500/40 hover:text-green-400 hover:bg-green-500/10'
                        }`}
                    title="Good response"
                >
                    <ThumbsUp size={14} />
                </button>
                <button
                    onClick={() => handleRating('negative')}
                    className={`p-1.5 rounded transition-colors ${rating === 'negative'
                        ? 'bg-red-500/20 text-red-400'
                        : 'text-cyan-500/40 hover:text-red-400 hover:bg-red-500/10'
                        }`}
                    title="Bad response"
                >
                    <ThumbsDown size={14} />
                </button>
            </div>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 border border-cyan-500/30 rounded-lg p-6 max-w-md w-full mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-cyan-400">Provide Feedback</h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-cyan-500/60 hover:text-cyan-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-cyan-500/80 mb-2">
                                        What went wrong?
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-3 py-2 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="">Select a category</option>
                                        <option value="accuracy">Inaccurate information</option>
                                        <option value="helpfulness">Not helpful</option>
                                        <option value="speed">Too slow</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-cyan-500/80 mb-2">
                                        Additional comments (optional)
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Tell us more..."
                                        className="w-full px-3 py-2 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 focus:outline-none focus:border-cyan-500 resize-none"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSubmitModal}
                                        disabled={submitting}
                                        className="flex-1 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit'}
                                    </button>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 border border-cyan-500/30 rounded text-cyan-500/60 hover:text-cyan-400 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FeedbackButtons;
