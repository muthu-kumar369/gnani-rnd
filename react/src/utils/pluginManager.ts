import type { GnaniPlugin } from '../types/plugin';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { pluginWorkerManager } from './pluginWorker';
import { pluginPermissionManager, type PluginPermissionRequest } from './pluginPermissions';
import errorLogger from './errorLogger';

class PluginManager {
    private plugins: Map<string, GnaniPlugin> = new Map();
    private enabledPlugins: Set<string> = new Set();

    async install(plugin: GnaniPlugin): Promise<void> {
        try {
            // STAGE R3: Request Permissions
            if (plugin.requiredPermissions) {
                const request: PluginPermissionRequest = {
                    pluginId: plugin.id,
                    pluginName: plugin.name,
                    permissions: plugin.requiredPermissions
                };

                // This awaits user approval via dialog
                const granted = await pluginPermissionManager.requestPermissions(request);
                errorLogger.info(`Permissions granted for ${plugin.name}`, { context: 'PluginManager', extra: { granted } });

                // STAGE R3: Load into Web Worker if code provided
                if (plugin.code) {
                    await pluginWorkerManager.loadPlugin(plugin.id, plugin.code, granted);
                }
            }

            await plugin.onInstall?.();
            this.plugins.set(plugin.id, plugin);
            errorLogger.info(`Plugin ${plugin.name} installed successfully`, { context: 'PluginManager' });
        } catch (error) {
            errorLogger.error(`Failed to install plugin ${plugin.name}`, error, { context: 'PluginManager' });
            throw error;
        }
    }

    async uninstall(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        try {
            if (this.enabledPlugins.has(pluginId)) {
                await this.disable(pluginId);
            }

            // STAGE R3: Cleanup Worker and Permissions
            if (plugin.code) {
                pluginWorkerManager.unloadPlugin(pluginId);
            }
            pluginPermissionManager.revokePermissions(pluginId);

            await plugin.onUninstall?.();
            this.plugins.delete(pluginId);
            errorLogger.info(`Plugin ${plugin.name} uninstalled successfully`, { context: 'PluginManager' });
        } catch (error) {
            errorLogger.error(`Failed to uninstall plugin ${plugin.name}`, error, { context: 'PluginManager' });
            throw error;
        }
    }

    async enable(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        try {
            await plugin.onEnable?.();
            this.enabledPlugins.add(pluginId);
            plugin.enabled = true;
            errorLogger.info(`Plugin ${plugin.name} enabled`, { context: 'PluginManager' });
        } catch (error) {
            errorLogger.error(`Failed to enable plugin ${plugin.name}`, error, { context: 'PluginManager' });
            throw error;
        }
    }

    async disable(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        try {
            await plugin.onDisable?.();
            this.enabledPlugins.delete(pluginId);
            plugin.enabled = false;
            errorLogger.info(`Plugin ${plugin.name} disabled`, { context: 'PluginManager' });
        } catch (error) {
            errorLogger.error(`Failed to disable plugin ${plugin.name}`, error, { context: 'PluginManager' });
            throw error;
        }
    }

    async executeHook(hookName: keyof GnaniPlugin, ...args: any[]): Promise<any[]> {
        const results: any[] = [];

        for (const [pluginId, plugin] of this.plugins.entries()) {
            if (!this.enabledPlugins.has(pluginId)) continue;

            // STAGE R3: Sandboxed Execution
            if (plugin.code) {
                try {
                    // Execute in Web Worker
                    const result = await pluginWorkerManager.executePlugin(pluginId, hookName as string, args);
                    results.push(result);
                } catch (error) {
                    errorLogger.error(`Plugin ${plugin.name} (worker) hook ${hookName} failed`, error, { context: 'PluginManager' });
                }
                continue;
            }

            // Legacy Execution (Main Thread)
            const hook = plugin[hookName];
            if (typeof hook === 'function') {
                try {
                    const result = await (hook as Function).apply(plugin, args);
                    results.push(result);
                } catch (error) {
                    errorLogger.error(`Plugin ${plugin.name} hook ${hookName} failed`, error, { context: 'PluginManager' });
                }
            }
        }

        return results;
    }

    getPlugin(pluginId: string): GnaniPlugin | undefined {
        return this.plugins.get(pluginId);
    }

    getAllPlugins(): GnaniPlugin[] {
        return Array.from(this.plugins.values());
    }

    getEnabledPlugins(): GnaniPlugin[] {
        return Array.from(this.plugins.values()).filter((p) => this.enabledPlugins.has(p.id));
    }
}

export const pluginManager = new PluginManager();

// Zustand store for plugin state
interface PluginState {
    installedPlugins: string[];
    enabledPlugins: string[];
    installPlugin: (pluginId: string) => Promise<void>;
    uninstallPlugin: (pluginId: string) => Promise<void>;
    enablePlugin: (pluginId: string) => Promise<void>;
    disablePlugin: (pluginId: string) => Promise<void>;
}

export const usePluginStore = create<PluginState>()(
    persist(
        (set, get) => ({
            installedPlugins: [],
            enabledPlugins: [],

            installPlugin: async (pluginId: string) => {
                // Plugin installation logic handled by PluginManager
                set((state) => ({
                    installedPlugins: [...state.installedPlugins, pluginId],
                }));
            },

            uninstallPlugin: async (pluginId: string) => {
                set((state) => ({
                    installedPlugins: state.installedPlugins.filter((id) => id !== pluginId),
                    enabledPlugins: state.enabledPlugins.filter((id) => id !== pluginId),
                }));
            },

            enablePlugin: async (pluginId: string) => {
                await pluginManager.enable(pluginId);
                set((state) => ({
                    enabledPlugins: [...state.enabledPlugins, pluginId],
                }));
            },

            disablePlugin: async (pluginId: string) => {
                await pluginManager.disable(pluginId);
                set((state) => ({
                    enabledPlugins: state.enabledPlugins.filter((id) => id !== pluginId),
                }));
            },
        }),
        {
            name: 'gnani-plugins',
        }
    )
);
