import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import ShareModal from './ShareModal';

interface ShareButtonProps {
    conversationId: string;
    conversationTitle?: string;
    className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ conversationId, className = '' }) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={`flex items-center gap-2 px-3 py-1.5 text-type-muted hover:text-type-primary hover:bg-glass-shimmer rounded-lg transition-colors ${className}`}
                title="Share Conversation"
            >
                <Share2 size={18} />
                <span className="text-sm hidden md:inline">Share</span>
            </button>

            {showModal && (
                <ShareModal conversationId={conversationId} onClose={() => setShowModal(false)} />
            )}
        </>
    );
};

export default ShareButton;
