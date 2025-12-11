import { useEffect, useRef, useState, useCallback } from 'react';
import { eventManager } from '../../utils/eventManager';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';

interface DropdownPortalProps {
    children: React.ReactNode;
    isOpen: boolean;
    buttonRef: React.RefObject<HTMLElement | null>;
}

const DropdownPortal: React.FC<DropdownPortalProps> = ({ children, isOpen, buttonRef }) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const portalRoot = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let container = document.getElementById('dropdown-portal-root') as HTMLDivElement;
        if (!container) {
            container = document.createElement('div');
            container.id = 'dropdown-portal-root';
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.zIndex = '99999';
            container.style.pointerEvents = 'none';
            document.body.appendChild(container);
        }
        portalRoot.current = container;
    }, []);

    const updatePosition = useCallback(() => {
        if (!buttonRef.current || !isOpen) return;

        const buttonRect = buttonRef.current.getBoundingClientRect();
        const gap = 8;

        // Position at button's top, transform will move it up
        let top = buttonRect.top - gap;
        let left = buttonRect.left;

        // Keep within horizontal bounds
        const dropdownWidth = contentRef.current?.offsetWidth || 240;
        if (left + dropdownWidth > window.innerWidth - 10) {
            left = window.innerWidth - dropdownWidth - 10;
        }
        if (left < 10) {
            left = 10;
        }

        setPosition({ top, left });
    }, [buttonRef, isOpen]);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            updatePosition();
            const timer1 = setTimeout(updatePosition, 50);
            const timer2 = setTimeout(updatePosition, 150);

            const cleanup1 = eventManager.addEventListener('scroll', updatePosition as EventListener, { capture: true }, 'DropdownPortal');
            const cleanup2 = eventManager.addEventListener('resize', updatePosition as EventListener, undefined, 'DropdownPortal');

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
                cleanup1();
                cleanup2();
            };
        }
    }, [isOpen, buttonRef, updatePosition]);

    if (!portalRoot.current) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    ref={contentRef}
                    style={{
                        position: 'fixed',
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        transform: 'translateY(-100%)',
                        pointerEvents: 'auto',
                        zIndex: 99999,
                        maxHeight: '400px'
                    }}
                >
                    {children}
                </div>
            )}
        </AnimatePresence>,
        portalRoot.current
    );
};

export default DropdownPortal;
