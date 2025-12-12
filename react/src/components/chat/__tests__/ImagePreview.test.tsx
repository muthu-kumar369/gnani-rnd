import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImagePreview from '../ImagePreview';
import '@testing-library/jest-dom';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, onClick, ...props }: any) => (
            <div className={className} onClick={onClick} {...props}>
                {children}
            </div>
        ),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ImagePreview', () => {
    const mockImage = {
        id: '1',
        fileName: 'test.jpg',
        fileSize: 1000,
        mimeType: 'image/jpeg',
        url: 'http://example.com/test.jpg',
        uploadedAt: new Date(),
    };
    const mockOnClose = vi.fn();

    it('renders nothing if image has no url', () => {
        const { container } = render(<ImagePreview image={{ ...mockImage, url: '' }} onClose={mockOnClose} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders image and title', () => {
        render(<ImagePreview image={mockImage} onClose={mockOnClose} />);
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'http://example.com/test.jpg');
    });

    it('calls onClose when clicking close button', () => {
        render(<ImagePreview image={mockImage} onClose={mockOnClose} />);
        const closeBtn = screen.getAllByRole('button')[0]; // Assuming first is close or inspect icons
        // Just find by icon or easier: find parent div logic?
        // Toolbar code: <button onClick={onClose} ...><X size={20} /></button>
        // It's the button in toolbar.
        // Let's rely on finding a button. There are 2 interactive elements: link(download) and button(close).
        const buttons = screen.getAllByRole('button');
        // Actually one is <a> (download), one is <button> (close).
        fireEvent.click(buttons[0]);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose on Escape key', () => {
        render(<ImagePreview image={mockImage} onClose={mockOnClose} />);
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(mockOnClose).toHaveBeenCalled();
    });
});
