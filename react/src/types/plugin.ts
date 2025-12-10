import React from 'react';

export interface GnaniPlugin {
    id: string;
    name: string;
    version: string;
    author: string;
    description?: string;
    icon?: string;
    enabled: boolean;

    // Lifecycle hooks
    onInstall?: () => Promise<void>;
    onUninstall?: () => Promise<void>;
    onEnable?: () => Promise<void>;
    onDisable?: () => Promise<void>;

    // Message hooks
    onMessageSent?: (message: any) => Promise<any>;
    onMessageReceived?: (message: any) => Promise<any>;
    onMessageRendered?: (message: any) => Promise<any>;

    // UI hooks
    renderSettings?: () => React.ReactNode;
    renderMessageAction?: (message: any) => React.ReactNode;
    renderSidebarWidget?: () => React.ReactNode;

    // Configuration
    config?: Record<string, any>;
}

export interface PluginMetadata {
    id: string;
    name: string;
    version: string;
    author: string;
    description: string;
    icon: string;
    category: 'productivity' | 'utility' | 'integration' | 'ui' | 'other';
    downloads: number;
    rating: number;
    installed: boolean;
    enabled: boolean;
}
