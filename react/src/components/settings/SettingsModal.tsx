import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import SettingsSidebar, { type SettingsTab } from './SettingsSidebar';
import ProfileSection from './sections/ProfileSection';
import AssistantSettingsSection from './sections/AssistantSettingsSection';
import DevicesSection from './sections/DevicesSection';
import SecuritySection from './sections/SecuritySection';
import LinkedAccountsSection from './sections/LinkedAccountsSection';
import ActivityHistorySection from './sections/ActivityHistorySection';
import PreferencesSection from './sections/PreferencesSection';
import AboutSection from './sections/AboutSection';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    const renderContent = () => {
        switch (activeTab) {
            case 'profile': return <ProfileSection />;
            case 'assistant': return <AssistantSettingsSection />;
            case 'devices': return <DevicesSection />;
            case 'security': return <SecuritySection />;
            case 'accounts': return <LinkedAccountsSection />;
            case 'history': return <ActivityHistorySection />;
            case 'preferences': return <PreferencesSection />;
            case 'about': return <AboutSection />;
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
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-6xl h-[85vh] bg-gray-900/90 border border-cyan-500/30 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-2 text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>

                        {/* Sidebar */}
                        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

                        {/* Main Content Area */}
                        <div className="flex-1 h-full overflow-hidden flex flex-col bg-black/20">
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {renderContent()}
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SettingsModal;
