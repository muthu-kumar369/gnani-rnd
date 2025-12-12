import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageGallery from '../ImageGallery';
import type { ImageAttachment } from '../../../types/vision.types';
import '@testing-library/jest-dom';

// Mock framer-motion to avoid animation issues in tests
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

// Mock ImagePreview to avoid portal/animation issues
vi.mock('../ImagePreview', () => ({
    default: ({ image, onClose }: any) => (
        <div data-testid="mock-image-preview">
            Mock Preview: {image.fileName}
            <button onClick={onClose} title="Close Mock">Close</button>
        </div>
    ),
}));

// Mock react-dom createPortal to render in-place (since we want to see the mock preview)
vi.mock('react-dom', async () => {
    const actual = await vi.importActual<any>('react-dom');
    return {
        ...actual,
        createPortal: (node: any) => node,
    };
});

describe('ImageGallery', () => {
    const mockImages: ImageAttachment[] = [
        {
            id: '1',
            fileName: 'test1.jpg',
            fileSize: 1024,
            mimeType: 'image/jpeg',
            url: 'http://example.com/test1.jpg',
            uploadedAt: new Date(),
        },
        {
            id: '2',
            fileName: 'test2.png',
            fileSize: 2048,
            mimeType: 'image/png',
            url: 'http://example.com/test2.png',
            uploadedAt: new Date(),
        },
    ];

    it('renders nothing if no images provided', () => {
        const { container } = render(<ImageGallery images={[]} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders grid of images', () => {
        render(<ImageGallery images={mockImages} />);

        const images = screen.getAllByRole('img');
        expect(images).toHaveLength(2);
        expect(images[0]).toHaveAttribute('src', 'http://example.com/test1.jpg');
    });

    it('opens modal on click', async () => {
        render(<ImageGallery images={mockImages} />);

        // Modal should not be present initially
        expect(screen.queryByTestId('mock-image-preview')).not.toBeInTheDocument();

        // Click first image
        const images = screen.getAllByRole('img');
        fireEvent.click(images[0]);

        // Mock Preview should appear
        const preview = await screen.findByTestId('mock-image-preview');
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveTextContent('Mock Preview: test1.jpg');
    });
});
