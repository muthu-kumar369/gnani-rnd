import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';
import GlassModal from './GlassModal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDangerous?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDangerous = false
}) => {
    // Close on escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const footerContent = (
        <>
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-type-muted hover:text-type-primary transition-colors"
            >
                {cancelLabel}
            </button>
            <Button
                variant={isDangerous ? 'danger' : 'primary'}
                onClick={() => {
                    onConfirm();
                    onClose();
                }}
                className={isDangerous ? 'bg-status-error/20 hover:bg-status-error/30 text-status-error border-status-error/30' : ''}
            >
                {confirmLabel}
            </Button>
        </>
    );

    return (
        <GlassModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={footerContent}
            className={isDangerous ? 'border-status-error/20' : ''}
        >
            <div className="flex items-start gap-4">
                {isDangerous && (
                    <div className="p-3 bg-status-error/10 rounded-xl text-status-error shrink-0">
                        <AlertTriangle size={24} />
                    </div>
                )}
                <p className="text-type-secondary leading-relaxed pt-1">
                    {message}
                </p>
            </div>
        </GlassModal>
    );
};

export default ConfirmationModal;
