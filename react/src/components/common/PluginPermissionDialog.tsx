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
        const handleRequest = (event: Event) => {
            const customEvent = event as CustomEvent;
            setRequest(customEvent.detail.request);
            setResolver(() => customEvent.detail.resolve);

            // Pre-select requested permissions
            const req = customEvent.detail.request;
            setSelectedPermissions({
                api: !!req.permissions.api,
                storage: !!req.permissions.storage,
                notifications: !!req.permissions.notifications,
                clipboard: !!req.permissions.clipboard
            });
        };

        window.addEventListener('plugin-permission-request', handleRequest);
        return () => {
            window.removeEventListener('plugin-permission-request', handleRequest);
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gray-900 border border-cyan-500/30 rounded-lg p-6 max-w-md w-full shadow-xl shadow-cyan-900/20">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Shield className="text-cyan-400" size={24} />
                        <h2 className="text-xl font-semibold text-cyan-400">
                            Plugin Permissions
                        </h2>
                    </div>
                    <button onClick={handleDeny} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Plugin Info */}
                <div className="mb-6">
                    <p className="text-gray-300 mb-2">
                        <strong className="text-white">{request.pluginName}</strong> is requesting the following permissions:
                    </p>
                </div>

                {/* Permissions List */}
                <div className="space-y-3 mb-6">
                    {request.permissions.api && (
                        <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded border border-gray-700">
                            <input
                                type="checkbox"
                                checked={selectedPermissions.api}
                                onChange={(e) => setSelectedPermissions(prev => ({
                                    ...prev,
                                    api: e.target.checked
                                }))}
                                className="mt-1 w-4 h-4 accent-cyan-500 bg-gray-700 border-gray-600 rounded"
                            />
                            <div>
                                <p className="text-white font-medium text-sm">API Access</p>
                                <p className="text-xs text-gray-400">{request.permissions.api.reason}</p>
                            </div>
                        </div>
                    )}

                    {request.permissions.storage && (
                        <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded border border-gray-700">
                            <input
                                type="checkbox"
                                checked={selectedPermissions.storage}
                                onChange={(e) => setSelectedPermissions(prev => ({
                                    ...prev,
                                    storage: e.target.checked
                                }))}
                                className="mt-1 w-4 h-4 accent-cyan-500 bg-gray-700 border-gray-600 rounded"
                            />
                            <div>
                                <p className="text-white font-medium text-sm">Storage Access</p>
                                <p className="text-xs text-gray-400">{request.permissions.storage.reason}</p>
                            </div>
                        </div>
                    )}

                    {request.permissions.notifications && (
                        <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded border border-gray-700">
                            <input
                                type="checkbox"
                                checked={selectedPermissions.notifications}
                                onChange={(e) => setSelectedPermissions(prev => ({
                                    ...prev,
                                    notifications: e.target.checked
                                }))}
                                className="mt-1 w-4 h-4 accent-cyan-500 bg-gray-700 border-gray-600 rounded"
                            />
                            <div>
                                <p className="text-white font-medium text-sm">Notifications</p>
                                <p className="text-xs text-gray-400">{request.permissions.notifications.reason}</p>
                            </div>
                        </div>
                    )}

                    {request.permissions.clipboard && (
                        <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded border border-gray-700">
                            <input
                                type="checkbox"
                                checked={selectedPermissions.clipboard}
                                onChange={(e) => setSelectedPermissions(prev => ({
                                    ...prev,
                                    clipboard: e.target.checked
                                }))}
                                className="mt-1 w-4 h-4 accent-cyan-500 bg-gray-700 border-gray-600 rounded"
                            />
                            <div>
                                <p className="text-white font-medium text-sm">Clipboard Access</p>
                                <p className="text-xs text-gray-400">{request.permissions.clipboard.reason}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded mb-6">
                    <AlertTriangle className="text-yellow-500 flex-shrink-0" size={16} />
                    <p className="text-xs text-yellow-200/80">
                        Only grant permissions to plugins you trust. Malicious plugins can access sensitive data.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleDeny}
                        className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors text-sm font-medium"
                    >
                        Deny
                    </button>
                    <button
                        onClick={handleApprove}
                        className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded transition-colors text-sm"
                    >
                        Approve
                    </button>
                </div>
            </div>
        </div>
    );
};
