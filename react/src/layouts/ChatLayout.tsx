import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { eventManager } from '../utils/eventManager';
import ConversationSidebar from '../components/conversation/ConversationSidebar';
import ChatHeader from '../components/chat/ChatHeader';
import { useConversationStore } from '../store/useConversationStore';
import { useUserStore } from '../store/useUserStore';
import { useModalStore } from '../store/useModalStore';
import AnalyticsModal from '../components/analytics/AnalyticsModal';
import AdvancedSearch from '../components/common/AdvancedSearch';
import SettingsModal from '../components/settings/SettingsModal';
import WorkspaceModal from '../components/workspace/WorkspaceModal';
import { ErrorBoundary } from '../components/ErrorBoundary';
import errorLogger from '../utils/errorLogger';

const ChatLayout: React.FC = () => {
    const {
        showSettings,
        settingsTab,
        closeSettings,
        showWorkspace,
        workspaceTab,
        closeWorkspace
    } = useModalStore();
    const {
        createConversation,
        fetchConversations,
        loadConversation,
        conversationId
    } = useConversationStore();
    const { accessToken } = useUserStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [showAnalytics, setShowAnalytics] = React.useState(false);
    const [showAdvancedSearch, setShowAdvancedSearch] = React.useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    // Initialize open on desktop, closed on mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // Optional: Auto-close on resize to mobile, auto-open on resize to desktop could be added here
            // For now, we just update isMobile which changes the variant
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleNewChat = async () => {
        if (!accessToken) return;
        try {
            await fetchConversations(accessToken);
            if (isMobile) setIsSidebarOpen(false);
        } catch (error) {
            errorLogger.error('Failed to create new chat', error, { context: 'ChatLayout' });
        }
    };

    const handleSelectConversation = async (id: string) => {
        if (!accessToken) return;
        try {
            // Only navigate if we are NOT on the chat page
            // Use startsWith to handle potential sub-paths or trailing slashes
            const isChatPath = location.pathname.startsWith('/chat') || location.pathname === '/';

            if (!isChatPath) {
                navigate('/chat');
            }

            await loadConversation(id, accessToken);
            if (isMobile) setIsSidebarOpen(false);
        } catch (error) {
            errorLogger.error('Failed to load conversation', error, { context: 'ChatLayout' });
        }
    };

    // Listen for global events
    useEffect(() => {
        const handleOpenSearch = () => setShowAdvancedSearch(true);
        const handleToggleSidebar = () => {
            console.log('[ChatLayout] Toggling sidebar');
            setIsSidebarOpen(prev => !prev);
        };
        const handleOpenSettings = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            useModalStore.getState().openSettings(detail?.tab);
        };

        const handleOpenWorkspace = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            useModalStore.getState().openWorkspace(detail?.tab);
        };

        const cleanupSearch = eventManager.addEventListener('open-advanced-search', handleOpenSearch, undefined, 'ChatLayout');
        const cleanupSidebar = eventManager.addEventListener('keyboard:toggle-sidebar', handleToggleSidebar, undefined, 'ChatLayout');
        const cleanupSettings = eventManager.addEventListener('keyboard:open-settings', handleOpenSettings, undefined, 'ChatLayout');
        const cleanupWorkspace = eventManager.addEventListener('keyboard:open-workspace', handleOpenWorkspace, undefined, 'ChatLayout');

        return () => {
            cleanupSearch();
            cleanupSidebar();
            cleanupSettings();
            cleanupWorkspace();
        };
    }, [navigate]);

    return (
        <div className="flex h-screen w-full bg-jarvis-bg overflow-hidden text-jarvis-text font-sans">
            {/* Sidebar */}
            <ConversationSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onNewConversation={handleNewChat}
                variant={isMobile ? 'overlay' : 'static'}
                onSelectConversation={handleSelectConversation}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <ChatHeader
                    onOpenSearch={() => setShowAdvancedSearch(true)}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />

                {/* Page Content (ChatPage) */}
                <div id="main-content" className="flex-1 relative overflow-hidden animate-fade-in">
                    <Outlet />
                </div>
            </div>

            {/* Global Modals */}
            <AnalyticsModal isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} />
            <AdvancedSearch isOpen={showAdvancedSearch} onClose={() => setShowAdvancedSearch(false)} />
            <SettingsModal isOpen={showSettings} onClose={closeSettings} initialTab={settingsTab} />
            <WorkspaceModal isOpen={showWorkspace} onClose={closeWorkspace} initialTab={workspaceTab} />
        </div>
    );
};

export default ChatLayout;
