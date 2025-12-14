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
        <div className="w-64 bg-canvas-sidebar/50 border-r border-line-base flex flex-col h-full backdrop-blur-xl">
            <div className="p-4 border-b border-line-base">
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
                                        ? 'bg-gnani-primary/10 text-gnani-primary'
                                        : 'text-type-muted hover:text-type-primary hover:bg-glass-hover'
                                        }`}
                                >
                                    <Icon size={16} strokeWidth={1.5} className={`${isActive ? 'text-gnani-primary' : 'text-type-muted group-hover:text-type-primary'}`} />
                                    <span className="text-sm font-medium">{item.label}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1 h-1 rounded-full bg-gnani-primary" />
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
