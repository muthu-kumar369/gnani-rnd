import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AttachedFilesList from '../AttachedFilesList';
import '@testing-library/jest-dom';

describe('AttachedFilesList', () => {
    const mockFiles = [
        { id: '1', fileName: 'test.txt', fileSize: 1024, mimeType: 'text/plain' },
        { id: '2', fileName: 'image.png', fileSize: 2048 * 1024, mimeType: 'image/png' }
    ];

    it('renders nothing when empty', () => {
        const { container } = render(
            <AttachedFilesList
                files={[]}
                onRemove={vi.fn()}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders files with correct details', () => {
        render(
            <AttachedFilesList
                files={mockFiles}
                onRemove={vi.fn()}
            />
        );
        expect(screen.getByText('test.txt')).toBeInTheDocument();
        expect(screen.getByText('1.0 KB')).toBeInTheDocument();
        expect(screen.getByText('image.png')).toBeInTheDocument();
        expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    });

    it('calls onRemove when clicking remove button', () => {
        const handleRemove = vi.fn();
        render(
            <AttachedFilesList
                files={mockFiles}
                onRemove={handleRemove}
            />
        );

        const removeButtons = screen.getAllByTitle('Remove file');
        fireEvent.click(removeButtons[0]);
        expect(handleRemove).toHaveBeenCalledWith(0);
    });

    it('shows upload progress if uploading', () => {
        const uploadingFiles = [
            { id: '3', fileName: 'uploading.pdf', uploadProgress: 50, mimeType: 'application/pdf' }
        ];
        render(
            <AttachedFilesList
                files={uploadingFiles}
                onRemove={vi.fn()}
            />
        );
        expect(screen.getByText('50%')).toBeInTheDocument();
        expect(screen.queryByTitle('Remove file')).not.toBeInTheDocument();
    });
});
