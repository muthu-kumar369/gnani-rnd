import React, { useState, useEffect } from 'react';
import { Keyboard, AlertCircle, Check } from 'lucide-react';

const HotkeySettings: React.FC = () => {
    const [hotkey, setHotkey] = useState<string>('');
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        // Load current hotkey
        const loadHotkey = async () => {
            if (window.gnani && window.gnani.system) {
                try {
                    const current = await window.gnani.system.getHotkey();
                    setHotkey(current || 'CommandOrControl+Shift+Space');
                } catch (error) {
                    console.error('Failed to load hotkey:', error);
                }
            }
        };
        loadHotkey();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isRecording) return;

        e.preventDefault();
        e.stopPropagation();

        const modifiers = [];
        if (e.ctrlKey) modifiers.push('Ctrl');
        if (e.metaKey) modifiers.push('Command');
        if (e.altKey) modifiers.push('Alt');
        if (e.shiftKey) modifiers.push('Shift');

        let key = e.key.toUpperCase();
        if (key === 'CONTROL' || key === 'META' || key === 'ALT' || key === 'SHIFT') {
            return; // Just a modifier pressed
        }

        if (key === ' ') key = 'Space';

        const newHotkey = [...modifiers, key].join('+');
        setHotkey(newHotkey);
        setIsRecording(false);
        saveHotkey(newHotkey);
    };

    const saveHotkey = async (newHotkey: string) => {
        if (window.gnani && window.gnani.system) {
            try {
                // Convert for Electron (Ctrl -> Control, etc if needed, but Electron handles most)
                // For simplicity, we send as is and let backend/electron-store handle it, 
                // but ideally we map 'Ctrl' to 'CommandOrControl' for cross-platform.
                let electronHotkey = newHotkey
                    .replace('Ctrl', 'CommandOrControl')
                    .replace('Command', 'CommandOrControl');

                await window.gnani.system.updateHotkey(electronHotkey);
                setStatus('success');
                setTimeout(() => setStatus('idle'), 2000);
            } catch (error) {
                console.error('Failed to save hotkey:', error);
                setStatus('error');
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
                <Keyboard size={18} />
                <h3 className="font-semibold">Global Hotkey</h3>
            </div>

            <div className="bg-cyan-950/30 p-4 rounded-lg border border-cyan-500/20">
                <p className="text-sm text-cyan-300/70 mb-4">
                    Press this key combination from anywhere to activate Gnani.
                </p>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsRecording(true)}
                        onKeyDown={handleKeyDown}
                        className={`relative flex-1 h-12 px-4 rounded border font-mono text-lg flex items-center justify-center transition-all ${isRecording
                                ? 'bg-cyan-900/50 border-cyan-400 text-cyan-300 animate-pulse'
                                : 'bg-black/40 border-cyan-500/30 text-cyan-400 hover:border-cyan-500/50'
                            }`}
                    >
                        {isRecording ? 'Press keys...' : hotkey}
                    </button>

                    {status === 'success' && (
                        <div className="text-green-400 flex items-center gap-1 text-sm">
                            <Check size={14} />
                            <span>Saved</span>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-red-400 flex items-center gap-1 text-sm">
                            <AlertCircle size={14} />
                            <span>Error</span>
                        </div>
                    )}
                </div>

                {isRecording && (
                    <p className="text-xs text-center mt-2 text-cyan-500/60">
                        Press Esc to cancel
                    </p>
                )}
            </div>
        </div>
    );
};

export default HotkeySettings;
