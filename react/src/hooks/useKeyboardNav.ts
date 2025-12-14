import { useEffect } from 'react';
import { eventManager } from '../utils/eventManager';

export const useKeyboardNav = () => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;

            // Ctrl+N: New conversation
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('keyboard:new-conversation'));
            }

            // Ctrl+K: Focus search
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('keyboard:focus-search'));
            }

            // Ctrl+/: Show keyboard shortcuts
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('keyboard:show-shortcuts'));
            }

            // Escape: Close modals
            if (e.key === 'Escape') {
                // We dispatch this generally, but modals usually handle their own escape locally via focus trap
                // But specifically for closing the shortcuts modal if it relies on this global one
                window.dispatchEvent(new CustomEvent('keyboard:escape'));
            }

            // Ctrl+B: Toggle Sidebar
            if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('keyboard:toggle-sidebar'));
            }

            // Ctrl+M: Voice Mode
            if (e.ctrlKey && (e.key === 'm' || e.key === 'M')) {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('keyboard:toggle-voice-mode'));
            }

            // Ctrl+,: Open Settings
            if (e.ctrlKey && e.key === ',') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('keyboard:open-settings', { detail: { tab: 'general' } }));
            }

            // Alt+W: Open Workspace
            if (e.altKey && (e.key === 'w' || e.key === 'W')) {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('keyboard:open-workspace', { detail: { tab: 'templates' } }));
            }

            // Shift+Esc: Focus Input
            if (e.shiftKey && e.key === 'Escape') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('keyboard:focus-input'));
            }
        };

        const cleanup = eventManager.addEventListener('keydown', handleKeyDown as EventListener, undefined, 'useKeyboardNav');
        return cleanup;
    }, []);
};
