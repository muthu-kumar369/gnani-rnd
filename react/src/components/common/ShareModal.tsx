import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Share2, Copy, Check, X, Clock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';
import { eventManager } from '../../utils/eventManager';
import { useThemeStore } from '../../store/themeStore';

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
    const { theme } = useThemeStore();

    useEffect(() => {
        const cleanup = eventManager.addEventListener('keyboard:escape', onClose, undefined, 'ShareModal');
        return cleanup;
    }, [onClose]);

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
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`relative w-full max-w-md rounded-2xl shadow-2xl p-6 ${theme === 'dark' ? 'bg-[#1a2639] ring-1 ring-white/10' : 'bg-white ring-1 ring-black/5'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between mb-6 border-b pb-4 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${theme === 'dark' ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-blue-50/50 border-blue-100'}`}>
                            <Share2 className={`w-5 h-5 ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`} />
                        </div>
                        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Share Conversation
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {!shareUrl ? (
                    <div className="space-y-5">
                        <div className="relative">
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <Clock size={14} className="inline mr-1.5 -mt-0.5 opacity-60" />
                                Link Expiration
                            </label>

                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`w-full px-4 py-2.5 rounded-lg border flex items-center justify-between transition-all ${theme === 'dark'
                                    ? 'bg-black/20 border-white/10 hover:border-cyan-500/50 text-white'
                                    : 'bg-white border-gray-200 hover:border-blue-500 text-gray-900'}`}
                            >
                                <span>
                                    {expiryOptions.find(opt => opt.value === expiresIn)?.label || 'Never'}
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={`transform transition-transform opacity-50 ${isDropdownOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className={`absolute top-full left-0 right-0 mt-2 rounded-lg shadow-xl z-50 overflow-hidden border ${theme === 'dark' ? 'bg-[#1a2639] border-white/10 text-gray-200' : 'bg-white border-gray-100 text-gray-700'}`}
                                    >
                                        {expiryOptions.map((option) => (
                                            <button
                                                key={option.label}
                                                onClick={() => {
                                                    setExpiresIn(option.value);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full px-4 py-2.5 text-left transition-colors flex items-center justify-between text-sm hover:bg-opacity-50 ${theme === 'dark'
                                                        ? (expiresIn === option.value ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-cyan-500/10 text-gray-200')
                                                        : (expiresIn === option.value ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50 text-gray-700')
                                                    }`}
                                            >
                                                <span>{option.label}</span>
                                                {expiresIn === option.value && <Check size={14} className={theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'} />}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={handleCreateShare}
                            disabled={loading}
                            className={`w-full px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
                                ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'}`}
                        >
                            {loading ? 'Creating link...' : 'Create shareable link'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                Shareable Link
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={shareUrl}
                                    readOnly
                                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm border outline-none ${theme === 'dark'
                                        ? 'bg-black/20 border-white/10 text-gray-300 focus:border-cyan-500/50'
                                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'}`}
                                />
                                <button
                                    onClick={handleCopy}
                                    className={`px-4 py-2.5 rounded-lg transition-colors border ${theme === 'dark'
                                        ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20'
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg text-xs leading-relaxed ${theme === 'dark' ? 'bg-white/5 text-gray-400' : 'bg-blue-50 text-blue-800'}`}>
                            Anyone with this link can view this conversation
                            {expiresIn && ` for the next ${expiresIn < 86400 ? `${expiresIn / 3600} hour(s)` : `${expiresIn / 86400} day(s)`}`}.
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>,
        document.body
    );
};

export default ShareModal;
