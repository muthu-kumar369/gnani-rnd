import React, { useState } from 'react';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import { useChatSession } from '../hooks/useChatSession';
import { useConversationStore } from '../store/useConversationStore';
import { useUserStore } from '../store/useUserStore';
import VoiceModeOverlay from '../components/chat/VoiceModeOverlay';

const ChatPage: React.FC = () => {
    const { sendMessage, isThinking } = useChatSession();
    const { messages, isStreaming, cancelStream, conversationId } = useConversationStore();
    const { accessToken } = useUserStore();
    const [isVoiceMode, setIsVoiceMode] = useState(false);

    const handleMicClick = () => {
        setIsVoiceMode(true);
    };

    const handleStop = () => {
        if (conversationId && accessToken) {
            // Use 'current' as sessionId placeholder if actual stream ID isn't tracked in component
            // store handles logic
            cancelStream('current', accessToken);
        }
    };

    return (
        <div className="flex flex-col h-full relative">
            <MessageList messages={messages} isLoading={isThinking && !isStreaming} />
            <ChatInput
                onSend={sendMessage}
                onMicClick={handleMicClick}
                disabled={isThinking && !isStreaming} // Allow input if not thinking (e.g. while streaming, we might want to stop?) -> Actually "disabled" usually blocks typing. 
                // If isStreaming, we show Stop button. Input should probably be disabled or allowed? ChatGPT allows typing while generating but queues it. For now let's disable.
                isStreaming={isStreaming}
                onStop={handleStop}
            />

            <VoiceModeOverlay
                isVisible={isVoiceMode}
                onClose={() => setIsVoiceMode(false)}
            />
        </div>
    );
};

export default ChatPage;
