import React, { useState } from 'react';

interface InlineMessageEditorProps {
    initialContent: string;
    onSave: (newContent: string) => Promise<void>;
    onCancel: () => void;
    isSaving?: boolean;
}

const InlineMessageEditor: React.FC<InlineMessageEditorProps> = ({
    initialContent,
    onSave,
    onCancel,
    isSaving = false
}) => {
    const [content, setContent] = useState(initialContent);

    const handleSave = async () => {
        if (content.trim() === initialContent) {
            onCancel();
            return;
        }
        await onSave(content);
    };

    return (
        <div className="w-full min-w-[300px] bg-gray-800/80 p-3 rounded-xl border border-jarvis-blue/30 backdrop-blur-sm">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-sm focus:outline-none focus:border-jarvis-blue/50 resize-y min-h-[100px]"
                autoFocus
                disabled={isSaving}
                placeholder="Enter message..."
            />
            <div className="flex justify-end gap-2 mt-2">
                <button
                    onClick={onCancel}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-white rounded transition-colors"
                    disabled={isSaving}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className={`px-3 py-1 bg-jarvis-blue hover:bg-jarvis-blue/80 text-xs text-white rounded transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save & Submit'}
                </button>
            </div>
        </div>
    );
};

export default InlineMessageEditor;
