import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/chat/Sidebar';
import ChatHeader from '../components/chat/ChatHeader';
import { useConversationStore } from '../store/useConversationStore';
import { useUserStore } from '../store/useUserStore';
import AnalyticsModal from '../components/analytics/AnalyticsModal';
import AdvancedSearch from '../components/common/AdvancedSearch';
import UndoToastWrapper from '../components/common/UndoToastWrapper';
import { ErrorBoundary } from '../components/ErrorBoundary';

const ChatLayout: React.FC = () => {
    const { createConversation, fetchConversations, conversationId } = useConversationStore();
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
            console.error('Failed to create new chat', error);
        }
    };

    // Sync conversation ID from Store to Electron (pushes local state to backend/electron)
    useEffect(() => {
        if (conversationId && window.gnani?.stream?.setConversationId) {
            console.log('[ChatLayout] Pushing conversationId to Electron:', conversationId);
            window.gnani.stream.setConversationId(conversationId);
        }
    }, [conversationId]);

    // Handle Open Analytics Event
    useEffect(() => {
        const handleOpenAnalytics = () => {
            console.log('[ChatLayout] Opening Analytics Modal');
            setShowAnalytics(true);
        };
        window.addEventListener('open-analytics', handleOpenAnalytics);
        return () => window.removeEventListener('open-analytics', handleOpenAnalytics);
    }, []);

    // Handle Cmd+K / Ctrl+K for Advanced Search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowAdvancedSearch(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="flex h-screen w-full bg-jarvis-bg overflow-hidden text-jarvis-text font-sans">
            {/* Sidebar */}
            <Sidebar onNewChat={handleNewChat} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <ChatHeader />

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
