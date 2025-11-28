import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    User,
    Settings,
    Smartphone,
    Shield,
    Link as LinkIcon,
    Clock,
    Sliders,
    Info,
    LogOut
} from 'lucide-react';

export type SettingsTab =
    | 'profile'
    | 'assistant'
    | 'devices'
    | 'security'
    | 'accounts'
    | 'history'
    | 'preferences'
    | 'about';

interface SettingsSidebarProps {
    activeTab: SettingsTab;
    onTabChange: (tab: SettingsTab) => void;
}

const MENU_ITEMS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'assistant', label: 'Assistant', icon: Settings },
    { id: 'devices', label: 'Devices', icon: Smartphone },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'accounts', label: 'Linked Accounts', icon: LinkIcon },
    { id: 'history', label: 'Activity History', icon: Clock },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
    { id: 'about', label: 'About', icon: Info },
];

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onTabChange }) => {
    const { logout } = useAuth();

    return (
        <div className="w-64 bg-jarvis-panel border-r border-jarvis-border flex flex-col h-full">
            <div className="p-6 border-b border-jarvis-border">
                <h2 className="text-xl font-bold text-jarvis-blue tracking-wider text-glow">SETTINGS</h2>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                <ul className="space-y-1 px-2">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => onTabChange(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-300 relative overflow-hidden group ${isActive
                                        ? 'bg-gradient-to-r from-jarvis-blue/20 to-transparent text-jarvis-blue border-l-2 border-jarvis-blue shadow-[inset_0_0_20px_rgba(0,240,255,0.1)]'
                                        : 'text-jarvis-cyan/60 hover:bg-jarvis-blue/5 hover:text-jarvis-cyan'
                                        }`}
                                >
                                    {isActive && <div className="absolute inset-0 bg-jarvis-blue/5 animate-pulse" />}
                                    <Icon size={18} />
                                    <span className="font-mono tracking-wide text-sm">{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="p-4 border-t border-jarvis-border mt-auto">
                <button
                    onClick={() => {
                        logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-300 text-red-400/70 hover:bg-red-900/20 hover:text-red-400 border border-transparent hover:border-red-500/30 group"
                >
                    <LogOut size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span className="font-mono tracking-wide text-sm">LOGOUT</span>
                </button>
            </div>
        </div>
    );
};

export default SettingsSidebar;
