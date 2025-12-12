import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RealHumanAvatar from './RealHumanAvatar';
import { type AvatarGender } from './AvatarConfig';
import { type GnaniAppStatus } from '../../../hooks/useGnaniUIState';

interface AvatarContainerProps {
    status: GnaniAppStatus;
    audioElementRef?: React.RefObject<HTMLAudioElement>; // For Lip Sync
    isSpeaking: boolean;
    avatarEnabled: boolean;
    avatarGender: 'male' | 'female';
}

const AvatarContainer: React.FC<AvatarContainerProps> = ({ status, isSpeaking, avatarEnabled, avatarGender }) => {
    if (!avatarEnabled) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="absolute z-30 pointer-events-none"
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ duration: 0.5 }}
                style={{
                    top: '40%', // Central position
                    left: '50%',
                    x: '-50%',
                    y: '-50%',
                }}
            >
                <div className="relative flex flex-col items-center">
                    <RealHumanAvatar
                        status={status}
                        isSpeaking={isSpeaking}
                        gender={avatarGender as AvatarGender}
                    />

                    {/* Connection Line to Core (Optional, maybe remove for floating hologram look) */}
                    {/* <motion.div ... /> */}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AvatarContainer;
