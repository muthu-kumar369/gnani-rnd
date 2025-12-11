import React, { useState, useEffect } from 'react';
import { eventManager } from '../../utils/eventManager';

export const LiveRegion: React.FC = () => {
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        const handleAnnouncement = (e: CustomEvent) => {
            setAnnouncement(e.detail.message);
            // Clear after announcement is read
            setTimeout(() => setAnnouncement(''), 1000);
        };

        const cleanup = eventManager.addEventListener('announce', handleAnnouncement as EventListener, undefined, 'LiveRegion');
        return cleanup;
    }, []);

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
        >
            {announcement}
        </div>
    );
};

// Utility function to announce messages
export const announce = (message: string) => {
    window.dispatchEvent(new CustomEvent('announce', {
        detail: { message }
    }));
};
