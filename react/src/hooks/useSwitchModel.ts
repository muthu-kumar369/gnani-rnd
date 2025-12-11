import React from 'react';
import { useModelStore } from '../store/useModelStore';
import { useConversationStore } from '../store/useConversationStore';
import api from '../api/client';


export const useSwitchModel = () => {
    const { currentModel, setModel } = useModelStore();
    const { conversationId, addMessage } = useConversationStore();

    const switchModel = async (modelId: string) => {
        const previousModel = currentModel.name;

        // Update local model selection
        setModel(modelId);

        // Get new model name
        const newModel = useModelStore.getState().currentModel.name;

        // Update conversation model on backend if conversation exists
        if (conversationId) {
            try {
                await import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                    api.patch(`/conversations/${conversationId}/model`, { model: modelId })
                ));

                // Add system message to show model switch
                addMessage({
                    type: 'system',
                    message: `Switched from ${previousModel} to ${newModel}`,
                    metadata: {
                        model: modelId,
                    },
                });
            } catch (error) {
                console.error('Failed to switch model on backend:', error);
                // Revert on error
                setModel(currentModel.id);
            }
        }
    };

    return { switchModel, currentModel };
};
