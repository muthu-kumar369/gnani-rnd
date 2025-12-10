import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MessageBubble from '../terminal/MessageBubble';

// Mock dependencies
const mockNavigateToBranch = vi.fn();
vi.mock('../../store/useConversationStore', () => ({
    useConversationStore: vi.fn(() => ({
        navigateToBranch: mockNavigateToBranch,
        navigateToGeneration: vi.fn(),
        conversationId: 'test-conv',
        allMessages: [],
    })),
}));

vi.mock('../../store/useUserStore', () => ({
    useUserStore: vi.fn(() => ({
        accessToken: 'test-token',
    })),
}));

const mockEditMessage = vi.fn();
vi.mock('../../hooks/useMessageActions', () => ({
    useMessageActions: vi.fn(() => ({
        editMessage: mockEditMessage,
        deleteMessage: vi.fn(),
        regenerateMessage: vi.fn(),
        copyMessage: vi.fn(),
        getMessageGenerations: vi.fn(() => Promise.resolve([])),
        isLoading: false,
    })),
}));

describe('Message Edit Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show inline editor and save changes', async () => {
        const message = {
            id: '1',
            type: 'user',
            message: 'Hello',
            timestamp: new Date().toISOString(),
            parentId: null,
            children: []
        };

        render(<MessageBubble message={message as any} isLatest={true} />);

        // Target the absolute positioned inline button directly.
        // It has title "Edit message (inline)"
        const editButton = screen.getByTitle('Edit message (inline)');
        fireEvent.click(editButton);

        // Verify Editor appears (textarea)
        await waitFor(() => {
            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });

        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('Hello');

        // Edit Text
        fireEvent.change(textarea, { target: { value: 'Hello World' } });
        expect(textarea).toHaveValue('Hello World');

        // Save
        const saveButton = screen.getByTitle('Save (Ctrl+Enter)');
        fireEvent.click(saveButton);

        // Verify editMessage called
        await waitFor(() => {
            expect(mockEditMessage).toHaveBeenCalledWith('1', 'Hello World', true);
        });
    });
});
