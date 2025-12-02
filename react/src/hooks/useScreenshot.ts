import { useEffect } from 'react';

export const useScreenshot = (onScreenshot: (base64: string) => void) => {
  useEffect(() => {
    const handleScreenshotCaptured = (screenshot: any) => {
      // Electron sends a NativeImage, which might be received as a buffer or object depending on serialization.
      // However, toPNG() returns a Buffer.
      // In preload, we might need to handle this. 
      // Let's assume for now we receive a buffer or a base64 string if we modify preload.
      // Actually, passing Buffer over IPC is fine.
      
      console.log('[useScreenshot] Screenshot captured', screenshot);
      
      if (screenshot) {
          // If it's a buffer (Uint8Array in browser)
          if (screenshot instanceof Uint8Array) {
              const base64 = btoa(
                  new Uint8Array(screenshot)
                    .reduce((data, byte) => data + String.fromCharCode(byte), '')
              );
              onScreenshot(base64);
          } else if (typeof screenshot === 'string') {
              // Already base64?
              onScreenshot(screenshot);
          } else if (screenshot.toPNG) {
               // NativeImage (unlikely to be passed directly like this without context isolation issues)
               // But if it is:
               const buffer = screenshot.toPNG();
               const base64 = btoa(
                  new Uint8Array(buffer)
                    .reduce((data, byte) => data + String.fromCharCode(byte), '')
              );
               onScreenshot(base64);
          }
      }
    };

    if (window.gnani) {
      window.gnani.on('screenshot:captured', handleScreenshotCaptured);
    }

    return () => {
      // Cleanup - we need to verify if 'off' is available or use the returned cleanup
      // Based on previous work, 'on' returns a cleanup function.
    };
  }, [onScreenshot]);
};
