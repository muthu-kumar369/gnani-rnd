import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const OfflineIndicator: React.FC = () => {
    const { isOnline, wasOffline } = useNetworkStatus();

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 backdrop-blur-sm border-b border-yellow-600 shadow-lg"
                >
                    <div className="flex items-center justify-center gap-2 py-2 px-4">
                        <WifiOff size={18} className="text-yellow-900" />
                        <span className="text-sm font-medium text-yellow-900">
                            You're offline. Some features may be unavailable.
                        </span>
                    </div>
                </motion.div>
            )}

            {wasOffline && isOnline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-50 bg-green-500/90 backdrop-blur-sm border-b border-green-600 shadow-lg"
                >
                    <div className="flex items-center justify-center gap-2 py-2 px-4">
                        <Wifi size={18} className="text-green-900" />
                        <span className="text-sm font-medium text-green-900">
                            You're back online!
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OfflineIndicator;
