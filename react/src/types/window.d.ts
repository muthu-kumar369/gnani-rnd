// react/src/types/window.d.ts

// This file contains the type definition for the `window.gnani` object,
// which is used for communication between the React frontend and the Electron main process.

declare global {
  interface Window {
    gnani?: {
      // Methods for general IPC communication
      send: (channel: string, data?: any) => void;
      on: (channel: string, callback: (...args: any[]) => void) => () => void;

      // Authentication-related methods
      auth?: {
        storeTokens: (accessToken: string, refreshToken: string) => Promise<boolean>;
        getTokens: () => Promise<{ accessToken: string | null; refreshToken: string | null }>;
        clearTokens: () => Promise<boolean>;
        onForceLogout?: (callback: () => void) => () => void;
      };

      // Methods for handling the gRPC audio stream
      stream?: {
        on: (event: string, callback: (...args: any[]) => void) => () => void;
        sendAudioFrame: (pcmData: ArrayBuffer) => void;
        startStream: () => void;
        stopStream: () => void;
        startFileStream: () => void;
      };
    };
  }
}

// This empty export is necessary to make this file a module.
export {};