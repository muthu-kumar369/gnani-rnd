import { useEffect } from 'react';
import useMicrophone from './useMicrophone';

export const useGlobalHotkey = () => {
    const { isMicActive, startMic } = useMicrophone();

    useEffect(() => {
        const handleHotkeyActivate = () => {
            console.log('[useGlobalHotkey] Hotkey activated mic');
            // Activate mic if not already active
            if (!isMicActive) {
                startMic();
            }
        };

        let cleanup: (() => void) | undefined;

        if (window.gnani) {
            cleanup = window.gnani.on('hotkey:activate-mic', handleHotkeyActivate);
        }

        return () => {
            if (cleanup) {
                cleanup();
            }
        };
    }, [isMicActive, startMic]);
};
