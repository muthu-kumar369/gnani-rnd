// src/components/common/ConfirmDeleteModal.tsx
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmDeleteModal.css';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    cascadeCount?: number;
    isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    cascadeCount = 0,
    isDeleting = false
}) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="confirm-delete-modal">
                <div className="modal-header">
                    <div className="modal-icon">
                        <AlertTriangle size={24} />
                    </div>
                    <button onClick={onCancel} className="close-button" aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <h3 className="modal-title">Delete Message?</h3>
                    <p className="modal-description">
                        This action will delete your message
                        {cascadeCount > 0 && (
                            <strong> and {cascadeCount} response{cascadeCount > 1 ? 's' : ''}</strong>
                        )}.
                    </p>
                    <p className="modal-hint">
                        You can undo this action within 30 minutes.
                    </p>
                </div>

                <div className="modal-footer">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="cancel-button"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="delete-button"
                    >
                        {isDeleting ? (
                            <>
                                <div className="spinner" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
