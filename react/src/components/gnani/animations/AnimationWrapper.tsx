import React from 'react';


import ListeningAnimation from './ListeningAnimation';
import SpeakingAnimation from './SpeakingAnimation';
import ThinkingAnimation from './ThinkingAnimation';
import IdleAnimation from './IdleAnimation';
import type { GnaniAppStatus } from '../../../hooks/useGnaniUIState';

interface AnimationWrapperProps {
    state: GnaniAppStatus;
    audioLevel: number;
}

const AnimationWrapper: React.FC<AnimationWrapperProps> = ({ state, audioLevel }) => {
    // Determine which animation to show based on state
    const renderAnimation = () => {
        switch (state) {
            case 'streaming':
            case 'receiving-stt':
            case 'mic-recording':
            case 'wake-word-listening':
                return <ListeningAnimation audioLevel={audioLevel} />;

            case 'responding':
                return <SpeakingAnimation />;

            case 'thinking':
                return <ThinkingAnimation />;

            case 'idle':
            case 'initializing':
            case 'error':
            default:
                return <IdleAnimation />;
        }
    };

    return (
        <div className="relative w-80 h-80 flex items-center justify-center">
            {renderAnimation()}
        </div>
    );
};

export default AnimationWrapper;
