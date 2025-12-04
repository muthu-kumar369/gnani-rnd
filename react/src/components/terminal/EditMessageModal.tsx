import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';

interface EditMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newContent: string) => void;
    initialContent: string;
}

const EditMessageModal: React.FC<EditMessageModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialContent
}) => {
    const [content, setContent] = useState(initialContent);

    useEffect(() => {
        setContent(initialContent);
    }, [initialContent, isOpen]);

    const handleSave = () => {
        if (content.trim() !== initialContent) {
            onSave(content);
        }
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-2xl bg-gray-900 border border-cyan-500/30 rounded-lg shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-4 py-3 bg-cyan-950/30 border-b border-cyan-500/20">
                            <h3 className="text-cyan-400 font-semibold text-sm uppercase tracking-wider">Edit Message</h3>
                            <button onClick={onClose} className="text-cyan-500/60 hover:text-cyan-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-64 bg-black/40 border border-cyan-500/20 rounded-md p-3 text-cyan-100 focus:border-cyan-500/50 focus:outline-none resize-none font-mono text-sm"
                                placeholder="Edit your message..."
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3 px-4 py-3 bg-cyan-950/20 border-t border-cyan-500/20">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-medium text-cyan-400/70 hover:text-cyan-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-medium rounded border border-cyan-500/30 transition-all"
                            >
                                <Save size={14} />
                                Save & Regenerate
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EditMessageModal;
