import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CodeBlock from '../CodeBlock';
import '@testing-library/jest-dom';

// Mock clipboard
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn(),
    },
});

// Mock syntax highlighter since it's lazy loaded and external
vi.mock('react-syntax-highlighter', () => ({
    Prism: ({ children }: any) => <pre>{children}</pre>,
}));

describe('CodeBlock', () => {
    const defaultProps = {
        language: 'python',
        code: 'print("hello world")',
        showLineNumbers: false,
    };

    it('renders code content and language label', async () => {
        render(<CodeBlock {...defaultProps} />);

        // Check language label
        expect(screen.getByText(/python/i)).toBeInTheDocument();

        // Check code content (wrapped in suspense/mock)
        const codeElement = await screen.findByText(/print\("hello world"\)/);
        expect(codeElement).toBeInTheDocument();
    });

    it('copies code to clipboard when button clicked', async () => {
        render(<CodeBlock {...defaultProps} />);

        const copyBtn = screen.getByTitle('Copy code');
        fireEvent.click(copyBtn);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('print("hello world")');

        // Should show "Copied!" text
        expect(await screen.findByText(/copied!/i)).toBeInTheDocument();
    });

    it('defaults language to "text" if missing', () => {
        render(<CodeBlock code="some text" language="" />);
        const label = screen.getByTestId('language-label');
        expect(label).toHaveTextContent(/text/i);
    });
});
