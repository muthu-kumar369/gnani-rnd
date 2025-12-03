// react/src/types/window.d.ts

// This file contains the type definition for the `window.gnani` object,
// which is used for communication between the React frontend and the Electron main process.

// Device Awareness types
export interface ActiveWindowInfo {
  title: string | null;
  owner: {
    name: string | null;
    processId: number | null;
    path: string | null;
  };
  timestamp: number;
}

export interface SystemStatus {
  cpu: {
    usage: number;
    cores: number;
    speed: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: Array<{
    fs: string;
    type: string;
    size: number;
    used: number;
    available: number;
    usagePercent: number;
    mount: string;
  }>;
  uptime: number;
  timestamp: number;
}

export interface BatteryStatus {
  hasBattery: boolean;
  isCharging: boolean;
  level: number;
  timeRemaining: number | null;
  onAC: boolean;
  onBattery: boolean;
  timestamp: number;
}

export interface ConnectivityStatus {
  online: boolean;
  latency: number | null;
  timestamp: number;
}

export interface AudioDevices {
  input: Array<{
    id: string;
    label: string;
    kind: string;
  }>;
  output: Array<{
    id: string;
    label: string;
    kind: string;
  }>;
  timestamp: number;
}

declare global {
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
      };

      // Methods for handling the gRPC audio stream
      stream?: {
        on: (event: string, callback: (...args: any[]) => void) => () => void;
        sendAudioFrame: (pcmData: ArrayBuffer) => void;
        startStream: () => void;
        stopStream: () => void;
        startFileStream: () => void;
        sendText: (text: string) => void;
        setSessionId: (sessionId: string) => void;
      };

      // Device Awareness API
      device?: {
        getActiveWindow(): Promise<ActiveWindowInfo>;
        getSystemStatus(): Promise<SystemStatus>;
        getBatteryStatus(): Promise<BatteryStatus>;
        getConnectivityStatus(): Promise<ConnectivityStatus>;
        getAudioDevices(): Promise<AudioDevices>;
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
    };
  }
}

// This empty export is necessary to make this file a module.
export { };