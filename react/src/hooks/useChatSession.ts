import { useState, useEffect, useRef } from 'react';
import { useAudioStream } from './useAudioStream';
import { useIPC } from './useIPC';
import { useConversationStore } from '../store/useConversationStore';
import { useUserStore } from '../store/useUserStore';

export const useChatSession = () => {
    const { sendText } = useAudioStream();
    const { latestLLMChunk, latestFinalSTT } = useIPC();
    const {
        addMessage,
        updateLastMessageContent,
        updateMessageContent,
        setIsStreaming,
        refreshConversation,
        sendMessage: storeSendMessage
    } = useConversationStore();
    const { accessToken } = useUserStore();

    const [isThinking, setIsThinking] = useState(false);

    // Persist streaming text across renders
    const currentStreamText = useRef('');

    const sendMessage = async (text: string, attachments: any[] = []) => {
        if (!text.trim() && attachments.length === 0) return;

        setIsThinking(true);

        try {
            // If attachments exist, force REST (pass undefined for gRPC handler)
            // Otherwise, try gRPC (sendText)
            const grpcHandler = attachments.length > 0 ? undefined : sendText;

            await storeSendMessage(text, accessToken || '', attachments, grpcHandler);
        } catch (error) {
            console.error('Failed to send message', error);
            setIsThinking(false);
        }
    };

    // Listen to LLM Chunks
    useEffect(() => {
        if (!latestLLMChunk) return;

        try {
            let chunk = latestLLMChunk.payload;
            // Parse if string
            if (typeof chunk === 'string') {
                try {
                    chunk = JSON.parse(chunk);
                } catch (e) {
                    chunk = { type: 'partial', text: chunk };
                }
            }

            const { type, text } = chunk;

            if (type === 'partial') {
                setIsThinking(false);
                // FIX: Only update if current leaf is an assistant message
                const { currentLeafId, allMessages } = useConversationStore.getState();
                const currentMessage = allMessages.find(m => m.id === currentLeafId);

                if (currentMessage && currentMessage.type === 'gnani') {
                    updateLastMessageContent(text, true); // append to assistant message
                } else {
                    // If current leaf is not assistant, this is an error state
                    console.warn('Partial chunk received but current leaf is not assistant message');
                }
            }
            else if (type === 'complete_response') {
                setIsThinking(false);
                setIsStreaming(false); // Reset streaming state explicitly
                updateLastMessageContent(text, false); // false = replace/finalize

                // Force refresh conversation list to get updated title
                if (accessToken) {
                    refreshConversation(accessToken);
                    // FIX: Also refresh conversation list
                    useConversationStore.getState().fetchConversations(accessToken);
                }
            }

        } catch (error) {
            console.error('Error processing chat chunk', error);
        }

    }, [latestLLMChunk, updateLastMessageContent, accessToken, refreshConversation, setIsStreaming]);

    return {
        sendMessage,
        isThinking
    };
};
