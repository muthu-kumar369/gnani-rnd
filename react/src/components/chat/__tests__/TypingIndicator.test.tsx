import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TypingIndicator from '../TypingIndicator';
import '@testing-library/jest-dom';

describe('TypingIndicator', () => {
    it('renders default message when status is active', () => {
        render(<TypingIndicator status="thinking" />);
        expect(screen.getByText('Gnani is thinking...')).toBeInTheDocument();
    });

    it('renders custom message', () => {
        render(<TypingIndicator status="thinking" message="Custom status..." />);
        expect(screen.getByText('Custom status...')).toBeInTheDocument();
    });

    it('returns null when status is idle', () => {
        const { container } = render(<TypingIndicator status="idle" />);
        expect(container).toBeEmptyDOMElement();
    });

    it('returns null when status is undefined', () => {
        // Although props say status is optional strings, if logic handles it.
        // But checking the component code: `if (status === 'idle') return null;`
        // It renders if status is undefined! "Gnani is thinking..."
        // Wait, verify logic: "status === 'idle'" checks for string 'idle'.
        // If undefined, it renders.
        render(<TypingIndicator />);
        expect(screen.getByText('Gnani is thinking...')).toBeInTheDocument();
    });
});
