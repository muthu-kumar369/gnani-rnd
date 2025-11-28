import { useEffect, useState, useCallback } from 'react';
import type { ActiveWindowInfo, SystemStatus, BatteryStatus, ConnectivityStatus, AudioDevices } from '../types/window';
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
        const deviceApi = window.gnani?.device;
        if (!deviceApi) {
            errorLogger.warn('Device API not available', { context: 'useDeviceAwareness' });
            setState(prev => ({ ...prev, isLoading: false }));
            return;
        }

        const fetchInitialData = async () => {
            try {
                const [activeWindow, systemStatus, batteryStatus, connectivityStatus, audioDevices] =
                    await Promise.all([
                        deviceApi.getActiveWindow(),
                        deviceApi.getSystemStatus(),
                        deviceApi.getBatteryStatus(),
                        deviceApi.getConnectivityStatus(),
                        deviceApi.getAudioDevices(),
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
        const deviceApi = window.gnani?.device;
        if (!deviceApi) return;

        const unsubs = [
            deviceApi.on('device:active-window-changed', (data) => {
                setState(prev => ({ ...prev, activeWindow: data }));
            }),
            deviceApi.on('device:system-status-update', (data) => {
                setState(prev => ({ ...prev, systemStatus: data }));
            }),
            deviceApi.on('device:battery-changed', (data) => {
                setState(prev => ({ ...prev, batteryStatus: data }));
            }),
            deviceApi.on('device:connectivity-changed', (data) => {
                setState(prev => ({ ...prev, connectivityStatus: data }));
            }),
            deviceApi.on('device:audio-devices-changed', (data) => {
                setState(prev => ({ ...prev, audioDevices: data }));
            }),
        ];

        return () => {
            unsubs.forEach(unsub => unsub());
        };
    }, []);

    const refresh = useCallback(async () => {
        const deviceApi = window.gnani?.device;
        if (!deviceApi) return;

        try {
            const [activeWindow, systemStatus, batteryStatus, connectivityStatus, audioDevices] =
                await Promise.all([
                    deviceApi.getActiveWindow(),
                    deviceApi.getSystemStatus(),
                    deviceApi.getBatteryStatus(),
                    deviceApi.getConnectivityStatus(),
                    deviceApi.getAudioDevices(),
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
