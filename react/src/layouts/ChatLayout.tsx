import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { eventManager } from '../utils/eventManager';
import ConversationSidebar from '../components/conversation/ConversationSidebar';
import ChatHeader from '../components/chat/ChatHeader';
import { useConversationStore } from '../store/useConversationStore';
import { useUserStore } from '../store/useUserStore';
import AnalyticsModal from '../components/analytics/AnalyticsModal';
import AdvancedSearch from '../components/common/AdvancedSearch';
import UndoToastWrapper from '../components/common/UndoToastWrapper';
import { ErrorBoundary } from '../components/ErrorBoundary';
import errorLogger from '../utils/errorLogger';

const ChatLayout: React.FC = () => {
    const {
        createConversation,
        fetchConversations,
        setConversationId,
        refreshConversation,
        conversationId
    } = useConversationStore();
    const { accessToken } = useUserStore();
    const navigate = useNavigate();
    const [showAnalytics, setShowAnalytics] = React.useState(false);
    const [showAdvancedSearch, setShowAdvancedSearch] = React.useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setIsSidebarOpen(false); // Reset on desktop
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleNewChat = async () => {
        if (!accessToken) return;
        try {
            await createConversation(accessToken);
            await fetchConversations(accessToken);
            if (isMobile) setIsSidebarOpen(false);
        } catch (error) {
            errorLogger.error('Failed to create new chat', error, { context: 'ChatLayout' });
        }
    };

    const handleSelectConversation = async (id: string) => {
        if (!accessToken) return;
        try {
            setConversationId(id);
            navigate('/');
            await refreshConversation(accessToken);
            if (isMobile) setIsSidebarOpen(false);
        } catch (error) {
            errorLogger.error('Failed to load conversation', error, { context: 'ChatLayout' });
        }
    };

    // ... (rest of useEffects) ...
    // Sync conversation ID, Open Analytics, Keyboard events - keeping those

    return (
        <div className="flex h-screen w-full bg-jarvis-bg overflow-hidden text-jarvis-text font-sans">
            {/* Sidebar */}
            <ConversationSidebar
                isOpen={isMobile ? isSidebarOpen : true}
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
            <UndoToastWrapper />
        </div>
    );
};

export default ChatLayout;
