import React, { useState } from 'react';
import { useUser } from '../../../context/UserContext';
import type { IProfile } from '../../../types/user';
import SectionHeader from '../SectionHeader';
import { Camera, Save } from 'lucide-react';

const ProfileSection: React.FC = () => {
    const { user, updateProfile, loading } = useUser();
    const [formData, setFormData] = useState<Partial<IProfile>>(user?.profile || {});
    const [isSaving, setIsSaving] = useState(false);

    if (loading || !user) return <div className="text-cyan-400">Loading profile...</div>;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile(formData);
        } finally {
            setIsSaving(false);
        }
    };

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
                        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                            <img
                                src={formData.profilePhoto || 'https://via.placeholder.com/150'}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                            <Camera className="text-cyan-300" />
                        </button>
                    </div>
                    <span className="text-xs text-cyan-400/60 uppercase tracking-wider">Profile Photo</span>
                </div>

                {/* Form Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm text-cyan-300 font-medium">First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName || ''}
                            onChange={handleChange}
                            className="w-full bg-black/40 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-cyan-300 font-medium">Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName || ''}
                            onChange={handleChange}
                            className="w-full bg-black/40 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-cyan-300 font-medium">Date of Birth</label>
                        <input
                            type="date"
                            name="dob"
                            value={formData.dob ? formData.dob.split('T')[0] : ''}
                            onChange={handleChange}
                            className="w-full bg-black/40 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all [color-scheme:dark]"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-cyan-300 font-medium">Language</label>
                        <select
                            name="language"
                            value={formData.language || 'en-US'}
                            onChange={handleChange}
                            className="w-full bg-black/40 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all"
                        >
                            <option value="en-US">English (US)</option>
                            <option value="en-GB">English (UK)</option>
                            <option value="es-ES">Spanish</option>
                            <option value="fr-FR">French</option>
                            <option value="de-DE">German</option>
                            <option value="hi-IN">Hindi</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-cyan-500/20">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                    <Save size={18} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export default ProfileSection;
