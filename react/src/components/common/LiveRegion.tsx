import React, { useState, useEffect } from 'react';

export const LiveRegion: React.FC = () => {
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        const handleAnnouncement = (e: CustomEvent) => {
            setAnnouncement(e.detail.message);
            // Clear after announcement is read
            setTimeout(() => setAnnouncement(''), 1000);
        };

        window.addEventListener('announce', handleAnnouncement as EventListener);
        return () => window.removeEventListener('announce', handleAnnouncement as EventListener);
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
