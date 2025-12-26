import React from 'react';
import Button from '../ui/Button';
import { FileText, Box, Briefcase } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export type WorkspaceTab = 'templates' | 'tools';

interface WorkspaceSidebarProps {
    activeTab: WorkspaceTab;
    onTabChange: (tab: WorkspaceTab) => void;
}

const MENU_ITEMS: { id: WorkspaceTab; label: string; icon: React.ElementType }[] = [
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'tools', label: 'Tools', icon: Box },
];

const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ activeTab, onTabChange }) => {
    const { theme } = useThemeStore();
    return (
        <div className={`w-64 flex flex-col h-full backdrop-blur-xl relative z-10 ${theme === 'dark' ? 'bg-black/20' : 'bg-gray-50/80 shadow-[4px_0_24px_rgba(0,0,0,0.08)]'}`}>
            <div className="p-6 pb-2">
                <h2 className="text-xs font-bold text-type-muted tracking-[0.2em] uppercase flex items-center gap-2 pl-2">
                    Workspace
                </h2>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-3 custom-scrollbar">
                <ul className="space-y-2">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <li key={item.id}>
                                <button
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group ${isActive
                                        ? (theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/10 text-blue-600')
                                        : (theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5')
                                        }`}
                                    onClick={() => onTabChange(item.id)}
                                >
                                    <Icon size={16} strokeWidth={1.5} className={`${isActive ? (theme === 'dark' ? 'text-cyan-400' : 'text-blue-600') : (theme === 'dark' ? 'text-gray-500 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-900')}`} />
                                    <span className="text-sm font-medium">{item.label}</span>
                                    {isActive && (
                                        <div className={`ml-auto w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(var(--gnani-primary),0.5)] ${theme === 'dark' ? 'bg-cyan-400' : 'bg-blue-600'}`} />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
};

export default WorkspaceSidebar;
