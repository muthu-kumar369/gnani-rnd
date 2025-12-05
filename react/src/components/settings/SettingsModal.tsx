import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn } from 'lucide-react';
import SettingsSidebar, { type SettingsTab } from './SettingsSidebar';
import ProfileSection from './sections/ProfileSection';
import AssistantSettingsSection from './sections/AssistantSettingsSection';
import DevicesSection from './sections/DevicesSection';
import SecuritySection from './sections/SecuritySection';
import LinkedAccountsSection from './sections/LinkedAccountsSection';
import ActivityHistorySection from './sections/ActivityHistorySection';
import PreferencesSection from './sections/PreferencesSection';
import AboutSection from './sections/AboutSection';
import TemplatesSection from './sections/TemplatesSection';
import AvatarSettings from './AvatarSettings';
import HotkeySettings from './HotkeySettings';
import { useUserStore } from '../../store/useUserStore';
import Loader from '../ui/Loader';
import ThemeToggle from './ThemeToggle';
import ToolMarketplace from '../tools/ToolMarketplace';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: SettingsTab;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialTab }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const { user, loading, logout } = useUserStore();
    const modalRef = useFocusTrap(isOpen);

    // Set initial tab when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab || 'profile');
        }
    }, [isOpen, initialTab]);

    const renderContent = () => {
        switch (activeTab) {
            case 'profile': return <ProfileSection />;
            case 'assistant': return <AssistantSettingsSection />;
            case 'templates': return <TemplatesSection />;
            case 'devices': return <DevicesSection />;
            case 'security': return <SecuritySection />;
            case 'accounts': return <LinkedAccountsSection />;
            case 'history': return <ActivityHistorySection />;
            case 'preferences': return <PreferencesSection />;
            case 'hotkey': return <HotkeySettings />;
            case 'about': return <AboutSection />;
            case 'avatar': return <AvatarSettings />;
            case 'tools': return <ToolMarketplace />;
            default: return <ProfileSection />;
        }
    };

    return (
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
                        aria-labelledby="settings-modal-title"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-6xl h-[85vh] glass-panel rounded-xl overflow-hidden flex focus:outline-none"
                        tabIndex={-1}
                    >
                        {/* Header Actions */}
                        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                            <ThemeToggle />
                            <button
                                onClick={onClose}
                                className="p-2 text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <Loader size="lg" text="Loading settings..." />
                            </div>
                        ) : !user ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-8">
                                <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
                                    <LogIn className="w-8 h-8 text-cyan-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-cyan-100">Authentication Required</h3>
                                <p className="text-cyan-400/60 max-w-md">
                                    You need to be logged in to access settings. Please sign in to your account.
                                </p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => {
                                            logout();
                                            onClose();
                                            window.location.href = '/login';
                                        }}
                                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center gap-2"
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
                                <div className="flex-1 h-full overflow-hidden flex flex-col bg-black/20">
                                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeTab}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.15, ease: "easeOut" }}
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
