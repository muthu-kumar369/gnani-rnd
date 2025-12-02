import React from 'react';
import { motion } from 'framer-motion';
import { Command, Globe, FolderOpen, Settings, Play } from 'lucide-react';
import type { ConversationMessage } from '../../store/useConversationStore';

interface ActionIndicatorProps {
    message: ConversationMessage;
}

const ActionIndicator: React.FC<ActionIndicatorProps> = ({ message }) => {

    const getIcon = () => {
        if (message.message.toLowerCase().includes('search')) return <Globe size={12} />;
        if (message.message.toLowerCase().includes('open')) return <FolderOpen size={12} />;
        if (message.message.toLowerCase().includes('play')) return <Play size={12} />;
        if (message.message.toLowerCase().includes('setting')) return <Settings size={12} />;
        return <Command size={12} />;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 my-2 ml-4 p-2 rounded border-l-2 border-yellow-500/50 bg-yellow-900/10 max-w-[80%]"
        >
            <div className="text-yellow-500">
                {getIcon()}
            </div>
            <span className="text-xs font-mono text-yellow-200/80">
                {message.message}
            </span>
        </motion.div>
    );
};

export default ActionIndicator;
