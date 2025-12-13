import React from 'react';
import { useUserStore } from '../../store/useUserStore';
import Button from '../ui/Button';
import {
    User,
    Settings,
    Smartphone,
    Shield,
    Box,
    LogOut
} from 'lucide-react';

export type SettingsTab =
    | 'general'
    | 'personalization'
    | 'data'
    | 'security';

interface SettingsSidebarProps {
    activeTab: SettingsTab;
    onTabChange: (tab: SettingsTab) => void;
}

const MENU_ITEMS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'personalization', label: 'Personalization', icon: User },
    { id: 'data', label: 'Data & Connectors', icon: Smartphone },
    { id: 'security', label: 'Security', icon: Shield },
];

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onTabChange }) => {
    const { logout } = useUserStore();

    return (
        <div className="w-64 bg-[#05050a]/50 border-r border-white/5 flex flex-col h-full backdrop-blur-xl">
            <div className="p-4 border-b border-white/5">
                <h2 className="text-xs font-bold text-slate-500 tracking-[0.2em] uppercase flex items-center gap-2 pl-2">
                    Settings
                </h2>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-3 custom-scrollbar">
                <div className="space-y-2">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-cyan-500/10 text-cyan-400'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon size={16} strokeWidth={1.5} className={`${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-white'}`} />
                                <span className="text-sm font-medium">{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1 h-1 rounded-full bg-cyan-400" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            <div className="p-4 mt-auto border-t border-white/5">
                <Button
                    variant="ghost"
                    onClick={() => logout()}
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 border-transparent"
                    leftIcon={<LogOut size={18} className="group-hover:translate-x-1 transition-transform duration-300" />}
                >
                    Log Out
                </Button>
            </div>
        </div>
    );
};

export default SettingsSidebar;
