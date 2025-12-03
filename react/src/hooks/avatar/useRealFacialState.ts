import { useState, useEffect } from 'react';
import { type GnaniAppStatus } from '../useGnaniUIState';

export interface FacialState {
    blink: boolean;
    headTilt: { x: number; y: number };
    expression: 'neutral' | 'happy' | 'focused' | 'thinking';
}

export const useRealFacialState = (status: GnaniAppStatus) => {
    const [facialState, setFacialState] = useState<FacialState>({
        blink: false,
        headTilt: { x: 0, y: 0 },
        expression: 'neutral'
    });

    // Blinking Logic
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        
        const blinkLoop = () => {
            setFacialState(prev => ({ ...prev, blink: true }));
            
            // Close eyes duration
            setTimeout(() => {
                setFacialState(prev => ({ ...prev, blink: false }));
            }, 150);

            // Next blink interval (random 2-6s)
            const nextBlink = Math.random() * 4000 + 2000;
            timeout = setTimeout(blinkLoop, nextBlink);
        };

        timeout = setTimeout(blinkLoop, 2000);
        return () => clearTimeout(timeout);
    }, []);

    // State-based Expression & Head Movement Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const updateState = () => {
            const time = Date.now() / 1000;
            let targetTilt = { x: 0, y: 0 };
            let targetExpression: FacialState['expression'] = 'neutral';

            switch (status) {
                case 'idle':
                    // Gentle breathing motion
                    targetTilt = { 
                        x: Math.sin(time * 0.5) * 1, 
                        y: Math.cos(time * 0.3) * 1 
                    };
                    targetExpression = 'neutral';
                    break;

                case 'wake-word-listening':
                case 'mic-recording':
                    // Lean forward, attentive
                    targetTilt = { x: 0, y: 5 }; // Look down/forward slightly
                    targetExpression = 'focused';
                    break;

                case 'thinking':
                    // Look up/away
                    targetTilt = { 
                        x: Math.sin(time) * 3, 
                        y: -5 
                    };
                    targetExpression = 'thinking';
                    break;

                case 'responding':
                    // Active engagement
                    targetTilt = { 
                        x: Math.sin(time * 2) * 2, 
                        y: Math.cos(time * 1.5) * 2 
                    };
                    targetExpression = 'happy';
                    break;
            }

            setFacialState(prev => ({
                ...prev,
                headTilt: targetTilt,
                expression: targetExpression
            }));
        };

        interval = setInterval(updateState, 50); // 20fps update for smooth movement targets
        return () => clearInterval(interval);
    }, [status]);

    return facialState;
};
