import React, { useState } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';
import SectionHeader from '../SectionHeader';
import { StickyNote, Database, Plus, Trash2 } from 'lucide-react';
import Loader from '../../ui/Loader';
import { CacheStatistics } from '../CacheStatistics'; // STAGE R1

const PreferencesSection: React.FC = () => {
    const { user, loading, addNote, deleteNote } = useUserStore();
    const { addToast } = useToast();
    const [newNote, setNewNote] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

    if (loading || !user) return <div className="flex justify-center p-8"><Loader text="Loading preferences..." /></div>;

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        setIsAdding(true);
        try {
            await addNote(newNote);
            setNewNote('');
            addToast('Note added successfully', 'success');
        } catch (error) {
            console.error('Failed to add note:', error);
            addToast('Failed to add note', 'error');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteNote = async (index: number) => {
        setDeletingIndex(index);
        try {
            await deleteNote(index);
            addToast('Note deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete note:', error);
            addToast('Failed to delete note', 'error');
        } finally {
            setDeletingIndex(null);
        }
    };

    return (
        <div>
            <SectionHeader
                title="Preferences & Memory"
                description="Manage what Gnani remembers about you."
            />

            <div className="space-y-6">
                {/* Notes */}
                <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-cyan-200 mb-4 flex items-center gap-2">
                        <StickyNote size={20} />
                        Personal Notes
                    </h4>

                    {/* Add Note Input */}
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                            placeholder="Add a new note..."
                            className="flex-1 bg-black/40 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 placeholder-cyan-400/40 focus:outline-none focus:border-cyan-400"
                        />
                        <button
                            onClick={handleAddNote}
                            disabled={isAdding || !newNote.trim()}
                            className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg font-medium transition-colors border border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Add
                        </button>
                    </div>

                    <div className="space-y-2">
                        {user.notes.map((note: string, index: number) => (
                            <div key={index} className="p-3 bg-black/20 rounded-lg border border-cyan-500/10 text-cyan-100 text-sm flex items-center justify-between group">
                                <span>{note}</span>
                                <button
                                    onClick={() => handleDeleteNote(index)}
                                    disabled={deletingIndex === index}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-all disabled:opacity-50"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {user.notes.length === 0 && (
                            <p className="text-cyan-400/50 text-sm italic">No notes saved yet.</p>
                        )}
                    </div>
                </div>

                {/* STAGE R1: Cache Statistics */}
                <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-6">
                    <CacheStatistics />
                </div>

                {/* Metadata Viewer */}
                <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-cyan-200 mb-4 flex items-center gap-2">
                        <Database size={20} />
                        System Metadata
                    </h4>
                    <div className="bg-black/40 rounded-lg p-4 font-mono text-xs text-cyan-300 overflow-x-auto">
                        <pre>{JSON.stringify(user.metadata, null, 2)}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreferencesSection;
