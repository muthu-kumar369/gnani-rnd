import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Share2, Copy, Check, X, Clock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';

interface ShareModalProps {
    conversationId: string;
    onClose: () => void;
}

const expiryOptions = [
    { label: 'Never', value: undefined },
    { label: '1 hour', value: 3600 },
    { label: '24 hours', value: 86400 },
    { label: '7 days', value: 604800 },
    { label: '30 days', value: 2592000 },
];

const ShareModal: React.FC<ShareModalProps> = ({ conversationId, onClose }) => {
    const [shareUrl, setShareUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [expiresIn, setExpiresIn] = useState<number | undefined>(undefined);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleCreateShare = async () => {
        setLoading(true);
        try {
            const response = await import('../../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                api.post(`/conversations/${conversationId}/share`, {
                    expiresIn,
                })
            ));
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

    if (typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
                // Determine if click is on backdrop
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-900 border border-cyan-500/30 rounded-lg p-6 max-w-md w-full mx-4 relative"
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
                            <div className="relative">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full px-3 py-2 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 flex items-center justify-between hover:border-cyan-500/50 transition-colors"
                                >
                                    <span>
                                        {expiryOptions.find(opt => opt.value === expiresIn)?.label || 'Never'}
                                    </span>
                                    <ChevronDown
                                        size={16}
                                        className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                <AnimatePresence>
                                    {isDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-cyan-500/30 rounded-lg shadow-xl z-50 overflow-hidden"
                                        >
                                            {expiryOptions.map((option) => (
                                                <button
                                                    key={option.label}
                                                    onClick={() => {
                                                        setExpiresIn(option.value);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="w-full px-3 py-2 text-left text-cyan-400 hover:bg-cyan-500/10 transition-colors flex items-center justify-between"
                                                >
                                                    <span>{option.label}</span>
                                                    {expiresIn === option.value && <Check size={14} />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
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
        </motion.div>,
        document.body
    );
};

export default ShareModal;
