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

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

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
