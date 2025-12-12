import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DateSeparator from '../DateSeparator';
import '@testing-library/jest-dom';

// Mock date formatter
vi.mock('../../../utils/date-formatter', () => ({
    formatDateSeparator: (timestamp: number) => {
        if (timestamp === 1) return 'TODAY';
        if (timestamp === 2) return 'YESTERDAY';
        return 'UNKNOWN';
    },
}));

describe('DateSeparator', () => {
    it('renders TODAY label', () => {
        render(<DateSeparator timestamp={1} />);
        expect(screen.getByText('TODAY')).toBeInTheDocument();
    });

    it('renders YESTERDAY label', () => {
        render(<DateSeparator timestamp={2} />);
        expect(screen.getByText('YESTERDAY')).toBeInTheDocument();
    });

    it('renders styles correctly', () => {
        const { container } = render(<DateSeparator timestamp={1} />);
        expect(container.firstChild).toHaveClass('flex', 'items-center', 'gap-3');
    });
});
