import React, { useState } from 'react';
import { Share2, Copy, Check, X, Globe, Link, Lock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';

interface ShareButtonProps {
    conversationId: string;
    conversationTitle?: string;
    className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ conversationId, conversationTitle, className = '' }) => {
    const [showModal, setShowModal] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [expiresIn, setExpiresIn] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isPublic, setIsPublic] = useState(false);

    const handleShare = async () => {
        setLoading(true);
        try {
            // Check if already shared (optional optimization, or backend handles upsert)
            // For now, simple create/get logic
            const response = await api.post('/share', {
                conversationId,
                // Default to 7 days if not specified? Or permanent? Backend dependent.
                // Sending nothing for now to let backend decide defaults.
            });

            // Assuming response contains shareUrl
            setShareUrl(response.data.shareUrl || `${window.location.origin}/share/${response.data.shareId}`);
            setIsPublic(true);
            setShowModal(true);
        } catch (error) {
            console.error('Failed to create share link:', error);
            // Could add toast here
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRevoke = async () => {
        try {
            setLoading(true);
            await api.delete(`/share/${conversationId}`);
            setIsPublic(false);
            setShowModal(false);
            setShareUrl('');
        } catch (error) {
            console.error('Failed to revoke share:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={handleShare}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors ${className}`}
                title="Share Conversation"
            >
                <Share2 size={18} />
                <span className="text-sm hidden md:inline">Share</span>
            </button>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-jarvis-bg border border-jarvis-blue/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-jarvis-blue/10 flex items-center justify-center text-jarvis-blue border border-jarvis-blue/20">
                                        <Globe size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">
                                            Share Conversation
                                        </h3>
                                        <p className="text-xs text-gray-400">
                                            Anyone with the link can view this chat
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-500 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Link Display */}
                                <div>
                                    <label className="block text-xs font-semibold text-jarvis-blue uppercase tracking-wider mb-2">
                                        Public Link
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                                                <Link size={14} />
                                            </div>
                                            <input
                                                type="text"
                                                value={shareUrl}
                                                readOnly
                                                className="w-full pl-9 pr-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-jarvis-blue/50 font-mono"
                                            />
                                        </div>
                                        <button
                                            onClick={handleCopy}
                                            className={`px-4 py-2.5 rounded-lg border font-medium transition-all flex items-center gap-2 min-w-[100px] justify-center ${copied
                                                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                                    : 'bg-jarvis-blue/10 border-jarvis-blue/30 text-jarvis-blue hover:bg-jarvis-blue/20'
                                                }`}
                                        >
                                            {copied ? (
                                                <>
                                                    <Check size={16} />
                                                    <span>Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={16} />
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                                        <Globe size={12} />
                                        <span>Publicly accessible</span>
                                    </div>

                                    <button
                                        onClick={handleRevoke}
                                        disabled={loading}
                                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-500/10 rounded transition-colors"
                                    >
                                        <Trash2 size={12} />
                                        Revoke Access
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

export default ShareButton;
