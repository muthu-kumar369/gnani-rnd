import React, { useState } from 'react';
import { Share2, Copy, Check, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';

interface ShareModalProps {
    conversationId: string;
    onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ conversationId, onClose }) => {
    const [shareUrl, setShareUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [expiresIn, setExpiresIn] = useState<number | undefined>(undefined);

    const handleCreateShare = async () => {
        setLoading(true);
        try {
            const response = await api.post('/share', {
                conversationId,
                expiresIn,
            });
            setShareUrl(response.data.shareUrl);
        } catch (error) {
            console.error('Failed to create share:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-900 border border-cyan-500/30 rounded-lg p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Share2 size={20} className="text-cyan-400" />
                        <h3 className="text-lg font-semibold text-cyan-400">Share Conversation</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-cyan-500/60 hover:text-cyan-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {!shareUrl ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-cyan-500/80 mb-2">
                                <Clock size={14} className="inline mr-1" />
                                Link expires in
                            </label>
                            <select
                                value={expiresIn || ''}
                                onChange={(e) => setExpiresIn(e.target.value ? parseInt(e.target.value) : undefined)}
                                className="w-full px-3 py-2 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="">Never</option>
                                <option value="3600">1 hour</option>
                                <option value="86400">24 hours</option>
                                <option value="604800">7 days</option>
                                <option value="2592000">30 days</option>
                            </select>
                        </div>

                        <button
                            onClick={handleCreateShare}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creating link...' : 'Create shareable link'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-cyan-500/80 mb-2">
                                Shareable link
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={shareUrl}
                                    readOnly
                                    className="flex-1 px-3 py-2 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 text-sm"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="px-3 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-cyan-500/60">
                            Anyone with this link can view this conversation
                            {expiresIn && ` for the next ${expiresIn < 86400 ? `${expiresIn / 3600} hour(s)` : `${expiresIn / 86400} day(s)`}`}.
                        </p>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default ShareModal;
