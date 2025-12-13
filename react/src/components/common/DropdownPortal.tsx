import { useEffect, useRef, useState, useCallback } from 'react';
import { eventManager } from '../../utils/eventManager';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';

interface DropdownPortalProps {
    children: React.ReactNode;
    isOpen: boolean;
    buttonRef: React.RefObject<HTMLElement | null>;
    placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'right-start' | 'right-end' | 'left-start' | 'left-end';
    onClose?: () => void;
}

const DropdownPortal: React.FC<DropdownPortalProps> = ({ children, isOpen, buttonRef, placement = 'bottom-start', onClose }) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null);
    const [isPositioned, setIsPositioned] = useState(false);
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
        setPortalRoot(container);
    }, []);

    const updatePosition = useCallback(() => {
        if (!buttonRef.current || !isOpen) return;

        const buttonRect = buttonRef.current.getBoundingClientRect();
        // Use offsetWidth/Height if ref exists, otherwise default
        const contentRect = contentRef.current?.getBoundingClientRect() || { width: 240, height: 200 };
        const gap = 8;

        let top = 0;
        let left = 0;
        const width = contentRect.width;
        const height = contentRect.height;

        switch (placement) {
            case 'right-start':
                top = buttonRect.top;
                left = buttonRect.right + gap;
                break;
            case 'right-end':
                top = buttonRect.bottom - height;
                left = buttonRect.right + gap;
                break;
            case 'top-start':
                top = buttonRect.top - height - gap;
                left = buttonRect.left;
                break;
            case 'top-end':
                top = buttonRect.top - height - gap;
                left = buttonRect.right - width;
                break;
            case 'bottom-end':
                top = buttonRect.bottom + gap;
                left = buttonRect.right - width;
                break;
            case 'bottom-start':
            default:
                top = buttonRect.bottom + gap;
                left = buttonRect.left;
                break;
        }

        // Boundary checks
        // Right edge
        if (left + width > window.innerWidth - 10) {
            if (placement.startsWith('right')) {
                left = buttonRect.left - width - gap;
            } else {
                left = window.innerWidth - width - 10;
            }
        }

        // Top edge
        if (top < 10) {
            top = 10;
        }

        // Bottom edge
        if (top + height > window.innerHeight - 10) {
            // Push up
            if (placement.startsWith('bottom')) {
                top = buttonRect.top - height - gap;
            } else {
                top = window.innerHeight - height - 10;
            }
        }

        // Left edge
        if (left < 10) left = 10;

        setPosition({ top, left });
        setIsPositioned(true);
    }, [buttonRef, isOpen, placement]);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            // Reset positioned state when re-opening
            setIsPositioned(false);

            // Immediate update attempt
            updatePosition();

            // Retries to ensure layout is stable
            const timer1 = setTimeout(updatePosition, 10);
            const timer2 = setTimeout(updatePosition, 50);

            const handleScroll = (e: Event) => {
                // If the scroll happened inside the dropdown itself, don't close
                if (contentRef.current && contentRef.current.contains(e.target as Node)) {
                    return;
                }

                if (onClose) {
                    onClose();
                } else {
                    updatePosition();
                }
            };

            // Use capture phase to detect scroll in any parent
            // Use capture phase to detect scroll in any parent
            window.addEventListener('scroll', handleScroll, { capture: true });

            // Native listener for resize to avoid EventManager strict checks during unmount
            window.addEventListener('resize', updatePosition);

            // Also close on outside click
            const handleClickOutside = (e: MouseEvent) => {
                // Check if click is outside both content and button
                if (onClose &&
                    contentRef.current &&
                    !contentRef.current.contains(e.target as Node) &&
                    buttonRef.current &&
                    !buttonRef.current.contains(e.target as Node)) {
                    onClose();
                }
            };
            window.addEventListener('mousedown', handleClickOutside);

            // Listen for escape key (using native listener for consistency)
            const handleEscape = (e: Event) => {
                const customEvent = e as CustomEvent;
                // Check if it's our custom event or native
                if (e.type === 'keyboard:escape' || (e instanceof KeyboardEvent && e.key === 'Escape')) {
                    if (onClose) onClose();
                }
            };

            // Support both native Escape and our custom event
            window.addEventListener('keydown', handleEscape);
            window.addEventListener('keyboard:escape', handleEscape);

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
                window.removeEventListener('scroll', handleScroll, { capture: true });
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('mousedown', handleClickOutside);
                window.removeEventListener('keydown', handleEscape);
                window.removeEventListener('keyboard:escape', handleEscape);
            };
        } else {
            setIsPositioned(false);
        }
    }, [isOpen, buttonRef, updatePosition, onClose]);

    if (!portalRoot) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    ref={contentRef}
                    style={{
                        position: 'fixed',
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        pointerEvents: 'auto',
                        zIndex: 99999,
                        maxHeight: '400px',
                        opacity: isPositioned ? 1 : 0, // Hide until positioned
                        transition: 'opacity 0.1s ease-out'
                    }}
                >
                    {children}
                </div>
            )}
        </AnimatePresence>,
        portalRoot
    );
};

export default DropdownPortal;
