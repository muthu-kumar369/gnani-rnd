// src/components/terminal/MessageInputArea.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import './MessageInputArea.css';

type InputState = 'idle' | 'streaming' | 'disabled';

interface MessageInputAreaProps {
    onSendMessage: (text: string) => void;
    onStopGeneration: () => void;
    isStreaming: boolean;
    disabled?: boolean;
    placeholder?: string;
}

export const MessageInputArea: React.FC<MessageInputAreaProps> = ({
    onSendMessage,
    onStopGeneration,
    isStreaming,
    disabled = false,
    placeholder = "Message Gnani..."
}) => {
    const [inputValue, setInputValue] = useState('');
    const [inputState, setInputState] = useState<InputState>('idle');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync input state with streaming prop
    useEffect(() => {
        if (isStreaming) {
            setInputState('streaming');
        } else if (disabled) {
            setInputState('disabled');
        } else {
            setInputState('idle');
        }
    }, [isStreaming, disabled]);

    const handleSend = () => {
        if (!inputValue.trim() || inputState !== 'idle') return;

        onSendMessage(inputValue);
        setInputValue('');

        // Auto-resize textarea back to default
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleStop = () => {
        onStopGeneration();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputState === 'idle') {
                handleSend();
            }
        }
    };

    // Auto-resize textarea
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);

        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    };

    const canSend = inputValue.trim().length > 0 && inputState === 'idle';

    return (
        <div className="message-input-area">
            <div className="input-container">
                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={inputState === 'disabled'}
                    className="message-textarea"
                    rows={1}
                />

                <div className="input-actions">
                    {/* Send/Stop button - changes based on state */}
                    {inputState === 'streaming' ? (
                        // Stop button during streaming
                        <button
                            onClick={handleStop}
                            className="stop-button"
                            aria-label="Stop generating"
                            title="Stop generating"
                        >
                            <Square size={20} className="stop-icon" />
                        </button>
                    ) : (
                        // Send button when idle
                        <button
                            onClick={handleSend}
                            disabled={!canSend}
                            className={`send-button ${canSend ? 'active' : 'disabled'}`}
                            aria-label="Send message"
                            title="Send message"
                        >
                            <Send size={20} className="send-icon" />
                        </button>
                    )}
                </div>
            </div>

            {/* Streaming indicator */}
            {inputState === 'streaming' && (
                <div className="streaming-indicator">
                    <div className="streaming-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span className="streaming-text">Gnani is thinking...</span>
                </div>
            )}
        </div>
    );
};
