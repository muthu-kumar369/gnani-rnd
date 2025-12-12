import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VoiceModeOverlay from '../VoiceModeOverlay';
import '@testing-library/jest-dom';

// Mock GnaniCore since it's heavy and we just want to test the overlay wrapper
vi.mock('../../gnani/GnaniCore', () => ({
    default: ({ isOverlayMode, onOverlayClose }: any) => (
        <div data-testid="gnani-core-mock">
            Mock GnaniCore Overlay: {isOverlayMode ? 'On' : 'Off'}
            <button onClick={onOverlayClose} data-testid="close-btn">Close</button>
        </div>
    )
}));

describe('VoiceModeOverlay', () => {
    it('does not render when isVisible is false', () => {
        render(
            <VoiceModeOverlay
                isVisible={false}
                onClose={vi.fn()}
            />
        );
        expect(screen.queryByTestId('gnani-core-mock')).not.toBeInTheDocument();
    });

    it('renders when isVisible is true', () => {
        render(
            <VoiceModeOverlay
                isVisible={true}
                onClose={vi.fn()}
            />
        );
        expect(screen.getByTestId('gnani-core-mock')).toBeInTheDocument();
    });

    it('passes isOverlayMode prop correctly', () => {
        render(
            <VoiceModeOverlay
                isVisible={true}
                onClose={vi.fn()}
            />
        );
        expect(screen.getByText('Mock GnaniCore Overlay: On')).toBeInTheDocument();
    });

    it('passed onClose handler to GnaniCore', () => {
        const handleClose = vi.fn();
        render(
            <VoiceModeOverlay
                isVisible={true}
                onClose={handleClose}
            />
        );

        fireEvent.click(screen.getByTestId('close-btn'));
        expect(handleClose).toHaveBeenCalled();
    });
});
