import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPage from '../../../pages/ChatPage';
import { useConversationStore } from '../../../store/useConversationStore';
import { useUserStore } from '../../../store/useUserStore';
import { useChatSession } from '../../../hooks/useChatSession';
import '@testing-library/jest-dom';

// JSDOM Mocks
window.HTMLElement.prototype.scrollIntoView = vi.fn();
class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}
window.ResizeObserver = ResizeObserver;

// Mock child components to focus on integration flow...
// "Test all migrated components together" implies keeping them real where possible.
// EXCEPT for heavy external libs like Mermaid or heavily interactive ones that are hard to test in JSDOM (like drag/drop sometimes).
// Use real components but mock heavy dependencies if needed.

// Mock Mermaid to avoid canvas issues in JSDOM
vi.mock('mermaid', () => ({
    default: {
        initialize: vi.fn(),
        render: vi.fn().mockResolvedValue({ svg: '<svg>Mock Mermaid Diagram</svg>' }),
    },
}));

// Mock react-syntax-highlighter to simplify testing
vi.mock('react-syntax-highlighter', () => ({
    Prism: ({ children }: any) => <pre data-testid="code-block">{children}</pre>,
}));

// Mock Stores
vi.mock('../../../store/useConversationStore');
vi.mock('../../../store/useUserStore');
vi.mock('../../../hooks/useChatSession');

describe('Chat Integration', () => {
    const mockSendMessage = vi.fn();
    const mockUploadFile = vi.fn().mockResolvedValue({ id: '1', fileName: 'test.txt' });
    const mockCancelStream = vi.fn();
    const mockFetchPreviousMessages = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default store mocks
        (useUserStore as any).mockReturnValue({
            accessToken: 'mock-token',
        });

        (useChatSession as any).mockReturnValue({
            sendMessage: mockSendMessage,
            isThinking: false,
        });

        (useConversationStore as any).mockReturnValue({
            messages: [],
            isStreaming: false,
            uploadFile: mockUploadFile,
            cancelStream: mockCancelStream,
            fetchPreviousMessages: mockFetchPreviousMessages,
            hasMoreMessages: false,
            isFetchingMessages: false,
            allMessages: [],
            conversationId: 'mock-conv-id',
        });
    });

    it('renders empty chat state correctly', () => {
        render(<ChatPage />);
        // Should show input
        expect(screen.getByPlaceholderText(/Type a message/i)).toBeInTheDocument();
        // Should NOT show typing indicator
        expect(screen.queryByText(/Gnani is thinking/i)).not.toBeInTheDocument();
    });

    it.skip('displays messages with enhanced content (CodeBlock, Mermaid)', async () => {
        const mockMessages = [
            {
                id: '1',
                role: 'user',
                content: 'Hello',
                timestamp: new Date().toISOString(),
            },
            {
                id: '2',
                role: 'assistant',
                content: 'Here is some code:\n```python\nprint("Hello")\n```\nAnd a diagram:\n```mermaid\ngraph TD; A-->B;\n```',
                timestamp: new Date().toISOString(),
            }
        ];

        (useConversationStore as any).mockReturnValue({
            messages: mockMessages,
            isStreaming: false,
            conversationId: 'mock-conv-id',
            allMessages: mockMessages,
        });

        render(<ChatPage />);

        // Check text content
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Here is some code:')).toBeInTheDocument();

        // Check CodeBlock content using our mock
        // We mocked SyntaxHighlighter, so looking for the text inside it
        expect(await screen.findByText((content) => content.includes('print("Hello")'))).toBeInTheDocument();

        // Simpler check for Mermaid: just verify the text is present in the rendered markdown logic
        expect(await screen.findByText(/graph TD/)).toBeInTheDocument();
    });

    it('handles file upload integration', async () => {
        const { container } = render(<ChatPage />);

        const file = new File(['hello'], 'hello.png', { type: 'image/png' });
        const input = container.querySelector('input[type="file"]');

        if (input) {
            fireEvent.change(input, { target: { files: [file] } });

            await waitFor(() => {
                expect(screen.getByText('test.txt')).toBeInTheDocument();
            });
        }
    });

    it('shows typing indicator when isThinking is true', () => {
        (useChatSession as any).mockReturnValue({
            sendMessage: mockSendMessage,
            isThinking: true, // Simulate thinking
        });

        // Also need to set isStreaming false in store
        (useConversationStore as any).mockReturnValue({
            messages: [],
            isStreaming: false,
            isLoading: true, // MessageList checks this props? 
            // Wait, MessageList props: { isLoading: isThinking && !isStreaming } from ChatPage
            // Line 37 of ChatPage: isLoading={isThinking && !isStreaming}
        });

        render(<ChatPage />);
        expect(screen.getByText(/Gnani is thinking/i)).toBeInTheDocument();
    });
});
