import { useEffect } from 'react';

export const useClipboard = (onPaste: (content: { type: 'text' | 'image', data: string }) => void) => {
  useEffect(() => {
    const handlePaste = async (e: KeyboardEvent) => {
      // Check for hotkey: Ctrl+Shift+V
      // Or just handle all pastes if the user is focused on the window but not in an input?
      // The requirement said "Hotkey: Ctrl+Shift+V to paste clipboard as context"
      
      // However, standard paste (Ctrl+V) should also work if we are not in a specific input field that consumes it.
      // But let's stick to the hotkey for "context injection" to avoid conflict with normal text input pasting.
      
      // Actually, if the user is in the main window, any paste could be interpreted as "add to context".
      // Let's implement the hotkey check as requested.
      
      // Note: e.ctrlKey might be e.metaKey on Mac.
      const isModifier = e.ctrlKey || e.metaKey;
      
      if (isModifier && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        
        try {
          const clipboardItems = await navigator.clipboard.read();
          
          for (const item of clipboardItems) {
            if (item.types.includes('image/png')) {
              const blob = await item.getType('image/png');
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                onPaste({ type: 'image', data: base64 });
              };
              reader.readAsDataURL(blob);
            } else if (item.types.includes('text/plain')) {
              const blob = await item.getType('text/plain');
              const text = await blob.text();
              onPaste({ type: 'text', data: text });
            }
          }
        } catch (err) {
          console.error('[useClipboard] Failed to read clipboard:', err);
        }
      }
    };

    window.addEventListener('keydown', handlePaste as any);
    return () => window.removeEventListener('keydown', handlePaste as any);
  }, [onPaste]);
};
