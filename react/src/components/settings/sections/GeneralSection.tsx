import React, { useState } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';
import type { ISettings } from '../../../types/user';
import { Save, Volume2, Mic, Globe, Info, Code, Heart, Check, Monitor, Moon, Sun } from 'lucide-react';
import Loader from '../../ui/Loader';
import Button from '../../ui/Button';
import axios from 'axios';
import GlassDropdown from '../../ui/GlassDropdown';
import { useThemeStore } from '../../../store/themeStore';

interface ModelOption {
    id: string;
    displayName: string;
    description?: string;
    provider: string;
}

const GeneralSection: React.FC = () => {
    const { user, loading, updateSettings, updateProfile } = useUserStore();
    const { addToast } = useToast();
    const { theme } = useThemeStore();
    const [settings, setSettings] = useState<Partial<ISettings>>(user?.settings || {});
    const [models, setModels] = useState<ModelOption[]>([]);
    const [loadingModels, setLoadingModels] = useState(true);

    if (loading && !user) return <div className="flex justify-center p-8"><Loader text="Loading settings..." /></div>;
    if (!user) return null;

    const [voices, setVoices] = useState<any[]>([]);
    const [loadingVoices, setLoadingVoices] = useState(true);


    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [modelsRes, voicesRes] = await Promise.all([
                    axios.get('http://localhost:3000/api/v1/llm/models'),
                    axios.get('http://localhost:3000/api/v1/user/voices', {
                        headers: { 'x-auth-token': localStorage.getItem('accessToken') || '' }
                    })
                ]);
                setModels(modelsRes.data.models || []);
                setVoices(voicesRes.data.voices || []);
            } catch (error) {
                console.error('Failed to fetch data:', error);
                addToast('Failed to load options', 'error');
            } finally {
                setLoadingModels(false);
                setLoadingVoices(false);
            }
        };
        fetchData();
    }, [addToast]);



    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setSettings(prev => ({ ...prev, volume: val }));

        // Debounce update for volume
        const timeoutId = setTimeout(() => {
            updateSettings({ volume: val }).catch(() => addToast('Failed to update volume', 'error'));
        }, 500);
        return () => clearTimeout(timeoutId);
    };

    const handleSettingUpdate = async (key: keyof ISettings, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        try {
            await updateSettings({ [key]: value });
            if (key === 'theme') {
                // Theme might need extra handling if not reactive immediately, but store handles it
            }
        } catch (error) {
            addToast(`Failed to update ${key}`, 'error');
        }
    };

    return (
        <div className="flex flex-col h-full relative">
            <div className="flex-1 overflow-y-auto px-8 pt-8 pb-8 space-y-6 custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid gap-6">
                    {/* Voice & Audio */}
                    <div className={`${theme === 'dark' ? 'bg-[#1a2639] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] ring-white/5' : 'bg-white shadow-sm ring-black/5'} rounded-xl p-5 ring-1 backdrop-blur-sm transition-all hover:shadow-md`}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-gnani-primary/10 rounded-lg text-gnani-primary">
                                <Volume2 size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-type-primary">Voice & Audio</h3>
                                <p className="text-xs text-type-muted">Configure interactions and output volume</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div className="flex flex-col gap-4 h-full">
                                <div className="h-full">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-type-secondary mb-2 h-5 pl-1">
                                        Wake Word
                                        <span className="text-[10px] bg-gnani-primary/10 text-gnani-primary px-2 py-0.5 rounded-full font-bold border border-gnani-primary/20 shadow-sm uppercase tracking-wider">Coming Soon</span>
                                    </label>
                                    <input
                                        type="text"
                                        value="Gnani"
                                        disabled
                                        className="w-full h-11 bg-gray-50/50 dark:bg-black/20 ring-1 ring-black/5 dark:ring-white/5 rounded-xl px-4 text-sm text-type-secondary focus:outline-none cursor-not-allowed opacity-70"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 h-full">
                                <div className="h-full">
                                    <label className="flex items-center h-5 mb-2 text-xs font-semibold text-type-secondary pl-1">Preferred Voice</label>
                                    <GlassDropdown
                                        value={settings.preferredVoice || 'jarvis'}
                                        onChange={(val) => handleSettingUpdate('preferredVoice', val)}
                                        options={loadingVoices ? [{ value: '', label: 'Loading voices...' }] : (voices.length > 0 ? voices.map(v => ({ value: v.id, label: `${v.name} (${v.gender})` })) : [{ value: 'jarvis', label: 'Jarvis (Default)' }])}
                                        className="w-full h-11 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 col-span-1 md:col-span-2 pt-1">
                                <div className="flex justify-between items-end pl-1 mb-2 h-5">
                                    <label className="flex items-center text-xs font-semibold text-type-secondary">System Volume</label>
                                    <span className="text-sm font-bold text-gnani-primary">{settings.volume}%</span>
                                </div>
                                <input
                                    type="range"
                                    name="volume"
                                    min="0"
                                    max="100"
                                    value={settings.volume || 80}
                                    onChange={handleVolumeChange}
                                    className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-gnani-primary hover:accent-gnani-primary/80 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* System Intelligence */}
                    <div className={`${theme === 'dark' ? 'bg-[#1a2639] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] ring-white/5' : 'bg-white shadow-sm ring-black/5'} rounded-xl p-5 ring-1 backdrop-blur-sm transition-all hover:shadow-md`}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                <Globe size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-type-primary">System Intelligence</h3>
                                <p className="text-xs text-type-muted">AI Model and Language Preferences</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="flex items-center h-5 mb-2 text-xs font-semibold text-type-secondary pl-1">Preferred Model</label>
                                    <GlassDropdown
                                        value={settings.preferredModel || 'llama3'}
                                        onChange={(val) => handleSettingUpdate('preferredModel', val)}
                                        options={loadingModels ? [{ value: '', label: 'Loading models...' }] : (models.length > 0 ? models.map(m => ({ value: m.id, label: `${m.displayName} (${m.provider})` })) : [{ value: 'llama3', label: 'Llama 3.1 8B (default)' }])}
                                        className="w-full h-11 text-sm"
                                    />
                                    {settings.preferredModel && models.length > 0 && (
                                        <p className="text-[10px] text-type-muted mt-1.5 flex items-center gap-1 pl-1">
                                            <Info size={10} />
                                            {models.find(m => m.id === settings.preferredModel)?.description || 'Selected model'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                {/* Language - Disabled */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-semibold text-type-secondary mb-2 h-5 pl-1">
                                        Language
                                        <span className="text-[10px] bg-gnani-primary/10 text-gnani-primary px-2 py-0.5 rounded-full font-bold border border-gnani-primary/20 shadow-sm uppercase tracking-wider">Coming Soon</span>
                                    </label>
                                    <div className="relative">
                                        <GlassDropdown
                                            options={[
                                                { value: 'en', label: 'English' },
                                                { value: 'es', label: 'Spanish' },
                                                { value: 'fr', label: 'French' }
                                            ]}
                                            value="en"
                                            onChange={() => { }}
                                            disabled={true}
                                            className="w-full h-11"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className={`${theme === 'dark' ? 'bg-[#1a2639] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] ring-white/5' : 'bg-white shadow-sm ring-black/5'} rounded-xl p-5 ring-1 backdrop-blur-sm transition-all hover:shadow-md`}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                                <Monitor size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-type-primary">Appearance</h3>
                                <p className="text-xs text-type-muted">Customize UI and feedback</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div className="flex flex-col gap-4 h-full">
                                <div className="h-full">
                                    <label className="flex items-center h-5 mb-2 text-xs font-semibold text-type-secondary pl-1">Theme</label>
                                    <GlassDropdown
                                        value={settings.theme || 'jarvis'}
                                        onChange={(val) => handleSettingUpdate('theme', val as any)}
                                        options={[
                                            { value: 'jarvis', label: 'Default', icon: <Monitor size={14} /> },
                                            { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
                                            { value: 'light', label: 'Light', icon: <Sun size={14} /> }
                                        ]}
                                        className="w-full h-11 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 h-full">
                                <div className="h-full">
                                    <label className="flex items-center h-5 mb-2 text-xs font-semibold text-type-muted pl-1">Features</label>
                                    <div className="flex items-center justify-between gap-2 px-4 rounded-xl border border-glass-border bg-canvas-surface/40 h-11 transition-all hover:bg-glass-shimmer hover:border-gnani-primary/30 hover:text-type-primary text-type-secondary">
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-medium block">Timestamps</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.showTimestamps !== false}
                                                onChange={(e) => handleSettingUpdate('showTimestamps', e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gnani-primary/20 dark:peer-focus:ring-gnani-primary/30 rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:shadow-sm after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500 transition-all cursor-pointer"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralSection;
