import React, { useRef, useEffect } from 'react';

interface FocusTrapProps {
    children: React.ReactNode;
    active?: boolean;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ children, active = true }) => {
    const trapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!active) return;

        const focusableElements = trapRef.current?.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement?.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement?.focus();
            }
        };

        document.addEventListener('keydown', handleTab);

        // Auto-focus first element
        setTimeout(() => firstElement?.focus(), 0);

        return () => document.removeEventListener('keydown', handleTab);
    }, [active]);

    return <div ref={trapRef}>{children}</div>;
};
