import React, { useState } from 'react';
import { useUser } from '../../../context/UserContext';
import type { ISettings } from '../../../types/user';
import SectionHeader from '../SectionHeader';
import { Save, Volume2, Mic, Keyboard } from 'lucide-react';

const AssistantSettingsSection: React.FC = () => {
    const { user, updateSettings, loading } = useUser();
    const [settings, setSettings] = useState<Partial<ISettings>>(user?.settings || {});
    const [isSaving, setIsSaving] = useState(false);

    if (loading || !user) return <div className="text-cyan-400">Loading settings...</div>;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'range' ? Number(value) : value;
        setSettings(prev => ({ ...prev, [name]: val }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSettings(settings);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <SectionHeader
                title="Assistant Configuration"
                description="Customize how Gnani interacts with you."
            />

            <div className="space-y-8">
                {/* Voice & Audio */}
                <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-cyan-200 mb-4 flex items-center gap-2">
                        <Volume2 size={20} />
                        Voice & Audio
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm text-cyan-300 font-medium">Wake Word</label>
                            <input
                                type="text"
                                name="wakeWord"
                                value={settings.wakeWord || ''}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-cyan-300 font-medium">Preferred Voice</label>
                            <select
                                name="preferredVoice"
                                value={settings.preferredVoice || 'jarvis'}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400 transition-all"
                            >
                                <option value="jarvis">Jarvis (Male)</option>
                                <option value="friday">Friday (Female)</option>
                                <option value="edith">EDITH (Neutral)</option>
                            </select>
                        </div>
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <div className="flex justify-between">
                                <label className="text-sm text-cyan-300 font-medium">Volume</label>
                                <span className="text-sm text-cyan-400">{settings.volume}%</span>
                            </div>
                            <input
                                type="range"
                                name="volume"
                                min="0"
                                max="100"
                                value={settings.volume || 80}
                                onChange={handleChange}
                                className="w-full h-2 bg-cyan-900/50 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-cyan-200 mb-4 flex items-center gap-2">
                        <Mic size={20} />
                        Appearance
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm text-cyan-300 font-medium">Theme</label>
                            <select
                                name="theme"
                                value={settings.theme || 'jarvis'}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400 transition-all"
                            >
                                <option value="jarvis">Jarvis HUD (Default)</option>
                                <option value="dark">Dark Mode</option>
                                <option value="light">Light Mode</option>
                                <option value="system">System Default</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Shortcuts */}
                <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-cyan-200 mb-4 flex items-center gap-2">
                        <Keyboard size={20} />
                        Keyboard Shortcuts
                    </h4>
                    <div className="space-y-4">
                        {settings.shortcuts && Object.entries(settings.shortcuts).map(([key, action]) => (
                            <div key={key} className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-cyan-500/10">
                                <span className="text-cyan-100 capitalize">{action}</span>
                                <code className="bg-cyan-900/30 px-2 py-1 rounded text-cyan-300 text-sm border border-cyan-500/20">{key}</code>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t border-cyan-500/20">
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

export default AssistantSettingsSection;
