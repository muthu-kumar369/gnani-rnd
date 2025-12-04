import React, { useState } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';
import type { ISettings } from '../../../types/user';
import SectionHeader from '../SectionHeader';
import { Save, Volume2, Mic, Keyboard } from 'lucide-react';
import Loader from '../../ui/Loader';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import axios from 'axios';

interface ModelOption {
    id: string;
    displayName: string;
    description?: string;
    provider: string;
}

const AssistantSettingsSection: React.FC = () => {
    const { user, updateSettings, loading } = useUserStore();
    const { addToast } = useToast();
    const [settings, setSettings] = useState<Partial<ISettings>>(user?.settings || {});
    const [isSaving, setIsSaving] = useState(false);
    const [models, setModels] = useState<ModelOption[]>([]);
    const [loadingModels, setLoadingModels] = useState(true);

    if (loading || !user) return <div className="flex justify-center p-8"><Loader text="Loading settings..." /></div>;

    // Fetch available models on mount
    React.useEffect(() => {
        const fetchModels = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/llm/models');
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'range' ? Number(value) : value;
        setSettings(prev => ({ ...prev, [name]: val }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSettings(settings);
            addToast('Settings saved successfully', 'success');
        } catch (error) {
            addToast('Failed to save settings', 'error');
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
                <Card title="Voice & Audio" action={<Volume2 size={18} className="text-jarvis-cyan/70" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-mono text-jarvis-cyan/70 uppercase tracking-wider ml-1">Wake Word</label>
                            <Input
                                name="wakeWord"
                                value={settings.wakeWord || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-mono text-jarvis-cyan/70 uppercase tracking-wider ml-1">Preferred Voice</label>
                            <select
                                name="preferredVoice"
                                value={settings.preferredVoice || 'jarvis'}
                                onChange={handleChange}
                                className="w-full bg-jarvis-panel border-b-2 border-jarvis-border px-4 py-2 text-sm text-jarvis-text focus:outline-none focus:border-jarvis-blue focus:shadow-[0_4px_10px_-4px_rgba(0,240,255,0.3)] transition-all duration-300 rounded-t-sm"
                            >
                                <option value="jarvis">Jarvis (Male)</option>
                                <option value="friday">Friday (Female)</option>
                                <option value="edith">EDITH (Neutral)</option>
                            </select>
                        </div>
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <div className="flex justify-between">
                                <label className="text-xs font-mono text-jarvis-cyan/70 uppercase tracking-wider ml-1">Volume</label>
                                <span className="text-sm font-mono text-jarvis-blue">{settings.volume}%</span>
                            </div>
                            <input
                                type="range"
                                name="volume"
                                min="0"
                                max="100"
                                value={settings.volume || 80}
                                onChange={handleChange}
                                className="w-full h-1 bg-jarvis-border rounded-lg appearance-none cursor-pointer accent-jarvis-blue hover:accent-jarvis-cyan"
                            />
                        </div>
                    </div>
                </Card>

                {/* Appearance */}
                <Card title="Appearance" action={<Mic size={18} className="text-jarvis-cyan/70" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-mono text-jarvis-cyan/70 uppercase tracking-wider ml-1">Theme</label>
                            <select
                                name="theme"
                                value={settings.theme || 'jarvis'}
                                onChange={handleChange}
                                className="w-full bg-jarvis-panel border-b-2 border-jarvis-border px-4 py-2 text-sm text-jarvis-text focus:outline-none focus:border-jarvis-blue focus:shadow-[0_4px_10px_-4px_rgba(0,240,255,0.3)] transition-all duration-300 rounded-t-sm"
                            >
                                <option value="jarvis">Jarvis HUD (Default)</option>
                                <option value="dark">Dark Mode</option>
                                <option value="light">Light Mode</option>
                                <option value="system">System Default</option>
                            </select>
                        </div>

                        {/* Timestamp Visibility Toggle */}
                        <div className="space-y-1">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name="showTimestamps"
                                    checked={settings.showTimestamps !== false} // Default to true
                                    onChange={(e) => setSettings(prev => ({ ...prev, showTimestamps: e.target.checked }))}
                                    className="w-4 h-4 bg-jarvis-panel border-2 border-jarvis-border rounded checked:bg-jarvis-blue checked:border-jarvis-blue focus:outline-none focus:ring-2 focus:ring-jarvis-blue/50 cursor-pointer transition-all"
                                />
                                <span className="text-xs font-mono text-jarvis-cyan/70 uppercase tracking-wider group-hover:text-jarvis-cyan transition-colors">
                                    Show Message Timestamps
                                </span>
                            </label>
                            <p className="text-[10px] text-jarvis-text/50 ml-7 font-mono">
                                Display relative timestamps on messages (e.g., "2 minutes ago")
                            </p>
                        </div>
                    </div>
                </Card>

                {/* LLM Model Selection */}
                <Card title="Language Model" action={<Mic size={18} className="text-jarvis-cyan/70" />}>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-mono text-jarvis-cyan/70 uppercase tracking-wider ml-1">Preferred Model</label>
                            <select
                                name="preferredModel"
                                value={settings.preferredModel || 'llama3'}
                                onChange={handleChange}
                                disabled={loadingModels}
                                className="w-full bg-jarvis-panel border-b-2 border-jarvis-border px-4 py-2 text-sm text-jarvis-text focus:outline-none focus:border-jarvis-blue focus:shadow-[0_4px_10px_-4px_rgba(0,240,255,0.3)] transition-all duration-300 rounded-t-sm disabled:opacity-50"
                            >
                                {loadingModels ? (
                                    <option>Loading models...</option>
                                ) : models.length > 0 ? (
                                    models.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.displayName} ({model.provider})
                                        </option>
                                    ))
                                ) : (
                                    <option value="llama3">Llama 3.1 8B (default)</option>
                                )}
                            </select>
                            {settings.preferredModel && models.length > 0 && (
                                <p className="text-xs text-jarvis-cyan/50 mt-2 ml-1">
                                    {models.find(m => m.id === settings.preferredModel)?.description || 'Selected model'}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Shortcuts */}
                <Card title="Keyboard Shortcuts" action={<Keyboard size={18} className="text-jarvis-cyan/70" />}>
                    <div className="space-y-4">
                        {!settings.shortcuts || Object.keys(settings.shortcuts).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="p-3 bg-jarvis-blue/5 rounded-sm border border-jarvis-border/30 mb-3">
                                    <Keyboard size={24} className="text-jarvis-cyan/40" />
                                </div>
                                <p className="text-jarvis-cyan/60 font-mono text-sm">
                                    No keyboard shortcuts configured.
                                </p>
                            </div>
                        ) : (
                            settings.shortcuts && Object.entries(settings.shortcuts).map(([key, action]) => (
                                <div key={key} className="flex items-center justify-between bg-jarvis-bg/50 p-3 rounded-sm border border-jarvis-border/30">
                                    <span className="text-jarvis-text capitalize font-mono text-sm">{action}</span>
                                    <code className="bg-jarvis-blue/10 px-2 py-1 rounded text-jarvis-blue text-xs border border-jarvis-blue/30 font-mono">{key}</code>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t border-jarvis-border">
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

export default AssistantSettingsSection;
