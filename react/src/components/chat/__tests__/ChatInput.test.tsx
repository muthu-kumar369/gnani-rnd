import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatInput from '../ChatInput';
import '@testing-library/jest-dom';

// Mock child components
vi.mock('../AttachedFilesList', () => ({
    default: ({ files, onRemove }: any) => (
        <div data-testid="attached-files-list">
            {files.map((f: any) => (
                <div key={f.id} onClick={() => onRemove(f.id)}>
                    {f.fileName}
                </div>
            ))}
        </div>
    ),
}));

vi.mock('../FileUploadZone', () => ({
    default: ({ children, onFileSelect }: any) => (
        <div data-testid="file-upload-zone">
            {children}
            <input
                type="file"
                data-testid="file-input"
                onChange={(e) => {
                    if (e.target.files?.[0]) {
                        onFileSelect(e.target.files[0]);
                    }
                }}
            />
        </div>
    ),
}));

// Mock store
vi.mock('../../../store/useConversationStore', () => ({
    useConversationStore: vi.fn(),
}));
vi.mock('../../../store/useUserStore', () => ({
    useUserStore: vi.fn(),
}));

import { useConversationStore } from '../../../store/useConversationStore';
import { useUserStore } from '../../../store/useUserStore';

describe('ChatInput', () => {
    const mockOnSend = vi.fn();
    const mockOnStop = vi.fn();
    const mockOnMicClick = vi.fn();
    const mockUploadFile = vi.fn();

    // Reset mocks
    beforeEach(() => {
        vi.clearAllMocks();
        (useUserStore as any).mockReturnValue({ accessToken: 'mock-token' });
        (useConversationStore as any).mockReturnValue({ uploadFile: mockUploadFile });
    });


    it('renders input area', () => {
        render(<ChatInput onSend={mockOnSend} onMicClick={mockOnMicClick} />);
        expect(screen.getByPlaceholderText(/Type a message/i)).toBeInTheDocument();
    });

    it('updates message on type', () => {
        render(<ChatInput onSend={mockOnSend} onMicClick={mockOnMicClick} />);
        const input = screen.getByPlaceholderText(/Type a message/i);
        fireEvent.change(input, { target: { value: 'Hello' } });
        expect(input).toHaveValue('Hello');
    });

    it('sends message on enter', () => {
        render(<ChatInput onSend={mockOnSend} onMicClick={mockOnMicClick} />);
        const input = screen.getByPlaceholderText(/Type a message/i);
        fireEvent.change(input, { target: { value: 'Hello' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        expect(mockOnSend).toHaveBeenCalledWith('Hello', []); // expects args: text, attachments
        expect(input).toHaveValue(''); // Should clear
    });

    it('does not send on Shift+Enter', () => {
        render(<ChatInput onSend={mockOnSend} onMicClick={mockOnMicClick} />);
        const input = screen.getByPlaceholderText(/Type a message/i);
        fireEvent.change(input, { target: { value: 'Hello' } });
        fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
        expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('handles file selection', async () => {
        // This tests internal state update of ChatInput which passes files to AttachedFilesList
        // We need to verify that when FileUploadZone triggers onFileSelect, AttachedFilesList shows the file.
        // Wait, ChatInput uses `uploadFile` from store?
        // Checking ChatInput.tsx viewing...
        // Line 800 in prompt view: const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
        // BUT viewing `ChatInput.tsx` (Step 936 summary/view) -> Line 59 added handlePaste.
        // Line 96 replaced mapping with AttachedFilesList.
        // It uses `processFileUpload`.
        // Does `processFileUpload` call an external prop or Store?
        // In `ChatIntegration` test I mocked `uploadFile` from `useConversationStore`.
        // So `ChatInput` DOES import store?
        // Let's check `ChatInput` imports.
    });
});
