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
        <div className="w-64 bg-canvas-panel/50 border-r border-glass-border flex flex-col h-full backdrop-blur-xl">
            <div className="p-4 border-b border-glass-border">
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
                                    ? 'bg-gnani-primary/10 text-gnani-primary'
                                    : 'text-type-secondary hover:text-type-primary hover:bg-glass-shimmer'
                                    }`}
                            >
                                <Icon size={16} strokeWidth={1.5} className={`${isActive ? 'text-gnani-primary' : 'text-type-muted group-hover:text-type-primary'}`} />
                                <span className="text-sm font-medium">{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1 h-1 rounded-full bg-gnani-primary" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            <div className="p-4 mt-auto border-t border-glass-border">
                <Button
                    variant="ghost"
                    onClick={() => logout()}
                    className="w-full justify-start text-status-error hover:text-status-error hover:bg-status-error/10 border-transparent"
                    leftIcon={<LogOut size={18} className="group-hover:translate-x-1 transition-transform duration-300" />}
                >
                    Log Out
                </Button>
            </div>
        </div>
    );
};

export default SettingsSidebar;
