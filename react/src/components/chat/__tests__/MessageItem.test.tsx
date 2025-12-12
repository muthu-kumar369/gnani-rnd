import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageItem from '../MessageItem';
import { useConversationStore } from '../../../store/useConversationStore';
import { useUserStore } from '../../../store/useUserStore';
import '@testing-library/jest-dom';

// Mock stores
vi.mock('../../../store/useConversationStore', () => ({
    useConversationStore: vi.fn(),
}));

vi.mock('../../../store/useUserStore', () => ({
    useUserStore: vi.fn(),
}));

// Mock BranchTree and GenerationNavigator
vi.mock('../BranchTree', () => ({
    default: () => <div data-testid="branch-tree">BranchTree</div>
}));

vi.mock('../GenerationNavigator', () => ({
    default: () => <div data-testid="generation-navigator">GenerationNavigator</div>
}));

vi.mock('../../common/FeedbackButtons', () => ({
    default: () => <div data-testid="feedback-buttons">FeedbackButtons</div>
}));

// Mock ReactMarkdown
vi.mock('react-markdown', () => ({
    default: ({ children }: any) => <div>{children}</div>
}));

describe('MessageItem Stage 2 Features', () => {
    const mockMessage = {
        id: 'msg-1',
        type: 'gnani',
        message: 'Hello world',
        timestamp: Date.now(),
        children: [],
        metadata: { model: 'gpt-4' }
    };

    beforeEach(() => {
        // Setup default store returns
        (useConversationStore as any).mockReturnValue({
            conversationId: 'conv-1',
            navigateToBranch: vi.fn(),
            regenerateResponse: vi.fn(),
            editMessage: vi.fn(),
            allMessages: [mockMessage], // Needed for caching logic sometimes
        });

        (useUserStore as any).mockReturnValue({
            accessToken: 'mock-token',
        });
    });

    it('renders FeedbackButtons for AI messages', () => {
        render(<MessageItem message={mockMessage as any} isLast={true} />);
        expect(screen.getByTestId('feedback-buttons')).toBeInTheDocument();
    });

    it('does not render FeedbackButtons for User messages', () => {
        const userMsg = { ...mockMessage, type: 'user' };
        render(<MessageItem message={userMsg as any} isLast={true} />);
        expect(screen.queryByTestId('feedback-buttons')).not.toBeInTheDocument();
    });

    it('toggles Branch Tree visibility', () => {
        render(<MessageItem message={mockMessage as any} isLast={true} />);

        // Button should exist
        const branchBtn = screen.getByTitle('Toggle Branch Tree');
        expect(branchBtn).toBeInTheDocument();

        // Initially tree hidden
        expect(screen.queryByTestId('branch-tree')).not.toBeInTheDocument();

        // Click to show
        fireEvent.click(branchBtn);
        expect(screen.getByTestId('branch-tree')).toBeInTheDocument();

        // Click to hide
        fireEvent.click(branchBtn);
        expect(screen.queryByTestId('branch-tree')).not.toBeInTheDocument();
    });
});
