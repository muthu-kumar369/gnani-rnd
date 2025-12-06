// src/components/terminal/InlineMessageEditor.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import './InlineMessageEditor.css';

interface InlineMessageEditorProps {
    initialContent: string;
    onSave: (newContent: string) => Promise<void>;
    onCancel: () => void;
    maxLength?: number;
    autoRegenerate?: boolean;
}

export const InlineMessageEditor: React.FC<InlineMessageEditorProps> = ({
    initialContent,
    onSave,
    onCancel,
    maxLength = 2000,
    autoRegenerate = true
}) => {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // Auto-focus and select all text
        if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, []);

    const handleSave = async () => {
        if (!content.trim() || content === initialContent) return;

        setIsSaving(true);
        try {
            await onSave(content);
        } catch (error) {
            console.error('Failed to save edit:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = e.target;
        setContent(textarea.value);

        // Auto-resize
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
    };

    const charCount = content.length;
    const isValid = content.trim().length > 0 && content !== initialContent;

    return (
        <div className="inline-message-editor">
            <textarea
                ref={textareaRef}
                value={content}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                maxLength={maxLength}
                className="editor-textarea"
                disabled={isSaving}
                placeholder="Edit your message..."
            />

            <div className="editor-footer">
                <div className="editor-info">
                    <span className="char-count">
                        {charCount} / {maxLength}
                    </span>
                    {autoRegenerate && (
                        <span className="auto-regen-hint">
                            ⚡ Will auto-regenerate response
                        </span>
                    )}
                </div>

                <div className="editor-actions">
                    <button
                        onClick={onCancel}
                        disabled={isSaving}
                        className="cancel-button"
                        title="Cancel (Esc)"
                    >
                        <X size={16} />
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!isValid || isSaving}
                        className="save-button"
                        title="Save (Ctrl+Enter)"
                    >
                        {isSaving ? (
                            <>
                                <div className="spinner" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check size={16} />
                                Save
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
