import type { GnaniPlugin } from '../types/plugin';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

class PluginManager {
    private plugins: Map<string, GnaniPlugin> = new Map();
    private enabledPlugins: Set<string> = new Set();

    async install(plugin: GnaniPlugin): Promise<void> {
        try {
            await plugin.onInstall?.();
            this.plugins.set(plugin.id, plugin);
            console.log(`Plugin ${plugin.name} installed successfully`);
        } catch (error) {
            console.error(`Failed to install plugin ${plugin.name}:`, error);
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
            await plugin.onUninstall?.();
            this.plugins.delete(pluginId);
            console.log(`Plugin ${plugin.name} uninstalled successfully`);
        } catch (error) {
            console.error(`Failed to uninstall plugin ${plugin.name}:`, error);
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
            console.log(`Plugin ${plugin.name} enabled`);
        } catch (error) {
            console.error(`Failed to enable plugin ${plugin.name}:`, error);
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
            console.log(`Plugin ${plugin.name} disabled`);
        } catch (error) {
            console.error(`Failed to disable plugin ${plugin.name}:`, error);
            throw error;
        }
    }

    async executeHook(hookName: keyof GnaniPlugin, ...args: any[]): Promise<any[]> {
        const results: any[] = [];

        for (const [pluginId, plugin] of this.plugins.entries()) {
            if (!this.enabledPlugins.has(pluginId)) continue;

            const hook = plugin[hookName];
            if (typeof hook === 'function') {
                try {
                    const result = await (hook as Function).apply(plugin, args);
                    results.push(result);
                } catch (error) {
                    console.error(`Plugin ${plugin.name} hook ${hookName} failed:`, error);
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
