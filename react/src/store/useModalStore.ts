import { create } from 'zustand';
import { type WorkspaceTab } from '../components/workspace/WorkspaceSidebar';
import { type SettingsTab } from '../components/settings/SettingsSidebar';

export type { WorkspaceTab, SettingsTab };

interface ModalState {
    showWorkspace: boolean;
    workspaceTab: WorkspaceTab;
    showSettings: boolean;
    settingsTab: SettingsTab;

    openWorkspace: (tab?: WorkspaceTab) => void;
    closeWorkspace: () => void;
    openSettings: (tab?: SettingsTab) => void;
    closeSettings: () => void;
    closeAll: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
    showWorkspace: false,
    workspaceTab: 'templates',
    showSettings: false,
    settingsTab: 'general',

    openWorkspace: (tab = 'templates') => set({ showWorkspace: true, workspaceTab: tab, showSettings: false }),
    closeWorkspace: () => set({ showWorkspace: false }),
    openSettings: (tab = 'general') => set({ showSettings: true, settingsTab: tab, showWorkspace: false }),
    closeSettings: () => set({ showSettings: false }),
    closeAll: () => set({ showWorkspace: false, showSettings: false })
}));
