import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/chat/Sidebar';
import ChatHeader from '../components/chat/ChatHeader';
import { useConversationStore } from '../store/useConversationStore';
import { useUserStore } from '../store/useUserStore';

const ChatLayout: React.FC = () => {
    const { createConversation, fetchConversations, conversationId } = useConversationStore();
    const { accessToken } = useUserStore();
    const navigate = useNavigate();

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
        </div>
    );
};

export default ChatLayout;
