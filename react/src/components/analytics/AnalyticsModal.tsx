import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3 } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import AnalyticsDashboard from '../common/AnalyticsDashboard';

interface AnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

import { eventManager } from '../../utils/eventManager';

import { useThemeStore } from '../../store/themeStore';

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
    const modalRef = useFocusTrap(isOpen);
    const { theme } = useThemeStore();

    useEffect(() => {
        if (!isOpen) return;
        const cleanup = eventManager.addEventListener('keyboard:escape', onClose, undefined, 'AnalyticsModal');
        return cleanup;
    }, [isOpen, onClose]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="analytics-modal-title"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className={`relative w-full max-w-6xl h-[85vh] rounded-2xl overflow-hidden flex flex-col focus:outline-none shadow-2xl ${theme === 'dark' ? 'bg-[#1a2639] ring-1 ring-white/10' : 'bg-white ring-1 ring-black/5'}`}
                        tabIndex={-1}
                    >
                        {/* Header Actions */}
                        <div className={`flex items-center justify-between p-6 border-b shrink-0 ${theme === 'dark' ? 'bg-[#1a2639] border-white/5' : 'bg-white border-gray-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg border ${theme === 'dark' ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-blue-50/50 border-blue-100'}`}>
                                    <BarChart3 className={`w-5 h-5 ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`} />
                                </div>
                                <h2 id="analytics-modal-title" className={`text-base font-semibold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Analytics & Usage
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Main Content Area */}
                        <div className={`flex-1 overflow-hidden relative ${theme === 'dark' ? 'bg-[#1a2639]' : 'bg-white'}`}>
                            {/* Re-using AnalyticsDashboard but making sure it fits nicely */}
                            {/* AnalyticsDashboard has its own padding/layout, so we might render it directly */}
                            <div className="w-full h-full overflow-hidden">
                                <AnalyticsDashboard />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default AnalyticsModal;
