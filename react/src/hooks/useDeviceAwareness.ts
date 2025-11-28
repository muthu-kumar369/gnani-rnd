import { useEffect, useState, useCallback } from 'react';
import type { ActiveWindowInfo, SystemStatus, BatteryStatus, ConnectivityStatus, AudioDevices } from '../types/window.d';
import errorLogger from '../utils/errorLogger';

export interface DeviceAwarenessState {
    activeWindow: ActiveWindowInfo | null;
    systemStatus: SystemStatus | null;
    batteryStatus: BatteryStatus | null;
    connectivityStatus: ConnectivityStatus | null;
    audioDevices: AudioDevices | null;
    isLoading: boolean;
}

export function useDeviceAwareness() {
    const [state, setState] = useState<DeviceAwarenessState>({
        activeWindow: null,
        systemStatus: null,
        batteryStatus: null,
        connectivityStatus: null,
        audioDevices: null,
        isLoading: true,
    });

    // Fetch initial data
    useEffect(() => {
        if (!window.gnani?.device) {
            errorLogger.warn('Device API not available', { context: 'useDeviceAwareness' });
            setState(prev => ({ ...prev, isLoading: false }));
            return;
        }

        const fetchInitialData = async () => {
            try {
                const [activeWindow, systemStatus, batteryStatus, connectivityStatus, audioDevices] =
                    await Promise.all([
                        window.gnani.device.getActiveWindow(),
                        window.gnani.device.getSystemStatus(),
                        window.gnani.device.getBatteryStatus(),
                        window.gnani.device.getConnectivityStatus(),
                        window.gnani.device.getAudioDevices(),
                    ]);

                setState({
                    activeWindow,
                    systemStatus,
                    batteryStatus,
                    connectivityStatus,
                    audioDevices,
                    isLoading: false,
                });
            } catch (error) {
                errorLogger.error('Failed to fetch device data', error as Error, { context: 'useDeviceAwareness' });
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };

        fetchInitialData();
    }, []);

    // Subscribe to updates
    useEffect(() => {
        if (!window.gnani?.device) return;

        const unsubs = [
            window.gnani.device.on('device:active-window-changed', (data) => {
                setState(prev => ({ ...prev, activeWindow: data }));
            }),
            window.gnani.device.on('device:system-status-update', (data) => {
                setState(prev => ({ ...prev, systemStatus: data }));
            }),
            window.gnani.device.on('device:battery-changed', (data) => {
                setState(prev => ({ ...prev, batteryStatus: data }));
            }),
            window.gnani.device.on('device:connectivity-changed', (data) => {
                setState(prev => ({ ...prev, connectivityStatus: data }));
            }),
            window.gnani.device.on('device:audio-devices-changed', (data) => {
                setState(prev => ({ ...prev, audioDevices: data }));
            }),
        ];

        return () => {
            unsubs.forEach(unsub => unsub());
        };
    }, []);

    const refresh = useCallback(async () => {
        if (!window.gnani?.device) return;

        try {
            const [activeWindow, systemStatus, batteryStatus, connectivityStatus, audioDevices] =
                await Promise.all([
                    window.gnani.device.getActiveWindow(),
                    window.gnani.device.getSystemStatus(),
                    window.gnani.device.getBatteryStatus(),
                    window.gnani.device.getConnectivityStatus(),
                    window.gnani.device.getAudioDevices(),
                ]);

            setState({
                activeWindow,
                systemStatus,
                batteryStatus,
                connectivityStatus,
                audioDevices,
                isLoading: false,
            });
        } catch (error) {
            errorLogger.error('Failed to refresh device data', error as Error, { context: 'useDeviceAwareness' });
        }
    }, []);

    return {
        ...state,
        refresh,
    };
}
