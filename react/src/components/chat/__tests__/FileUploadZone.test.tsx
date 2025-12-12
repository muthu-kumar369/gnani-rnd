import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import FileUploadZone from '../FileUploadZone';
import '@testing-library/jest-dom';

describe('FileUploadZone', () => {
    it('renders children correctly', () => {
        render(
            <FileUploadZone onFileSelect={vi.fn()}>
                <div data-testid="child">Child Content</div>
            </FileUploadZone>
        );
        expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('shows overlay when dragging file over', () => {
        render(
            <FileUploadZone onFileSelect={vi.fn()}>
                <div data-testid="child">Child Content</div>
            </FileUploadZone>
        );

        const child = screen.getByTestId('child');

        // Simulate drag enter
        const dragEnterEvent = createEvent.dragEnter(child, {
            dataTransfer: { items: [{ kind: 'file' }] }
        });
        fireEvent(child, dragEnterEvent);

        expect(screen.getByText('Drop file to upload')).toBeInTheDocument();
    });

    it('hides overlay on drop and calls handler', () => {
        const handleFileSelect = vi.fn();
        render(
            <FileUploadZone onFileSelect={handleFileSelect}>
                <div data-testid="child">Child Content</div>
            </FileUploadZone>
        );

        const child = screen.getByTestId('child');

        // Enter
        fireEvent.dragEnter(child, {
            dataTransfer: { items: [{ kind: 'file' }] }
        });

        // Drop
        const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
        const dropEvent = createEvent.drop(child, {
            dataTransfer: { files: [file] }
        });
        fireEvent(child, dropEvent);

        expect(screen.queryByText('Drop file to upload')).not.toBeInTheDocument();
        expect(handleFileSelect).toHaveBeenCalledWith(file);
    });

    it('does not trigger if disabled', () => {
        const handleFileSelect = vi.fn();
        render(
            <FileUploadZone onFileSelect={handleFileSelect} disabled>
                <div data-testid="child">Child Content</div>
            </FileUploadZone>
        );

        const child = screen.getByTestId('child');

        fireEvent.dragEnter(child, {
            dataTransfer: { items: [{ kind: 'file' }] }
        });

        expect(screen.queryByText('Drop file to upload')).not.toBeInTheDocument();
    });
});
