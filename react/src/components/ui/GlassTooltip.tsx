import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface GlassTooltipProps {
    content: string;
    children: React.ReactElement;
    placement?: 'top' | 'bottom' | 'left' | 'right';
}

const GlassTooltip: React.FC<GlassTooltipProps> = ({ content, children, placement = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

    // Ensure portal root exists
    useEffect(() => {
        let root = document.getElementById('tooltip-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'tooltip-root';
            document.body.appendChild(root);
        }
        setPortalRoot(root);
    }, []);

    const handleMouseEnter = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (placement) {
            case 'top':
                top = rect.top - 8;
                left = rect.left + rect.width / 2;
                break;
            case 'bottom':
                top = rect.bottom + 8;
                left = rect.left + rect.width / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2;
                left = rect.left - 8;
                break;
            case 'right':
                top = rect.top + rect.height / 2;
                left = rect.right + 8;
                break;
        }

        setPosition({ top, left });
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    const isVertical = placement === 'top' || placement === 'bottom';

    if (!portalRoot) {
        // Render children even if portal not ready, but don't show tooltip
        return React.cloneElement(children as React.ReactElement<any>, {
            onMouseEnter: (e: React.MouseEvent) => {
                (children.props as any).onMouseEnter?.(e);
            },
            onMouseLeave: (e: React.MouseEvent) => {
                (children.props as any).onMouseLeave?.(e);
            }
        });
    }

    return (
        <>
            {React.cloneElement(children as React.ReactElement<any>, {
                onMouseEnter: (e: React.MouseEvent) => {
                    handleMouseEnter(e);
                    (children.props as any).onMouseEnter?.(e);
                },
                onMouseLeave: (e: React.MouseEvent) => {
                    handleMouseLeave();
                    (children.props as any).onMouseLeave?.(e);
                }
            })}
            {createPortal(
                <AnimatePresence>
                    {isVisible && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: isVertical ? '-50%' : placement === 'left' ? '-100%' : 0, y: isVertical ? (placement === 'top' ? '-100%' : 0) : '-50%' }}
                            animate={{ opacity: 1, scale: 1, x: isVertical ? '-50%' : placement === 'left' ? '-100%' : 0, y: isVertical ? (placement === 'top' ? '-100%' : 0) : '-50%' }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                position: 'fixed',
                                top: position.top,
                                left: position.left,
                                zIndex: 100000,
                                pointerEvents: 'none',
                                // Transform is handled by motion x/y for smooth animation, 
                                // but we need base translation to center/offset correctly.
                                // Actually, let's use standard transform and just animate opacity/scale to keep it simple and robust.
                                transform: `translate(${isVertical ? '-50%' : placement === 'left' ? '-100%' : '0'}, ${isVertical ? (placement === 'top' ? '-100%' : '0') : '-50%'})`
                            }}
                            className="px-2 py-1 bg-canvas-popover backdrop-blur-md border border-glass-border rounded text-xs text-type-primary shadow-lg whitespace-nowrap"
                        >
                            {content}
                        </motion.div>
                    )}
                </AnimatePresence>,
                portalRoot
            )}
        </>
    );
};

export default GlassTooltip;
