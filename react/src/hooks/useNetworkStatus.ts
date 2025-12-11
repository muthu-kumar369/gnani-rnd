import { useState, useEffect } from 'react';

interface NetworkStatus {
    isOnline: boolean;
    wasOffline: boolean;
    downlink?: number;
    effectiveType?: string;
}

export const useNetworkStatus = (): NetworkStatus => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setWasOffline(true);

            // Reset wasOffline after 3 seconds
            setTimeout(() => setWasOffline(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        import('../utils/eventManager').then(({ eventManager }) => {
            const cleanup1 = eventManager.addEventListener('online', handleOnline as EventListener, undefined, 'useNetworkStatus');
            const cleanup2 = eventManager.addEventListener('offline', handleOffline as EventListener, undefined, 'useNetworkStatus');

            // Store cleanup functions
            return () => {
                cleanup1();
                cleanup2();
            };
        });

        // Fallback cleanup
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Get network information if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    return {
        isOnline,
        wasOffline,
        downlink: connection?.downlink,
        effectiveType: connection?.effectiveType,
    };
};
