import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn } from 'lucide-react';
import SettingsSidebar, { type SettingsTab } from './SettingsSidebar';
import GeneralSection from './sections/GeneralSection';
import PersonalizationSection from './sections/PersonalizationSection';
import DataConnectorsSection from './sections/DataConnectorsSection';
import SecuritySection from './sections/SecuritySection';
// Deprecated imports removed
import { useUserStore } from '../../store/useUserStore';
import Loader from '../ui/Loader';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { eventManager } from '../../utils/eventManager';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: SettingsTab;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialTab }) => {
    // Default to 'general' instead of 'profile'
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const { user, loading, logout } = useUserStore();
    const modalRef = useFocusTrap(isOpen);

    // Set initial tab when modal opens
    useEffect(() => {
        if (isOpen) {
            // Map legacy tabs to new structure if passed
            const legacyMap: Record<string, SettingsTab> = {
                'profile': 'personalization',
                'assistant': 'general',
                'devices': 'data',
                'accounts': 'data',
                'history': 'data',
                'security': 'security'
            };

            const tab = (initialTab && legacyMap[initialTab]) ? legacyMap[initialTab] : (initialTab as SettingsTab) || 'general';
            setActiveTab(tab);

            // Listen for Esc
            const cleanup = eventManager.addEventListener('keyboard:escape', onClose, undefined, 'SettingsModal');
            return cleanup;
        }
    }, [isOpen, initialTab, onClose]);

    const renderContent = () => {
        switch (activeTab) {
            case 'general': return <GeneralSection />;
            case 'personalization': return <PersonalizationSection />;
            case 'data': return <DataConnectorsSection />;
            case 'security': return <SecuritySection />;
            default: return <GeneralSection />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="settings-modal-title"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        className="relative w-full max-w-6xl h-[85vh] bg-[#0a0a15]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex shadow-2xl"
                        tabIndex={-1}
                    >


                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <Loader size="lg" text="Loading settings..." />
                            </div>
                        ) : !user ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-center p-8">
                                <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 flex items-center justify-center mb-2 ring-1 ring-cyan-500/20">
                                    <LogIn className="w-10 h-10 text-cyan-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white">Authentication Required</h3>
                                    <p className="text-slate-400 max-w-md mx-auto">
                                        You need to be logged in to access settings. Please sign in to your account.
                                    </p>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-colors font-medium"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => {
                                            logout();
                                            onClose();
                                            window.location.href = '/login';
                                        }}
                                        className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl transition-all font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center gap-2"
                                    >
                                        <LogIn size={18} />
                                        Login
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Sidebar */}
                                <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

                                {/* Main Content Area */}
                                <div className="flex-1 flex flex-col min-w-0 bg-black/40 relative">
                                    {/* Fixed Header */}
                                    <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a15]/50 backdrop-blur-xl z-20">
                                        <div>
                                            <h2 className="text-lg font-bold text-white tracking-tight">
                                                {activeTab === 'general' && 'General Settings'}
                                                {activeTab === 'personalization' && 'Personalization'}
                                                {activeTab === 'data' && 'Data & Connectors'}
                                                {activeTab === 'security' && 'Security'}
                                            </h2>
                                            <p className="text-xs text-cyan-400/60 mt-0.5">
                                                {activeTab === 'general' && 'Manage voice, appearance, and system preferences'}
                                                {activeTab === 'personalization' && 'Customize your profile and experience'}
                                                {activeTab === 'data' && 'Manage data sources and connected accounts'}
                                                {activeTab === 'security' && 'Security settings and permissions'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={onClose}
                                                className="p-1.5 text-cyan-400/50 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all duration-200"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content Render */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeTab}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                className="p-8 max-w-5xl mx-auto"
                                            >
                                                {renderContent()}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SettingsModal;
