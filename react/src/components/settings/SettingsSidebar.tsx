import React from 'react';
import { useUserStore } from '../../store/useUserStore';
import Button from '../ui/Button';
import {
    User,
    Settings,
    Smartphone,
    Shield,
    Link as LinkIcon,
    Clock,
    Sliders,
    Info,
    LogOut,
    Keyboard,
    Box,
    FileText
} from 'lucide-react';

export type SettingsTab =
    | 'profile'
    | 'assistant'
    | 'devices'
    | 'security'
    | 'accounts'
    | 'history'
    | 'preferences'
    | 'hotkey'
    | 'about'
    | 'avatar'
    | 'tools'
    | 'templates';

interface SettingsSidebarProps {
    activeTab: SettingsTab;
    onTabChange: (tab: SettingsTab) => void;
}

const MENU_ITEMS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'assistant', label: 'Assistant', icon: Settings },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'tools', label: 'Tools', icon: Box },
    { id: 'devices', label: 'Devices', icon: Smartphone },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'accounts', label: 'Linked Accounts', icon: LinkIcon },
    { id: 'history', label: 'Activity History', icon: Clock },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
    { id: 'hotkey', label: 'Hotkey', icon: Keyboard },
    { id: 'about', label: 'About', icon: Info },
    { id: 'avatar', label: 'Avatar', icon: User },
];

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onTabChange }) => {
    const { logout } = useUserStore();

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
                                <Button
                                    variant={isActive ? 'primary' : 'ghost'}
                                    onClick={() => onTabChange(item.id)}
                                    className={`w-full justify-start ${isActive ? 'bg-gradient-to-r from-jarvis-blue/20 to-transparent border-l-2 border-y-0 border-r-0 border-l-jarvis-blue' : ''}`}
                                    leftIcon={<Icon size={18} />}
                                >
                                    {item.label}
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="p-4 border-t border-jarvis-border mt-auto">
                <Button
                    variant="danger"
                    onClick={() => logout()}
                    className="w-full justify-start"
                    leftIcon={<LogOut size={18} className="group-hover:rotate-90 transition-transform duration-300" />}
                >
                    LOGOUT
                </Button>
            </div>
        </div>
    );
};

export default SettingsSidebar;
