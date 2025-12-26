import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import WorkspaceSidebar, { type WorkspaceTab } from './WorkspaceSidebar';
import TemplatesSection from './sections/TemplatesSection';
import ToolMarketplace from '../tools/ToolMarketplace';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { eventManager } from '../../utils/eventManager';
import { useThemeStore } from '../../store/themeStore';

interface WorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: WorkspaceTab;
}

const WorkspaceModal: React.FC<WorkspaceModalProps> = ({ isOpen, onClose, initialTab }) => {
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('templates');
    const { theme } = useThemeStore();
    const modalRef = useFocusTrap(isOpen);

    // Set initial tab when modal opens
    useEffect(() => {
        if (isOpen) {
            console.log('[WorkspaceModal] Opening with tab:', initialTab);
            setActiveTab(initialTab || 'templates');

            // Listen for Esc key
            const cleanup = eventManager.addEventListener('keyboard:escape', onClose, undefined, 'WorkspaceModal');
            return cleanup;
        }
    }, [isOpen, initialTab, onClose]);

    const renderContent = () => {
        switch (activeTab) {
            case 'templates': return <TemplatesSection />;
            case 'tools': return <ToolMarketplace />;
            default: return <TemplatesSection />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8">
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
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className={`relative w-full max-w-6xl h-full max-h-[90vh] rounded-xl overflow-hidden flex shadow-2xl ring-1 ring-black/5 dark:ring-white/10 ${theme === 'dark' ? 'bg-[#0f1a2b]' : 'bg-white'}`}
                    >
                        {/* Sidebar */}
                        <WorkspaceSidebar activeTab={activeTab} onTabChange={setActiveTab} />

                        {/* Main Content Area */}
                        <div className={`flex-1 flex flex-col min-w-0 relative overflow-hidden ${theme === 'dark' ? 'bg-[#0f1a2b]' : 'bg-gray-50'}`}>
                            {/* Fixed Header */}
                            {/* Fixed Header */}
                            <div className={`flex-none flex items-center justify-between px-6 py-4 z-20 ${theme === 'dark' ? 'bg-black/20 shadow-[0_4px_6px_-2px_rgba(0,0,0,0.3)]' : 'bg-gray-50/80 shadow-[0_4px_6px_-2px_rgba(0,0,0,0.1)]'}`}>
                                <div>
                                    <h2 className="text-lg font-bold text-type-primary tracking-tight">
                                        {activeTab === 'templates' && 'Conversation Templates'}
                                        {activeTab === 'tools' && 'Tool Marketplace'}
                                    </h2>
                                    <p className="text-xs text-type-muted mt-0.5">
                                        {activeTab === 'templates' && 'Create and manage conversation presets'}
                                        {activeTab === 'tools' && 'Discover and install powerful capabilities'}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 text-type-muted hover:text-gnani-primary hover:bg-gnani-primary/10 rounded-lg transition-all duration-200"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content Render */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                                {renderContent()}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default WorkspaceModal;
