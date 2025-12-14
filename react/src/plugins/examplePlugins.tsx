import type { GnaniPlugin } from '../types/plugin';

// Example Plugin 1: Code Syntax Highlighting
export const CodeHighlightPlugin: GnaniPlugin = {
    id: 'code-highlight',
    name: 'Code Syntax Highlighting',
    version: '1.0.0',
    author: 'Gnani Team',
    description: 'Automatically highlights code blocks in messages',
    icon: '🎨',
    enabled: false,

    onInstall: async () => {
        console.log('Code Highlight Plugin installed');
    },

    onMessageReceived: async (message) => {
        // Add syntax highlighting to code blocks
        if (message.type === 'gnani' && message.message.includes('```')) {
            // Simple code block detection
            message.message = message.message.replace(
                /```(\w+)?\n([\s\S]*?)```/g,
                (_match: string, lang: string, code: string) => {
                    return `<pre class="code-highlight" data-lang="${lang || 'text'}"><code>${code}</code></pre>`;
                }
            );
        }
        return message;
    },

    renderSettings: () => (
        <div className="p-4">
            <h3 className="text-gnani-primary font-semibold mb-2">Code Highlighting Settings</h3>
            <div className="space-y-2">
                <label className="block text-sm text-gnani-primary/80">
                    Theme
                    <select className="w-full mt-1 px-2 py-1 bg-canvas-surface border border-gnani-primary/30 rounded text-gnani-primary">
                        <option>Dark Theme</option>
                        <option>Light Theme</option>
                        <option>Monokai</option>
                    </select>
                </label>
            </div>
        </div>
    ),
};

// Example Plugin 2: Message Timestamps
export const TimestampPlugin: GnaniPlugin = {
    id: 'message-timestamps',
    name: 'Message Timestamps',
    version: '1.0.0',
    author: 'Gnani Team',
    description: 'Shows detailed timestamps for all messages',
    icon: '⏰',
    enabled: false,

    onMessageRendered: async (message) => {
        // Add timestamp metadata
        if (!message.metadata) {
            message.metadata = {};
        }
        message.metadata.showTimestamp = true;
        return message;
    },

    renderMessageAction: (message) => (
        <span className="text-xs text-type-muted">
            {new Date(message.timestamp).toLocaleTimeString()}
        </span>
    ),
};

// Example Plugin 3: Auto-Save
export const AutoSavePlugin: GnaniPlugin = {
    id: 'auto-save',
    name: 'Auto-Save Conversations',
    version: '1.0.0',
    author: 'Gnani Team',
    description: 'Automatically saves conversations every 30 seconds',
    icon: '💾',
    enabled: false,
    config: {
        interval: 30000, // 30 seconds
    },

    onEnable: async () => {
        console.log('Auto-save enabled');
        // Start auto-save interval
    },

    onDisable: async () => {
        console.log('Auto-save disabled');
        // Stop auto-save interval
    },

    renderSettings: () => (
        <div className="p-4">
            <h3 className="text-gnani-primary font-semibold mb-2">Auto-Save Settings</h3>
            <div className="space-y-2">
                <label className="block text-sm text-gnani-primary/80">
                    Save Interval (seconds)
                    <input
                        type="number"
                        defaultValue={30}
                        min={10}
                        max={300}
                        className="w-full mt-1 px-2 py-1 bg-canvas-surface border border-gnani-primary/30 rounded text-gnani-primary"
                    />
                </label>
            </div>
        </div>
    ),
};

// Export all example plugins
export const EXAMPLE_PLUGINS: GnaniPlugin[] = [
    CodeHighlightPlugin,
    TimestampPlugin,
    AutoSavePlugin,
];
