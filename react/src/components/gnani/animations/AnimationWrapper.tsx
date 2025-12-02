import React from 'react';

import CoreOrb from './CoreOrb';
import type { GnaniAppStatus } from '../../../hooks/useGnaniUIState';

interface AnimationWrapperProps {
    state: GnaniAppStatus;
    audioLevel: number;
}

const AnimationWrapper: React.FC<AnimationWrapperProps> = ({ state, audioLevel }) => {
    return (
        <div className="relative w-80 h-80 flex items-center justify-center">
            <CoreOrb status={state} audioLevel={audioLevel} />
        </div>
    );
};

export default AnimationWrapper;
