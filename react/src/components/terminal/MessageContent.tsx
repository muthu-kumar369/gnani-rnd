import React from 'react';
import { renderMarkdown } from '../../utils/markdown-renderer';
import { useTypingEffect } from '../../hooks/useTypingEffect';
import '../../styles/markdown.css';

interface MessageContentProps {
    content: string;
    type: 'user' | 'gnani' | 'tts' | 'action' | 'system';
    isLatest: boolean;
}

const MessageContent: React.FC<MessageContentProps> = ({ content, type, isLatest }) => {
    const isGnani = type === 'gnani';
    const isTTS = type === 'tts';

    // Enable typing effect only for Gnani's latest message
    const { displayedText, isTyping } = useTypingEffect(content, isGnani && isLatest);

    return (
        <div className={`font-mono text-sm leading-relaxed ${isTTS ? 'text-type-primary' : 'text-type-secondary'} markdown-content`}>
            {isGnani && isLatest ? (
                <>
                    <div className="markdown-content">
                        {renderMarkdown(displayedText)}
                    </div>
                    {isTyping && (
                        <span className="inline-block w-2 h-4 ml-1 align-middle bg-gnani-primary animate-pulse" />
                    )}
                </>
            ) : (
                <div className="markdown-content">
                    {renderMarkdown(content)}
                </div>
            )}
        </div>
    );
};

export default MessageContent;
