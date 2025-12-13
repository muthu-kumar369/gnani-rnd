import React, { useState } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';
import type { ISettings } from '../../../types/user';
import { Save, Volume2, Mic, Globe, Info, Code, Heart, Check, Monitor, Moon, Sun } from 'lucide-react';
import Loader from '../../ui/Loader';
import Button from '../../ui/Button';
import axios from 'axios';
import GlassDropdown from '../../ui/GlassDropdown';

interface ModelOption {
    id: string;
    displayName: string;
    description?: string;
    provider: string;
}

const GeneralSection: React.FC = () => {
    const { user, updateSettings, updateProfile, loading } = useUserStore();
    const { addToast } = useToast();
    const [settings, setSettings] = useState<Partial<ISettings>>(user?.settings || {});
    const [language, setLanguage] = useState(user?.profile?.language || 'en-US');
    const [isSaving, setIsSaving] = useState(false);
    const [models, setModels] = useState<ModelOption[]>([]);
    const [loadingModels, setLoadingModels] = useState(true);

    if (loading || !user) return <div className="flex justify-center p-8"><Loader text="Loading settings..." /></div>;

    React.useEffect(() => {
        const fetchModels = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/v1/llm/models');
                setModels(response.data.models || []);
            } catch (error) {
                console.error('Failed to fetch models:', error);
                addToast('Failed to load available models', 'error');
            } finally {
                setLoadingModels(false);
            }
        };
        fetchModels();
    }, [addToast]);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'range' ? Number(value) : value;
        setSettings(prev => ({ ...prev, [name]: val }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSettings(settings);
            if (language !== user.profile?.language) {
                await updateProfile({ language });
            }
            addToast('Settings saved successfully', 'success');
        } catch (error) {
            addToast('Failed to save settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6">
                {/* Voice & Audio */}
                <div className="bg-[#0f0f1a]/60 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                            <Volume2 size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Voice & Audio</h3>
                            <p className="text-xs text-slate-500">Configure interactions and output volume</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Wake Word</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="wakeWord"
                                    value={settings.wakeWord || ''}
                                    onChange={handleSettingsChange}
                                    placeholder="e.g. Hey Gnani"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                />
                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                                    <Mic size={14} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Preferred Voice</label>
                            <GlassDropdown
                                value={settings.preferredVoice || 'jarvis'}
                                onChange={(val) => setSettings(prev => ({ ...prev, preferredVoice: val }))}
                                options={[
                                    { value: 'jarvis', label: 'Jarvis (Male)' },
                                    { value: 'friday', label: 'Friday (Female)' },
                                    { value: 'edith', label: 'EDITH (Neutral)' }
                                ]}
                                className="w-full text-sm py-2"
                            />
                        </div>

                        <div className="space-y-3 col-span-1 md:col-span-2 pt-1">
                            <div className="flex justify-between items-end">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">System Volume</label>
                                <span className="text-sm font-bold text-cyan-400">{settings.volume}%</span>
                            </div>
                            <input
                                type="range"
                                name="volume"
                                min="0"
                                max="100"
                                value={settings.volume || 80}
                                onChange={handleSettingsChange}
                                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* System Intelligence */}
                <div className="bg-[#0f0f1a]/60 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <Globe size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Intelligence</h3>
                            <p className="text-xs text-slate-500">AI Model and Language Preferences</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Preferred Model</label>
                            <GlassDropdown
                                value={settings.preferredModel || 'llama3'}
                                onChange={(val) => setSettings(prev => ({ ...prev, preferredModel: val }))}
                                options={loadingModels ? [{ value: '', label: 'Loading models...' }] : (models.length > 0 ? models.map(m => ({ value: m.id, label: `${m.displayName} (${m.provider})` })) : [{ value: 'llama3', label: 'Llama 3.1 8B (default)' }])}
                                className="w-full text-sm py-2"
                            />
                            {settings.preferredModel && models.length > 0 && (
                                <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                                    <Info size={10} />
                                    {models.find(m => m.id === settings.preferredModel)?.description || 'Selected model'}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Language</label>
                            <GlassDropdown
                                value={language}
                                onChange={setLanguage}
                                options={[
                                    { value: 'en-US', label: 'English (US)' },
                                    { value: 'en-GB', label: 'English (UK)' },
                                    { value: 'es-ES', label: 'Spanish' },
                                    { value: 'fr-FR', label: 'French' },
                                    { value: 'de-DE', label: 'German' },
                                    { value: 'hi-IN', label: 'Hindi' }
                                ]}
                                className="w-full text-sm py-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="bg-[#0f0f1a]/60 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                            <Monitor size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Appearance</h3>
                            <p className="text-xs text-slate-500">Customize UI and feedback</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Theme</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'jarvis', label: 'Default', icon: Monitor },
                                    { id: 'dark', label: 'Dark', icon: Moon },
                                    { id: 'light', label: 'Light', icon: Sun },
                                ].map(theme => (
                                    <button
                                        key={theme.id}
                                        onClick={() => setSettings(prev => ({ ...prev, theme: theme.id as any }))}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${(settings.theme || 'jarvis') === theme.id
                                                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                                                : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <theme.icon size={16} className="mb-1.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wide">{theme.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Features</label>
                            <div className="bg-black/20 border border-white/5 rounded-lg p-3 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-sm font-medium text-white block">Timestamps</span>
                                    <span className="text-[10px] text-slate-500">Show time on messages</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.showTimestamps !== false}
                                        onChange={(e) => setSettings(prev => ({ ...prev, showTimestamps: e.target.checked }))}
                                    />
                                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Save Action */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                            <Heart size={14} className="text-cyan-400" />
                        </div>
                        <div className="text-xs text-slate-600 font-mono">
                            GNANI Core v2.0.0
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        isLoading={isSaving}
                        className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] border-none px-6 py-2.5 rounded-xl transition-all"
                        leftIcon={<Save size={18} />}
                    >
                        Save All Changes
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default GeneralSection;
