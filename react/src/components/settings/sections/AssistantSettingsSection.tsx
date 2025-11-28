import React, { useState } from 'react';
import { useUser } from '../../../context/UserContext';
import { useToast } from '../../../context/ToastContext';
import type { ISettings } from '../../../types/user';
import SectionHeader from '../SectionHeader';
import { Save, Volume2, Mic, Keyboard } from 'lucide-react';
import Loader from '../../ui/Loader';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Card from '../../ui/Card';

const AssistantSettingsSection: React.FC = () => {
    const { user, updateSettings, loading } = useUser();
    const { addToast } = useToast();
    const [settings, setSettings] = useState<Partial<ISettings>>(user?.settings || {});
    const [isSaving, setIsSaving] = useState(false);

    if (loading || !user) return <div className="flex justify-center p-8"><Loader text="Loading settings..." /></div>;

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
                        <Input
                            label="Wake Word"
                            name="wakeWord"
                            value={settings.wakeWord || ''}
                            onChange={handleChange}
                        />
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
                    </div>
                </Card>

                {/* Shortcuts */}
                <Card title="Keyboard Shortcuts" action={<Keyboard size={18} className="text-jarvis-cyan/70" />}>
                    <div className="space-y-4">
                        {settings.shortcuts && Object.entries(settings.shortcuts).map(([key, action]) => (
                            <div key={key} className="flex items-center justify-between bg-jarvis-bg/50 p-3 rounded-sm border border-jarvis-border/30">
                                <span className="text-jarvis-text capitalize font-mono text-sm">{action}</span>
                                <code className="bg-jarvis-blue/10 px-2 py-1 rounded text-jarvis-blue text-xs border border-jarvis-blue/30 font-mono">{key}</code>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t border-jarvis-border">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    isLoading={isSaving}
                    icon={<Save size={18} />}
                >
                    Save Changes
                </Button>
            </div>
        </div>
    );
};

export default AssistantSettingsSection;
