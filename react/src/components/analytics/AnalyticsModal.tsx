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

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
    const modalRef = useFocusTrap(isOpen);

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
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
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
                        className="relative w-full max-w-6xl h-[85vh] glass-panel rounded-xl overflow-hidden flex flex-col focus:outline-none bg-jarvis-bg border border-jarvis-blue/30 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                        tabIndex={-1}
                    >
                        {/* Header Actions */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <BarChart3 className="w-5 h-5 text-blue-400" />
                                </div>
                                <h2 id="analytics-modal-title" className="text-xl font-semibold text-white tracking-wide">
                                    Analytics & Usage
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 overflow-hidden relative bg-black/20">
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
