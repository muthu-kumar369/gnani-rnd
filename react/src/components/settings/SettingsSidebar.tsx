import React from 'react';
import { useUserStore } from '../../store/useUserStore';
import { useThemeStore } from '../../store/themeStore';
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
    const { theme } = useThemeStore();

    return (
        <div className={`w-64 flex flex-col h-full backdrop-blur-xl relative z-10 ${theme === 'dark' ? 'bg-black/20' : 'bg-gray-50/80 shadow-[4px_0_24px_rgba(0,0,0,0.08)]'}`}>
            <div className="p-6 pb-2">
                <h2 className="text-xs font-bold text-type-muted tracking-[0.2em] uppercase flex items-center gap-2 pl-2">
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
                                    ? (theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/10 text-blue-600')
                                    : (theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5')
                                    }`}
                            >
                                <Icon size={16} strokeWidth={1.5} className={`${isActive ? (theme === 'dark' ? 'text-cyan-400' : 'text-blue-600') : (theme === 'dark' ? 'text-gray-500 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-900')}`} />
                                <span className="text-sm font-medium">{item.label}</span>
                                {isActive && (
                                    <div className={`ml-auto w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(var(--gnani-primary),0.5)] ${theme === 'dark' ? 'bg-cyan-400' : 'bg-blue-600'}`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            <div className={`p-4 mt-auto border-t ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
                <Button
                    variant="ghost"
                    onClick={() => logout()}
                    className={`w-full justify-start border-transparent group transition-all duration-300 ${theme === 'dark'
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300'
                        : 'bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700'
                        }`}
                    leftIcon={<LogOut size={18} className={`transition-transform duration-300 group-hover:-translate-x-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} />}
                >
                    Log Out
                </Button>
            </div>
        </div>
    );
};

export default SettingsSidebar;
