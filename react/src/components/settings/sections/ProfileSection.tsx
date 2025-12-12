import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';
import type { IProfile } from '../../../types/user';
import SectionHeader from '../SectionHeader';
import { Camera, Save } from 'lucide-react';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import GlassDropdown from '../../ui/GlassDropdown';

const ProfileSection: React.FC = () => {
    const { user, updateProfile } = useUserStore();
    const { addToast } = useToast();
    const [formData, setFormData] = useState<Partial<IProfile>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user?.profile) {
            setFormData(user.profile);
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile(formData);
            addToast('Profile updated successfully', 'success');
        } catch (error) {
            addToast('Failed to update profile', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const getInitials = () => {
        const first = formData.firstName?.charAt(0) || '';
        const last = formData.lastName?.charAt(0) || '';
        return (first + last).toUpperCase() || 'U';
    };

    if (!user) return null;

    return (
        <div>
            <SectionHeader
                title="Personal Profile"
                description="Manage your personal information and how Gnani addresses you."
            />

            <div className="flex flex-col md:flex-row gap-8 mb-8">
                {/* Profile Photo */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-jarvis-border shadow-jarvis-glow bg-jarvis-bg flex items-center justify-center relative">
                            {formData.profilePhoto ? (
                                <img
                                    src={formData.profilePhoto}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Fallback on error
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement?.classList.add('fallback-active');
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-jarvis-panel text-jarvis-blue text-3xl font-bold font-mono">
                                    {getInitials()}
                                </div>
                            )}
                            {/* Fallback for hidden image */}
                            <div className="hidden fallback-active:flex w-full h-full absolute inset-0 items-center justify-center bg-jarvis-panel text-jarvis-blue text-3xl font-bold font-mono">
                                {getInitials()}
                            </div>

                            {/* Holographic Ring Overlay */}
                            <div className="absolute inset-0 rounded-full border border-jarvis-blue/30 animate-pulse-fast pointer-events-none" />
                        </div>
                        <button className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer backdrop-blur-sm">
                            <Camera className="text-jarvis-blue" />
                        </button>
                    </div>
                    <span className="text-xs text-jarvis-cyan/60 font-mono uppercase tracking-wider">Profile Photo</span>
                </div>

                {/* Form Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-xs font-mono text-jarvis-cyan/70 uppercase tracking-wider ml-1">First Name</label>
                        <Input
                            name="firstName"
                            value={formData.firstName || ''}
                            onChange={handleChange}
                            placeholder="Enter first name"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-mono text-jarvis-cyan/70 uppercase tracking-wider ml-1">Last Name</label>
                        <Input
                            name="lastName"
                            value={formData.lastName || ''}
                            onChange={handleChange}
                            placeholder="Enter last name"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-mono text-jarvis-cyan/70 uppercase tracking-wider ml-1">Date of Birth</label>
                        <Input
                            type="date"
                            name="dob"
                            value={formData.dob ? (typeof formData.dob === 'string' ? formData.dob.split('T')[0] : new Date(formData.dob).toISOString().split('T')[0]) : ''}
                            onChange={handleChange}
                            className="[color-scheme:dark]"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-mono text-jarvis-cyan/70 uppercase tracking-wider ml-1">Language</label>
                        <GlassDropdown
                            value={formData.language || 'en-US'}
                            onChange={(val) => setFormData(prev => ({ ...prev, language: val }))}
                            options={[
                                { value: 'en-US', label: 'English (US)' },
                                { value: 'en-GB', label: 'English (UK)' },
                                { value: 'es-ES', label: 'Spanish' },
                                { value: 'fr-FR', label: 'French' },
                                { value: 'de-DE', label: 'German' },
                                { value: 'hi-IN', label: 'Hindi' }
                            ]}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-jarvis-border">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    isLoading={isSaving}
                    leftIcon={<Save size={18} />}
                >
                    Save Changes
                </Button>
            </div>
        </div>
    );
};

export default ProfileSection;
