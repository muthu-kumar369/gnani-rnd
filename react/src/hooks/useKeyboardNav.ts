import { useEffect } from 'react';

export const useKeyboardNav = () => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
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
                window.dispatchEvent(new CustomEvent('keyboard:escape'));
            }

            // Ctrl+Enter: Send message (when input is focused)
            if (e.ctrlKey && e.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'INPUT') {
                    window.dispatchEvent(new CustomEvent('keyboard:send-message'));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
};
