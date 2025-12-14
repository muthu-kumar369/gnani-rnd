import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../../api/apiClient';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';
import type { IProfile } from '../../../types/user';

import { Camera, Save, StickyNote, Plus, Trash2, User, X } from 'lucide-react';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import GlassDatePicker from '../../ui/GlassDatePicker';
import ConfirmationModal from '../../ui/ConfirmationModal';

const PersonalizationSection: React.FC = () => {
    const { user, updateProfile, uploadProfilePhoto, addNote, deleteNote, loading } = useUserStore();
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile State
    const [profileData, setProfileData] = useState<Partial<IProfile>>({});
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [isDeletePhotoModalOpen, setIsDeletePhotoModalOpen] = useState(false);

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

    const handleDateChange = (date: string) => {
        setProfileData(prev => ({ ...prev, dob: date }));
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

    // --- Photo Handlers ---
    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            addToast('Invalid file type. Please upload an image.', 'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB
            addToast('File size too large. Max 10MB.', 'error');
            return;
        }

        setIsUploadingPhoto(true);
        try {
            await uploadProfilePhoto(file);
            addToast('Profile photo updated', 'success');
        } catch (error) {
            addToast('Failed to upload photo', 'error');
        } finally {
            setIsUploadingPhoto(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemovePhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeletePhotoModalOpen(true);
    };

    const confirmRemovePhoto = async () => {
        try {
            // Clear both uploaded ID and external URL to fully remove photo
            // Use 'any' cast if types are strict about null vs undefined, but usually null is fine for DB update
            await updateProfile({ uploadedProfilePhotoId: null, profilePhoto: null } as any);
            setProfileData(prev => ({ ...prev, uploadedProfilePhotoId: null, profilePhoto: null } as any));
            addToast('Profile photo removed', 'success');
        } catch (error) {
            addToast('Failed to remove photo', 'error');
        }
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

    const hasProfileChanges = React.useMemo(() => {
        if (!user.profile) return false;
        return (
            profileData.firstName !== user.profile.firstName ||
            profileData.lastName !== user.profile.lastName ||
            profileData.dob !== user.profile.dob ||
            profileData.profilePhoto !== user.profile.profilePhoto
        );
    }, [profileData, user.profile]);

    // Helper to determine the profile image URL with priority
    const profileImageUrl = React.useMemo(() => {
        if (!user.profile) return null;
        if (user.profile.uploadedProfilePhotoId) {
            // Use full URL with token
            return `${API_BASE_URL}/files/${user.profile.uploadedProfilePhotoId}/download?token=${useUserStore.getState().accessToken}`;
        }
        if (user.profile.profilePhoto) {
            return user.profile.profilePhoto;
        }
        return null;
    }, [user.profile]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6">

                {/* Profile Identity Card */}
                <div className="bg-[#0f0f1a]/60 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <User size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Identity</h3>
                            <p className="text-xs text-slate-500">Manage your personal profile details</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Profile Photo Area */}
                        <div className="flex flex-col items-center gap-4 pt-2">
                            <div className="relative group">
                                <div
                                    onClick={handlePhotoClick}
                                    className={`w-24 h-24 rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-[#0a0a15] flex items-center justify-center relative cursor-pointer hover:border-cyan-500/50 transition-colors ${isUploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    {profileImageUrl ? (
                                        <img
                                            src={profileImageUrl}
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
                                    {/* Fallback duplicated for robustness if img fails */}
                                    <div className="hidden fallback-active:flex w-full h-full absolute inset-0 items-center justify-center bg-cyan-500/5 text-cyan-400 text-2xl font-bold font-mono">
                                        {getInitials()}
                                    </div>

                                    {/* Edit Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                        <Camera className="text-white drop-shadow-md pb-1" size={24} />
                                    </div>

                                </div>

                                {/* Delete Button - Moved outside overflow-hidden container */}
                                {(profileData.uploadedProfilePhotoId || profileData.profilePhoto) && (
                                    <button
                                        onClick={handleRemovePhoto}
                                        className="absolute -top-2 -right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm"
                                        title="Remove photo"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}

                                {/* Hidden Input */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handlePhotoUpload}
                                    accept="image/*"
                                    className="hidden"
                                />

                                <div className="flex items-center justify-center mt-3">
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Profile Photo</p>
                                </div>
                            </div>
                        </div>

                        {/* Profile Inputs */}
                        <div className="flex-1 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                <div className="flex flex-col gap-4">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">First Name</label>
                                    <Input
                                        name="firstName"
                                        value={profileData.firstName || ''}
                                        onChange={handleProfileChange}
                                        placeholder="Enter first name"
                                        className="!bg-black/40 !border-white/10 !rounded-xl !px-4 !py-3 text-sm text-white placeholder:text-slate-600 focus:!border-cyan-500/30"
                                    />
                                </div>
                                <div className="flex flex-col gap-4">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Last Name</label>
                                    <Input
                                        name="lastName"
                                        value={profileData.lastName || ''}
                                        onChange={handleProfileChange}
                                        placeholder="Enter last name"
                                        className="!bg-black/40 !border-white/10 !rounded-xl !px-4 !py-3 text-sm text-white placeholder:text-slate-600 focus:!border-cyan-500/30"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 max-w-[50%]">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Date of Birth</label>
                                <GlassDatePicker
                                    value={profileData.dob}
                                    onChange={handleDateChange}
                                    placeholder="Ex: Jan 1, 1990"
                                />
                            </div>

                            <div className="pt-2 flex justify-end">
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={isSavingProfile || !hasProfileChanges}
                                    isLoading={isSavingProfile}
                                    className={`bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_-3px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_-3px_rgba(6,182,212,0.2)] ${!hasProfileChanges ? 'opacity-50 cursor-not-allowed hover:bg-cyan-500/10 hover:shadow-none' : ''}`}
                                    leftIcon={<Save size={16} />}
                                >
                                    Save Profile
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal Notes (Memory) */}
                <div className="bg-[#0f0f1a]/60 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <StickyNote size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Personal Memory</h3>
                            <p className="text-xs text-slate-500">Facts about you that Gnani should remember</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                                    placeholder="E.g. I am a vegan, I work as a developer..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                />
                            </div>
                            <Button
                                onClick={handleAddNote}
                                disabled={isAddingNote || !newNote.trim()}
                                className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl px-5 font-bold uppercase tracking-wider transition-all"
                                leftIcon={<Plus size={16} />}
                            >
                                Add
                            </Button>
                        </div>

                        <div className="space-y-2.5 pt-2">
                            {user.notes.map((note: string, index: number) => (
                                <div key={index} className="group flex items-center justify-between p-3.5 bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/10 rounded-xl transition-all duration-200">
                                    <span className="text-sm text-slate-300 pl-1">{note}</span>
                                    <button
                                        onClick={() => handleDeleteNote(index)}
                                        disabled={deletingNoteIndex === index}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                        title="Delete memory"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}

                            {user.notes.length === 0 && (
                                <div className="text-center py-8 border border-dashed border-white/5 rounded-xl">
                                    <p className="text-slate-600 text-xs">No memories added yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                </div>

            <ConfirmationModal
                isOpen={isDeletePhotoModalOpen}
                onClose={() => setIsDeletePhotoModalOpen(false)}
                onConfirm={confirmRemovePhoto}
                title="Remove Profile Photo"
                message="Are you sure you want to remove your profile photo? This action cannot be undone."
                confirmLabel="Remove"
                isDangerous={true}
            />
        </div>
    );
};

export default PersonalizationSection;
