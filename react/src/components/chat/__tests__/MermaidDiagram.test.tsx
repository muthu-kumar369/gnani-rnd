import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MermaidDiagram from '../MermaidDiagram';
import '@testing-library/jest-dom';

// Mock mermaid
vi.mock('mermaid', () => ({
    default: {
        initialize: vi.fn(),
        render: vi.fn(),
    },
}));

import mermaid from 'mermaid';

describe('MermaidDiagram', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders diagram SVG on success', async () => {
        // Mock successful render
        (mermaid.render as any).mockResolvedValue({ svg: '<svg>Mock Diagram</svg>' });

        render(<MermaidDiagram chart="graph TD; A-->B;" />);

        // Should eventually display the SVG content
        await waitFor(() => {
            const container = screen.getByText('Mock Diagram');
            expect(container).toBeInTheDocument();
        });
    });

    it('renders error message on failure', async () => {
        // Mock failure
        (mermaid.render as any).mockRejectedValue(new Error('Syntax Error'));

        render(<MermaidDiagram chart="invalid chart" />);

        // Should display error message
        await waitFor(() => {
            expect(screen.getByText('Diagram Error:')).toBeInTheDocument();
            expect(screen.getByText('Syntax Error')).toBeInTheDocument();
        });
    });
});
