import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InlineMessageEditor from '../InlineMessageEditor';
import '@testing-library/jest-dom';

describe('InlineMessageEditor', () => {
    it('renders with initial content', () => {
        const initialContent = 'Hello world';
        render(
            <InlineMessageEditor
                initialContent={initialContent}
                onSave={vi.fn()}
                onCancel={vi.fn()}
            />
        );
        expect(screen.getByRole('textbox')).toHaveValue(initialContent);
    });

    it('updates content when typing', () => {
        render(
            <InlineMessageEditor
                initialContent=""
                onSave={vi.fn()}
                onCancel={vi.fn()}
            />
        );
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'New content' } });
        expect(textarea).toHaveValue('New content');
    });

    it('calls onSave when save button is clicked', async () => {
        const handleSave = vi.fn().mockResolvedValue(undefined);
        render(
            <InlineMessageEditor
                initialContent="Original"
                onSave={handleSave}
                onCancel={vi.fn()}
            />
        );

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'Modified content' } });

        fireEvent.click(screen.getByText('Save & Submit'));

        await waitFor(() => {
            expect(handleSave).toHaveBeenCalledWith('Modified content');
        });
    });

    it('calls onCancel when content is unchanged on save', async () => {
        const handleSave = vi.fn();
        const handleCancel = vi.fn();
        render(
            <InlineMessageEditor
                initialContent="Original"
                onSave={handleSave}
                onCancel={handleCancel}
            />
        );

        fireEvent.click(screen.getByText('Save & Submit'));
        expect(handleSave).not.toHaveBeenCalled();
        expect(handleCancel).toHaveBeenCalled();
    });

    it('calls onCancel when cancel button is clicked', () => {
        const handleCancel = vi.fn();
        render(
            <InlineMessageEditor
                initialContent="Original"
                onSave={vi.fn()}
                onCancel={handleCancel}
            />
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(handleCancel).toHaveBeenCalled();
    });
});
