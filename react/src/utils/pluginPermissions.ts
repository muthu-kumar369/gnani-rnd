// react/src/utils/pluginPermissions.ts

export interface PluginPermissionRequest {
    pluginId: string;
    pluginName: string;
    permissions: {
        api?: { reason: string };
        storage?: { reason: string };
        notifications?: { reason: string };
        clipboard?: { reason: string };
    };
}

export interface PluginPermissionGrant {
    api: boolean;
    storage: boolean;
    notifications: boolean;
    clipboard: boolean;
}

class PluginPermissionManager {
    private grants: Map<string, PluginPermissionGrant>;

    constructor() {
        this.grants = new Map();
        this.loadGrants();
    }

    /**
     * Request permissions from user
     */
    async requestPermissions(
        request: PluginPermissionRequest
    ): Promise<PluginPermissionGrant> {
        // Check if already granted
        const existing = this.grants.get(request.pluginId);
        if (existing) {
            return existing;
        }

        // Show permission dialog
        const granted = await this.showPermissionDialog(request);

        // Store grant
        this.grants.set(request.pluginId, granted);
        this.saveGrants();

        return granted;
    }

    /**
     * Check if plugin has permission
     */
    hasPermission(pluginId: string, permission: keyof PluginPermissionGrant): boolean {
        const grant = this.grants.get(pluginId);
        return grant?.[permission] || false;
    }

    /**
     * Revoke permissions
     */
    revokePermissions(pluginId: string): void {
        this.grants.delete(pluginId);
        this.saveGrants();
    }

    /**
     * Show permission dialog
     */
    private async showPermissionDialog(
        request: PluginPermissionRequest
    ): Promise<PluginPermissionGrant> {
        // Dispatch event for React component to handle
        return new Promise((resolve) => {
            const event = new CustomEvent('plugin-permission-request', {
                detail: { request, resolve }
            });
            window.dispatchEvent(event);
        });
    }

    /**
     * Load grants from localStorage
     */
    private loadGrants(): void {
        try {
            const stored = localStorage.getItem('plugin_permissions');
            if (stored) {
                const data = JSON.parse(stored);
                this.grants = new Map(Object.entries(data));
            }
        } catch (error) {
            console.error('[PluginPermissions] Failed to load grants:', error);
        }
    }

    /**
     * Save grants to localStorage
     */
    private saveGrants(): void {
        try {
            const data = Object.fromEntries(this.grants);
            localStorage.setItem('plugin_permissions', JSON.stringify(data));
        } catch (error) {
            console.error('[PluginPermissions] Failed to save grants:', error);
        }
    }
}

export const pluginPermissionManager = new PluginPermissionManager();
