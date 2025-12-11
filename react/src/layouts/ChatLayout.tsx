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

    const handleNewChat = async () => {
        if (!accessToken) return;
        try {
            await createConversation(accessToken);
            await fetchConversations(accessToken);
        } catch (error) {
            errorLogger.error('Failed to create new chat', error, { context: 'ChatLayout' });
        }
    };

    const handleSelectConversation = async (id: string) => {
        if (!accessToken) return;
        try {
            // Match legacy Sidebar logic: Set ID first, then refresh (allows caching mechanisms to work)
            setConversationId(id);
            navigate('/');
            await refreshConversation(accessToken);
        } catch (error) {
            errorLogger.error('Failed to load conversation', error, { context: 'ChatLayout' });
        }
    };

    // Sync conversation ID from Store to Electron (pushes local state to backend/electron)
    useEffect(() => {
        if (conversationId && window.gnani?.stream?.setConversationId) {
            errorLogger.debug(`[ChatLayout] Pushing conversationId to Electron: ${conversationId}`, { context: 'ChatLayout' });
            window.gnani.stream.setConversationId(conversationId);
        }
    }, [conversationId]);

    // Handle Open Analytics Event
    useEffect(() => {
        const handleOpenAnalytics = () => {
            errorLogger.debug('[ChatLayout] Opening Analytics Modal', { context: 'ChatLayout' });
            setShowAnalytics(true);
        };
        const cleanup = eventManager.addEventListener('open-analytics', handleOpenAnalytics as EventListener, undefined, 'ChatLayout');
        return cleanup;
    }, []);

    // Handle Cmd+K / Ctrl+K for Advanced Search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowAdvancedSearch(true);
            }
        };
        const cleanup = eventManager.addEventListener('keydown', handleKeyDown as EventListener, undefined, 'ChatLayout');
        return cleanup;
    }, []);

    return (
        <div className="flex h-screen w-full bg-jarvis-bg overflow-hidden text-jarvis-text font-sans">
            {/* Sidebar - Replaced legacy Sidebar with ConversationSidebar */}
            <ConversationSidebar
                isOpen={true}
                onClose={() => { }}
                onNewConversation={handleNewChat}
                variant="static"
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <ChatHeader onOpenSearch={() => setShowAdvancedSearch(true)} />

                {/* Page Content (ChatPage) */}
                <div className="flex-1 relative overflow-hidden">
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
