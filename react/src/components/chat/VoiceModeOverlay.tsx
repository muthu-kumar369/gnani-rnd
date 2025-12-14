import React, { useEffect } from 'react';
import GnaniCore from '../gnani/GnaniCore';
import { motion, AnimatePresence } from 'framer-motion';
import { eventManager } from '../../utils/eventManager';

interface VoiceModeOverlayProps {
    isVisible: boolean;
    onClose: () => void;
}

const VoiceModeOverlay: React.FC<VoiceModeOverlayProps> = ({ isVisible, onClose }) => {
    useEffect(() => {
        if (!isVisible) return;
        const cleanup = eventManager.addEventListener('keyboard:escape', onClose, undefined, 'VoiceModeOverlay');
        return cleanup;
    }, [isVisible, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[100]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <GnaniCore isOverlayMode={true} onOverlayClose={onClose} />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VoiceModeOverlay;
