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
        <div className="w-64 bg-black/40 backdrop-blur-md border-r border-cyan-500/20 flex flex-col h-full">
            <div className="p-6 border-b border-cyan-500/20">
                <h2 className="text-xl font-bold text-cyan-400 tracking-wider">SETTINGS</h2>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-2">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => onTabChange(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)] border border-cyan-500/30'
                                        : 'text-cyan-400/60 hover:bg-cyan-500/10 hover:text-cyan-300'
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="p-4 border-t border-cyan-500/20 mt-auto">
                <button
                    onClick={() => {
                        logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/30"
                >
                    <LogOut size={18} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default SettingsSidebar;
