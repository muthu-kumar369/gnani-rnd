import React from 'react';
import GnaniCore from '../gnani/GnaniCore';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceModeOverlayProps {
    isVisible: boolean;
    onClose: () => void;
}

const VoiceModeOverlay: React.FC<VoiceModeOverlayProps> = ({ isVisible, onClose }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
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
