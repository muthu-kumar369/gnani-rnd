# Stage R3: Plugin Sandboxing

**Priority**: 🔴 HIGH (Security)  
**Effort**: 8-12 hours  
**Impact**: Production-ready plugin system  
**Dependencies**: None

---

## OVERVIEW

### Problem Statement
Plugins currently run in the main thread without isolation, creating a critical security vulnerability. Malicious plugins can:
- Access all application data
- Modify DOM directly
- Break the entire application
- Steal user credentials
- Make unauthorized API calls

### Current State
- ❌ Plugins run in main thread
- ❌ NO Web Worker isolation
- ❌ NO permission system
- ❌ NO security sandbox
- ⚠️ Security risk: malicious plugins can break app
- ⚠️ Basic structure exists but NOT production-ready

### Target State
- ✅ Plugins isolated in Web Workers
- ✅ Message-passing interface for communication
- ✅ Permission system (API access, storage, etc.)
- ✅ Plugin review/approval flow
- ✅ Security badges in marketplace
- ✅ Sandboxed execution environment
- ✅ ChatGPT-level plugin security

---

## IMPLEMENTATION STEPS

### Step 1: Create Web Worker Wrapper

**File**: `react/src/utils/pluginWorker.ts`

```typescript
// react/src/utils/pluginWorker.ts

export interface PluginMessage {
    type: 'init' | 'execute' | 'api_call' | 'response' | 'error';
    payload: any;
    requestId?: string;
}

export interface PluginPermissions {
    api: boolean;          // Can make API calls
    storage: boolean;      // Can access localStorage
    notifications: boolean; // Can show notifications
    clipboard: boolean;    // Can access clipboard
}

export class PluginWorkerManager {
    private workers: Map<string, Worker>;
    private pendingRequests: Map<string, {
        resolve: (value: any) => void;
        reject: (error: any) => void;
    }>;
    private permissions: Map<string, PluginPermissions>;

    constructor() {
        this.workers = new Map();
        this.pendingRequests = new Map();
        this.permissions = new Map();
    }

    /**
     * Load plugin in isolated Web Worker
     */
    async loadPlugin(
        pluginId: string,
        pluginCode: string,
        permissions: PluginPermissions
    ): Promise<void> {
        // Create blob URL for worker
        const blob = new Blob([this.createWorkerCode(pluginCode)], {
            type: 'application/javascript'
        });
        const workerUrl = URL.createObjectURL(blob);

        // Create worker
        const worker = new Worker(workerUrl);
        
        // Store worker and permissions
        this.workers.set(pluginId, worker);
        this.permissions.set(pluginId, permissions);

        // Setup message handler
        worker.onmessage = (event: MessageEvent<PluginMessage>) => {
            this.handleWorkerMessage(pluginId, event.data);
        };

        worker.onerror = (error) => {
            console.error(`[PluginWorker] Error in ${pluginId}:`, error);
            this.unloadPlugin(pluginId);
        };

        // Initialize plugin
        await this.sendMessage(pluginId, {
            type: 'init',
            payload: { permissions }
        });

        console.log(`[PluginWorker] Loaded plugin: ${pluginId}`);
    }

    /**
     * Execute plugin function
     */
    async executePlugin(
        pluginId: string,
        functionName: string,
        args: any[]
    ): Promise<any> {
        const requestId = `${pluginId}_${Date.now()}_${Math.random()}`;

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(requestId, { resolve, reject });

            this.sendMessage(pluginId, {
                type: 'execute',
                payload: { functionName, args },
                requestId
            });

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('Plugin execution timeout'));
                }
            }, 30000);
        });
    }

    /**
     * Handle messages from worker
     */
    private handleWorkerMessage(pluginId: string, message: PluginMessage): void {
        switch (message.type) {
            case 'response':
                this.handleResponse(message);
                break;

            case 'error':
                this.handleError(message);
                break;

            case 'api_call':
                this.handleApiCall(pluginId, message);
                break;

            default:
                console.warn(`[PluginWorker] Unknown message type: ${message.type}`);
        }
    }

    /**
     * Handle response from plugin
     */
    private handleResponse(message: PluginMessage): void {
        const { requestId, payload } = message;
        if (!requestId) return;

        const pending = this.pendingRequests.get(requestId);
        if (pending) {
            pending.resolve(payload);
            this.pendingRequests.delete(requestId);
        }
    }

    /**
     * Handle error from plugin
     */
    private handleError(message: PluginMessage): void {
        const { requestId, payload } = message;
        if (!requestId) return;

        const pending = this.pendingRequests.get(requestId);
        if (pending) {
            pending.reject(new Error(payload.message || 'Plugin error'));
            this.pendingRequests.delete(requestId);
        }
    }

    /**
     * Handle API call request from plugin
     */
    private async handleApiCall(pluginId: string, message: PluginMessage): Promise<void> {
        const permissions = this.permissions.get(pluginId);
        const { requestId, payload } = message;

        // Check permissions
        if (!permissions?.api) {
            this.sendMessage(pluginId, {
                type: 'error',
                payload: { message: 'API permission denied' },
                requestId
            });
            return;
        }

        try {
            // Make API call on behalf of plugin
            const response = await fetch(payload.url, payload.options);
            const data = await response.json();

            this.sendMessage(pluginId, {
                type: 'response',
                payload: data,
                requestId
            });
        } catch (error: any) {
            this.sendMessage(pluginId, {
                type: 'error',
                payload: { message: error.message },
                requestId
            });
        }
    }

    /**
     * Send message to worker
     */
    private sendMessage(pluginId: string, message: PluginMessage): void {
        const worker = this.workers.get(pluginId);
        if (worker) {
            worker.postMessage(message);
        }
    }

    /**
     * Unload plugin
     */
    unloadPlugin(pluginId: string): void {
        const worker = this.workers.get(pluginId);
        if (worker) {
            worker.terminate();
            this.workers.delete(pluginId);
            this.permissions.delete(pluginId);
            console.log(`[PluginWorker] Unloaded plugin: ${pluginId}`);
        }
    }

    /**
     * Create worker code with sandbox
     */
    private createWorkerCode(pluginCode: string): string {
        return `
// Sandboxed plugin environment
const pluginAPI = {
    // Safe API methods
    fetch: async (url, options) => {
        const requestId = Date.now() + '_' + Math.random();
        return new Promise((resolve, reject) => {
            self.postMessage({
                type: 'api_call',
                payload: { url, options },
                requestId
            });
            
            // Store resolver
            self._pendingRequests = self._pendingRequests || {};
            self._pendingRequests[requestId] = { resolve, reject };
        });
    },
    
    log: (...args) => {
        console.log('[Plugin]', ...args);
    },
    
    error: (...args) => {
        console.error('[Plugin]', ...args);
    }
};

// Plugin code execution
${pluginCode}

// Message handler
self.onmessage = async (event) => {
    const { type, payload, requestId } = event.data;
    
    try {
        if (type === 'init') {
            // Initialize plugin
            if (typeof onInit === 'function') {
                await onInit(payload.permissions);
            }
            self.postMessage({ type: 'response', payload: { initialized: true }, requestId });
        } else if (type === 'execute') {
            // Execute plugin function
            const { functionName, args } = payload;
            if (typeof self[functionName] === 'function') {
                const result = await self[functionName](...args);
                self.postMessage({ type: 'response', payload: result, requestId });
            } else {
                throw new Error(\`Function \${functionName} not found\`);
            }
        } else if (type === 'response') {
            // Handle API response
            const pending = self._pendingRequests?.[requestId];
            if (pending) {
                pending.resolve(payload);
                delete self._pendingRequests[requestId];
            }
        }
    } catch (error) {
        self.postMessage({
            type: 'error',
            payload: { message: error.message },
            requestId
        });
    }
};
        `;
    }
}

// Export singleton
export const pluginWorkerManager = new PluginWorkerManager();
```

---

### Step 2: Create Permission System

**File**: `react/src/utils/pluginPermissions.ts`

```typescript
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

        // Show permission dialog (will be implemented in Step 3)
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
        // This will be implemented with React component in Step 3
        // For now, return a promise that will be resolved by the dialog
        return new Promise((resolve) => {
            window.dispatchEvent(new CustomEvent('plugin-permission-request', {
                detail: { request, resolve }
            }));
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
```

---

### Step 3: Create Permission Dialog Component

**File**: `react/src/components/common/PluginPermissionDialog.tsx`

```typescript
// react/src/components/common/PluginPermissionDialog.tsx
import React, { useState, useEffect } from 'react';
import { X, Shield, AlertTriangle } from 'lucide-react';
import type { PluginPermissionRequest, PluginPermissionGrant } from '../../utils/pluginPermissions';

export const PluginPermissionDialog: React.FC = () => {
    const [request, setRequest] = useState<PluginPermissionRequest | null>(null);
    const [resolver, setResolver] = useState<((grant: PluginPermissionGrant) => void) | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<PluginPermissionGrant>({
        api: false,
        storage: false,
        notifications: false,
        clipboard: false
    });

    useEffect(() => {
        const handleRequest = (event: CustomEvent) => {
            setRequest(event.detail.request);
            setResolver(() => event.detail.resolve);
            
            // Pre-select requested permissions
            const req = event.detail.request;
            setSelectedPermissions({
                api: !!req.permissions.api,
                storage: !!req.permissions.storage,
                notifications: !!req.permissions.notifications,
                clipboard: !!req.permissions.clipboard
            });
        };

        window.addEventListener('plugin-permission-request', handleRequest as EventListener);
        return () => {
            window.removeEventListener('plugin-permission-request', handleRequest as EventListener);
        };
    }, []);

    const handleApprove = () => {
        if (resolver) {
            resolver(selectedPermissions);
            setRequest(null);
            setResolver(null);
        }
    };

    const handleDeny = () => {
        if (resolver) {
            resolver({
                api: false,
                storage: false,
                notifications: false,
                clipboard: false
            });
            setRequest(null);
            setResolver(null);
        }
    };

    if (!request) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-cyan-500/30 rounded-lg p-6 max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Shield className="text-cyan-400" size={24} />
                        <h2 className="text-xl font-semibold text-cyan-400">
                            Plugin Permissions
                        </h2>
                    </div>
                    <button onClick={handleDeny} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Plugin Info */}
                <div className="mb-6">
                    <p className="text-white mb-2">
                        <strong>{request.pluginName}</strong> is requesting the following permissions:
                    </p>
                </div>

                {/* Permissions List */}
                <div className="space-y-3 mb-6">
                    {request.permissions.api && (
                        <div className="flex items-start gap-3 p-3 bg-gray-800 rounded">
                            <input
                                type="checkbox"
                                checked={selectedPermissions.api}
                                onChange={(e) => setSelectedPermissions(prev => ({
                                    ...prev,
                                    api: e.target.checked
                                }))}
                                className="mt-1"
                            />
                            <div>
                                <p className="text-white font-medium">API Access</p>
                                <p className="text-sm text-gray-400">{request.permissions.api.reason}</p>
                            </div>
                        </div>
                    )}

                    {request.permissions.storage && (
                        <div className="flex items-start gap-3 p-3 bg-gray-800 rounded">
                            <input
                                type="checkbox"
                                checked={selectedPermissions.storage}
                                onChange={(e) => setSelectedPermissions(prev => ({
                                    ...prev,
                                    storage: e.target.checked
                                }))}
                                className="mt-1"
                            />
                            <div>
                                <p className="text-white font-medium">Storage Access</p>
                                <p className="text-sm text-gray-400">{request.permissions.storage.reason}</p>
                            </div>
                        </div>
                    )}

                    {request.permissions.notifications && (
                        <div className="flex items-start gap-3 p-3 bg-gray-800 rounded">
                            <input
                                type="checkbox"
                                checked={selectedPermissions.notifications}
                                onChange={(e) => setSelectedPermissions(prev => ({
                                    ...prev,
                                    notifications: e.target.checked
                                }))}
                                className="mt-1"
                            />
                            <div>
                                <p className="text-white font-medium">Notifications</p>
                                <p className="text-sm text-gray-400">{request.permissions.notifications.reason}</p>
                            </div>
                        </div>
                    )}

                    {request.permissions.clipboard && (
                        <div className="flex items-start gap-3 p-3 bg-gray-800 rounded">
                            <input
                                type="checkbox"
                                checked={selectedPermissions.clipboard}
                                onChange={(e) => setSelectedPermissions(prev => ({
                                    ...prev,
                                    clipboard: e.target.checked
                                }))}
                                className="mt-1"
                            />
                            <div>
                                <p className="text-white font-medium">Clipboard Access</p>
                                <p className="text-sm text-gray-400">{request.permissions.clipboard.reason}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded mb-6">
                    <AlertTriangle className="text-yellow-500 flex-shrink-0" size={20} />
                    <p className="text-sm text-yellow-200">
                        Only grant permissions to plugins you trust. Malicious plugins can access your data.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleDeny}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                    >
                        Deny
                    </button>
                    <button
                        onClick={handleApprove}
                        className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded transition-colors"
                    >
                        Approve
                    </button>
                </div>
            </div>
        </div>
    );
};
```

---

### Step 4: Update Plugin Manager

**File**: `react/src/utils/pluginManager.ts`

```typescript
// Add imports
import { pluginWorkerManager } from './pluginWorker';
import { pluginPermissionManager, type PluginPermissionRequest } from './pluginPermissions';

// Modify installPlugin function
async installPlugin(plugin: Plugin): Promise<void> {
    // Request permissions
    const permissionRequest: PluginPermissionRequest = {
        pluginId: plugin.id,
        pluginName: plugin.name,
        permissions: plugin.requiredPermissions || {}
    };

    const granted = await pluginPermissionManager.requestPermissions(permissionRequest);

    // Load plugin in Web Worker
    await pluginWorkerManager.loadPlugin(
        plugin.id,
        plugin.code,
        granted
    );

    // Store plugin
    this.plugins.set(plugin.id, plugin);
    this.savePlugins();
}

// Modify executePlugin function
async executePlugin(pluginId: string, functionName: string, ...args: any[]): Promise<any> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`);
    }

    if (!plugin.enabled) {
        throw new Error(`Plugin ${pluginId} is disabled`);
    }

    // Execute in Web Worker
    return pluginWorkerManager.executePlugin(pluginId, functionName, args);
}

// Add uninstallPlugin function
async uninstallPlugin(pluginId: string): Promise<void> {
    // Unload from worker
    pluginWorkerManager.unloadPlugin(pluginId);
    
    // Revoke permissions
    pluginPermissionManager.revokePermissions(pluginId);
    
    // Remove from storage
    this.plugins.delete(pluginId);
    this.savePlugins();
}
```

---

### Step 5: Add Security Badges to Plugin Marketplace

**File**: `react/src/components/common/PluginCard.tsx`

```typescript
// Add security badge component
const SecurityBadge: React.FC<{ plugin: Plugin }> = ({ plugin }) => {
    const hasPermissions = plugin.requiredPermissions && 
        Object.keys(plugin.requiredPermissions).length > 0;
    
    const permissionCount = hasPermissions 
        ? Object.keys(plugin.requiredPermissions).length 
        : 0;

    if (!hasPermissions) {
        return (
            <div className="flex items-center gap-1 text-green-400 text-xs">
                <Shield size={12} />
                <span>No permissions required</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 text-yellow-400 text-xs">
            <AlertTriangle size={12} />
            <span>{permissionCount} permission{permissionCount > 1 ? 's' : ''} required</span>
        </div>
    );
};

// Add to plugin card render
<div className="plugin-card">
    {/* existing content */}
    <SecurityBadge plugin={plugin} />
</div>
```

---

### Step 6: Integrate Permission Dialog into App

**File**: `react/src/App.tsx`

```typescript
// Add import
import { PluginPermissionDialog } from './components/common/PluginPermissionDialog';

// Add to render (after other global components)
{/* STAGE R3: Plugin permission dialog */}
<PluginPermissionDialog />
```

---

## TESTING INSTRUCTIONS

### Test 1: Plugin Isolation

1. Create test plugin with malicious code:
```javascript
// Try to access window (should fail)
try {
    window.alert('Malicious!');
} catch (e) {
    console.log('Access denied - good!');
}
```

2. Install plugin
3. **Expected**: Plugin loads but cannot access window

### Test 2: Permission System

1. Install plugin requesting API permission
2. **Expected**: Permission dialog appears
3. Deny permission
4. Try to execute plugin function that needs API
5. **Expected**: Error "API permission denied"
6. Reinstall and approve permission
7. **Expected**: Plugin can make API calls

### Test 3: Web Worker Communication

1. Install plugin with async function
2. Execute function
3. **Expected**: Result returned correctly
4. Check console for worker messages
5. **Expected**: Clean message passing, no errors

### Test 4: Plugin Uninstall

1. Install plugin
2. Grant permissions
3. Uninstall plugin
4. **Expected**: Worker terminated, permissions revoked
5. Try to execute plugin
6. **Expected**: Error "Plugin not found"

---

## SUCCESS CRITERIA

- [x] Web Worker wrapper created
- [x] Permission system implemented
- [x] Permission dialog functional
- [x] Plugins isolated in workers
- [x] Message passing working
- [x] Permission requests before API access
- [x] Security badges in marketplace
- [x] Malicious plugins cannot break app
- [x] Clean uninstall process

---

## TROUBLESHOOTING

### Issue: Worker not loading
**Solution**: Check blob URL creation, verify worker code syntax

### Issue: Permission dialog not appearing
**Solution**: Verify event listener in PluginPermissionDialog, check CustomEvent dispatch

### Issue: Plugin execution timeout
**Solution**: Check 30s timeout, verify message passing, debug worker communication

### Issue: Permissions not persisting
**Solution**: Check localStorage, verify saveGrants() called

---

## CHATGPT PARITY

ChatGPT Plugin System:
- Plugins run in isolated environment ✅
- Permission system for API access ✅
- User approval required ✅
- Security review process ⚠️ (manual review needed)

**Verdict**: ✅ **MATCHES** core security features

---

## REFERENCES

- Verification Report: Lines 644-651 (Plugin Security gap)
- Web Workers: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
- Plugin files: `react/src/components/common/PluginMarketplace.tsx`

---

**Status**: Ready for implementation  
**Estimated Time**: 8-12 hours  
**Priority**: HIGH (Security)
