# Stage 28: Plugins System

## Overview
Create plugin API and marketplace for extending Gnani functionality.

## Implementation Steps

### Step 1: Define Plugin API
```typescript
interface GnaniPlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  
  // Lifecycle hooks
  onInstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
  onEnable?: () => Promise<void>;
  onDisable?: () => Promise<void>;
  
  // Message hooks
  onMessageSent?: (message: Message) => Promise<Message>;
  onMessageReceived?: (message: Message) => Promise<Message>;
  
  // UI hooks
  renderSettings?: () => React.ReactNode;
  renderMessageAction?: (message: Message) => React.ReactNode;
}
```

### Step 2: Plugin Manager
```typescript
class PluginManager {
  private plugins: Map<string, GnaniPlugin> = new Map();
  
  async install(plugin: GnaniPlugin) {
    await plugin.onInstall?.();
    this.plugins.set(plugin.id, plugin);
  }
  
  async uninstall(pluginId: string) {
    const plugin = this.plugins.get(pluginId);
    await plugin?.onUninstall?.();
    this.plugins.delete(pluginId);
  }
  
  async executeHook(hookName: string, ...args: any[]) {
    for (const plugin of this.plugins.values()) {
      const hook = plugin[hookName];
      if (hook) await hook(...args);
    }
  }
}
```

### Step 3: Example Plugin
```typescript
const CodeHighlightPlugin: GnaniPlugin = {
  id: 'code-highlight',
  name: 'Code Syntax Highlighting',
  version: '1.0.0',
  author: 'Gnani Team',
  
  onMessageReceived: async (message) => {
    if (message.type === 'gnani') {
      message.message = highlightCodeBlocks(message.message);
    }
    return message;
  },
  
  renderSettings: () => (
    <div>
      <h3>Code Highlighting Settings</h3>
      <select>
        <option>Dark Theme</option>
        <option>Light Theme</option>
      </select>
    </div>
  )
};
```

### Step 4: Plugin Marketplace
```tsx
const PluginMarketplace = () => {
  const [plugins, setPlugins] = useState([]);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {plugins.map(plugin => (
        <PluginCard
          key={plugin.id}
          plugin={plugin}
          onInstall={() => installPlugin(plugin)}
        />
      ))}
    </div>
  );
};
```

## Success Criteria
- ✅ Plugin API well-defined
- ✅ Plugins can be installed/uninstalled
- ✅ Hooks execute correctly
- ✅ Marketplace shows available plugins

## Estimated Time: 16 hours
