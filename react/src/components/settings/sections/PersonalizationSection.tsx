import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';
import type { IProfile } from '../../../types/user';

import { Camera, Save, StickyNote, Plus, Trash2 } from 'lucide-react';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

const PersonalizationSection: React.FC = () => {
    const { user, updateProfile, addNote, deleteNote, loading } = useUserStore();
    const { addToast } = useToast();

    // Profile State
    const [profileData, setProfileData] = useState<Partial<IProfile>>({});
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Notes State
    const [newNote, setNewNote] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [deletingNoteIndex, setDeletingNoteIndex] = useState<number | null>(null);

    useEffect(() => {
        if (user?.profile) {
            setProfileData(user.profile);
        }
    }, [user]);

    if (loading || !user) return null;

    // --- Profile Handlers ---
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            await updateProfile(profileData);
            addToast('Profile updated successfully', 'success');
        } catch (error) {
            addToast('Failed to update profile', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const getInitials = () => {
        const first = profileData.firstName?.charAt(0) || '';
        const last = profileData.lastName?.charAt(0) || '';
        return (first + last).toUpperCase() || 'U';
    };

    // --- Notes Handlers ---
    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setIsAddingNote(true);
        try {
            await addNote(newNote);
            setNewNote('');
            addToast('Note added successfully', 'success');
        } catch (error) {
            addToast('Failed to add note', 'error');
        } finally {
            setIsAddingNote(false);
        }
    };

    const handleDeleteNote = async (index: number) => {
        setDeletingNoteIndex(index);
        try {
            await deleteNote(index);
            addToast('Note deleted successfully', 'success');
        } catch (error) {
            addToast('Failed to delete note', 'error');
        } finally {
            setDeletingNoteIndex(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Profile Information */}
            <div className="flex flex-col md:flex-row gap-6 pb-6 border-b border-white/5">
                {/* Profile Photo */}
                <div className="flex flex-col items-center gap-3">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden border border-white/10 shadow-lg bg-[#0a0a15] flex items-center justify-center relative">
                            {profileData.profilePhoto ? (
                                <img
                                    src={profileData.profilePhoto}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement?.classList.add('fallback-active');
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-cyan-500/5 text-cyan-400 text-2xl font-bold font-mono">
                                    {getInitials()}
                                </div>
                            )}
                            <div className="hidden fallback-active:flex w-full h-full absolute inset-0 items-center justify-center bg-cyan-500/5 text-cyan-400 text-2xl font-bold font-mono">
                                {getInitials()}
                            </div>
                            <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-pulse-fast pointer-events-none" />
                        </div>
                        <button className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer backdrop-blur-sm">
                            <Camera className="text-cyan-400" size={20} />
                        </button>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">First Name</label>
                            <Input
                                name="firstName"
                                value={profileData.firstName || ''}
                                onChange={handleProfileChange}
                                placeholder="Enter first name"
                                className="!bg-black/20 !border-white/10 text-sm py-2"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Last Name</label>
                            <Input
                                name="lastName"
                                value={profileData.lastName || ''}
                                onChange={handleProfileChange}
                                placeholder="Enter last name"
                                className="!bg-black/20 !border-white/10 text-sm py-2"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Date of Birth</label>
                        <Input
                            type="date"
                            name="dob"
                            value={profileData.dob ? (typeof profileData.dob === 'string' ? profileData.dob.split('T')[0] : new Date(profileData.dob).toISOString().split('T')[0]) : ''}
                            onChange={handleProfileChange}
                            className="[color-scheme:dark] !bg-black/20 !border-white/10 text-sm py-2"
                        />
                    </div>
                    <div className="pt-1 flex justify-end">
                        <Button
                            onClick={handleSaveProfile}
                            disabled={isSavingProfile}
                            isLoading={isSavingProfile}
                            size="sm"
                            className="text-xs font-bold px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black border-none"
                            leftIcon={<Save size={14} />}
                        >
                            Update Profile
                        </Button>
                    </div>
                </div>
            </div>

            {/* Personal Notes (Memory) */}
            <div className="bg-[#0f0f1a]/60 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                    <StickyNote size={16} className="text-cyan-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Personal Memory
                    </h4>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                    Add notes about yourself that you want Gnani to remember (e.g. "I'm a vegan", "I work in Python").
                </p>

                {/* Add Note Input */}
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                        placeholder="Add a new memory..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    />
                    <button
                        onClick={handleAddNote}
                        disabled={isAddingNote || !newNote.trim()}
                        className="px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        <Plus size={14} />
                        Add
                    </button>
                </div>

                <div className="space-y-2">
                    {user.notes.map((note: string, index: number) => (
                        <div key={index} className="p-2.5 bg-black/20 rounded-lg border border-white/5 text-slate-300 text-xs flex items-center justify-between group hover:border-cyan-500/20 transition-colors">
                            <span>{note}</span>
                            <button
                                onClick={() => handleDeleteNote(index)}
                                disabled={deletingNoteIndex === index}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all disabled:opacity-50"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    {user.notes.length === 0 && (
                        <p className="text-slate-600 text-xs italic px-1">No personal memories saved yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonalizationSection;
