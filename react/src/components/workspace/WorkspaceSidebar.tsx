import React from 'react';
import Button from '../ui/Button';
import { FileText, Box, Briefcase } from 'lucide-react';

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
    return (
        <div className="w-64 bg-[#05050a]/50 border-r border-white/5 flex flex-col h-full backdrop-blur-xl">
            <div className="p-4 border-b border-white/5">
                <h2 className="text-xs font-bold text-slate-500 tracking-[0.2em] uppercase flex items-center gap-2 pl-2">
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
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
};

export default WorkspaceSidebar;
