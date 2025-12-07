interface Window {
    // Electron IPC Renderer API
    electron?: {
        ipcRenderer: {
            send: (channel: string, ...args: any[]) => void;
            on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
            once: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
            removeListener: (channel: string, listener: (...args: any[]) => void) => void;
            removeAllListeners: (channel: string) => void;
            invoke: (channel: string, ...args: any[]) => Promise<any>;
        };
        grpc?: {
            reconnect: () => void;
        };
        audio?: {
            reset: () => void;
        };
    };

    gnani?: {
        // Methods for handling the gRPC audio stream
        stream?: {
            on: (event: string, callback: (...args: any[]) => void) => () => void;
            sendAudioFrame: (pcmData: ArrayBuffer) => void;
            startStream: (options?: any) => void;
            stopStream: () => void;
            startFileStream: () => void;
            sendText: (text: string) => void;
            setSessionId: (sessionId: string | null) => void;
            setConversationId: (conversationId: string | null) => void;
        };

        // Methods for general IPC communication
        send: (channel: string, data?: any) => void;
        on: (channel: string, callback: (...args: any[]) => void) => () => void;

        // Authentication-related methods
        auth?: {
            storeTokens: (accessToken: string, refreshToken: string, userId?: string) => Promise<boolean>;
            getTokens: () => Promise<{ accessToken: string | null; refreshToken: string | null }>;
            clearTokens: () => Promise<boolean>;
            onForceLogout?: (callback: () => void) => () => void;
            startOAuth: (provider: string) => Promise<any>;
        };

        // Wake word methods
        wake?: {
            startWakeWord: () => void;
            stopWakeWord: () => void;
            getWakeStatus: () => Promise<any>;
            onWakeTriggered: (callback: () => void) => () => void;
            getBatteryStatus(): Promise<import('./shared').BatteryStatus>;
            getConnectivityStatus(): Promise<import('./shared').ConnectivityStatus>;
            getAudioDevices(): Promise<import('./shared').AudioDevices>;
            on(event: string, callback: (...args: any[]) => void): () => void;
        };

        // Device Awareness API
        device?: {
            getActiveWindow(): Promise<import('./shared').ActiveWindowInfo>;
            getSystemStatus(): Promise<import('./shared').SystemStatus>;
            getBatteryStatus(): Promise<import('./shared').BatteryStatus>;
            getConnectivityStatus(): Promise<import('./shared').ConnectivityStatus>;
            getAudioDevices(): Promise<import('./shared').AudioDevices>;
            on(event: string, callback: (...args: any[]) => void): () => void;
        };

        // System settings
        system?: {
            getHotkey: () => Promise<string>;
            updateHotkey: (hotkey: string) => Promise<boolean>;
        };

        // Notifications
        notifications?: {
            show: (title: string, body: string, options?: any) => void;
        };

        // Voice Activity Detection
        vad?: {
            startVAD: () => void;
            stopVAD: () => void;
            getVADStatus: () => Promise<any>;
            setAggressiveness: (level: number) => void;
            setSpeaking: (isSpeaking: boolean) => void;
        };
    };
}
