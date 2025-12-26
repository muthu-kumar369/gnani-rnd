import React, { useState } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useOAuth } from '../../../hooks/useOAuth';
import { useToast } from '../../../context/ToastContext';
import { useThemeStore } from '../../../store/themeStore';

import {
    Link as LinkIcon,
    Github,
    Mail,
    Globe,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Database,
    MessageSquare,
    FileText,
    Hash
} from 'lucide-react';
import Loader from '../../ui/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../../ui/ConfirmationModal';

// Define connector types
type ConnectorCategory = 'social' | 'productivity' | 'developer';
type ConnectorStatus = 'connected' | 'available' | 'coming_soon' | 'maintenance';

interface Connector {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    category: ConnectorCategory;
    color: string;
    status: ConnectorStatus; // Override if coming_soon
}

const LinkedAccountsSection: React.FC = () => {
    const { user, loading, unlinkOAuthProvider } = useUserStore();
    const { linkProvider, isAuthenticating } = useOAuth();
    const { addToast } = useToast();
    const { theme } = useThemeStore();

    // State for unlinking modal
    const [unlinkModalOpen, setUnlinkModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<Connector | null>(null);
    const [isUnlinking, setIsUnlinking] = useState(false);

    if (loading || !user) return <div className="flex justify-center p-8"><Loader text="Loading connectors..." /></div>;

    // --- Configuration ---
    const CONNECTORS: Connector[] = [
        {
            id: 'google',
            name: 'Google',
            description: 'Sync calendar, contacts, and drive',
            icon: Mail,
            category: 'social',
            color: 'text-blue-400',
            status: 'available'
        },
        {
            id: 'github',
            name: 'GitHub',
            description: 'Access repositories and gists',
            icon: Github,
            category: 'developer',
            color: theme === 'dark' ? 'text-white' : 'text-gray-900',
            status: 'coming_soon'
        },
        {
            id: 'notion',
            name: 'Notion',
            description: 'Sync workspaces and pages',
            icon: FileText,
            category: 'productivity',
            color: theme === 'dark' ? 'text-white' : 'text-gray-900',
            status: 'coming_soon'
        },
        {
            id: 'slack',
            name: 'Slack',
            description: 'Connect channels and messages',
            icon: Hash,
            category: 'productivity',
            color: 'text-purple-400',
            status: 'coming_soon'
        }
    ];

    // --- Helpers ---
    const isLinked = (providerId: string) => {
        return !!user.oauthProviders.find(p => p.provider.toLowerCase() === providerId);
    };

    const getLinkedDate = (providerId: string) => {
        const provider = user.oauthProviders.find(p => p.provider.toLowerCase() === providerId);
        if (!provider) return null;
        return new Date(provider.linkedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // --- Handlers ---
    const handleLink = async (connector: Connector) => {
        if (connector.status === 'coming_soon') return;
        await linkProvider(connector.id);
    };

    const initiateUnlink = (connector: Connector) => {
        setSelectedProvider(connector);
        setUnlinkModalOpen(true);
    };

    const confirmUnlink = async () => {
        if (!selectedProvider) return;

        setIsUnlinking(true);
        try {
            await unlinkOAuthProvider(selectedProvider.id);
            addToast(`${selectedProvider.name} disconnected successfully`, 'success');
        } catch (error) {
            addToast(`Failed to disconnect ${selectedProvider.name}`, 'error');
        } finally {
            setIsUnlinking(false);
            setUnlinkModalOpen(false); // Close modal only after success/fail
            setSelectedProvider(null);
        }
    };

    // --- Render Groups ---
    const renderConnectorCard = (connector: Connector) => {
        const linked = isLinked(connector.id);
        const processing = isAuthenticating; // Globalauth processing for now, could be specific
        const disabled = connector.status === 'coming_soon' || connector.status === 'maintenance';
        const Icon = connector.icon;

        return (
            <motion.div
                key={connector.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: disabled ? 1 : 1.02 }}
                className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 ${linked
                    ? (theme === 'dark' ? 'bg-[#1a2639] shadow-md ring-1 ring-gnani-primary/50' : 'bg-white shadow-md ring-1 ring-gnani-primary/50')
                    : disabled
                        ? (theme === 'dark' ? 'bg-white/5 ring-white/5 opacity-60' : 'bg-gray-50/50 ring-black/5 opacity-60')
                        : (theme === 'dark' ? 'bg-[#1a2639] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] ring-white/5' : 'bg-white shadow-sm ring-black/5 hover:shadow-md')
                    } ${linked ? '' : 'ring-1'}`}
            >
                {/* Glow Effect for Connected */}
                {linked && (
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gnani-primary/10 blur-2xl transition-all group-hover:bg-gnani-primary/20" />
                )}

                <div className="relative flex items-start justify-between">
                    <div className="flex gap-4">
                        {/* Icon Container */}
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${linked
                            ? 'bg-canvas-surface border-gnani-primary/30'
                            : 'bg-canvas-surface border-glass-border group-hover:border-glass-border/80'
                            }`}>
                            <Icon size={24} className={connector.color} />
                        </div>

                        {/* Info */}
                        <div className="flex flex-col gap-1">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-type-primary">
                                {connector.name}
                                {linked && <CheckCircle2 size={12} className="text-gnani-primary" />}
                                {disabled && <span className="rounded-full bg-gnani-primary/10 text-gnani-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-gnani-primary/20 shadow-sm">Coming Soon</span>}
                            </h3>
                            <p className="text-xs text-type-muted leading-relaxed max-w-[200px]">
                                {connector.description}
                            </p>
                            {linked && (
                                <p className="text-[10px] text-gnani-primary/60 mt-1 font-mono">
                                    Connected on {getLinkedDate(connector.id)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="z-10">
                        {linked ? (
                            <button
                                onClick={() => initiateUnlink(connector)}
                                className="rounded-lg bg-red-100 dark:bg-red-500/20 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 opacity-0 transition-all hover:bg-red-200 dark:hover:bg-red-500/30 group-hover:opacity-100 shadow-sm border border-transparent"
                            >
                                Disconnect
                            </button>
                        ) : (
                            <button
                                onClick={() => handleLink(connector)}
                                disabled={disabled || processing}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all shadow-md border border-transparent ${disabled
                                    ? 'cursor-not-allowed bg-glass-shimmer text-type-muted'
                                    : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5'
                                    }`}
                            >
                                {processing ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <>
                                        <span>Connect</span>
                                        <LinkIcon size={12} className="text-white" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full overflow-y-auto custom-scrollbar pr-2 pb-4">

            {/* Header / Intro */}
            <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                        <Database size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-type-primary  tracking-wide">Data Sources</h3>
                        <p className="mt-1 text-xs text-type-muted leading-relaxed">
                            Connect your accounts to let Gnani access your personal data context.
                            This allows for more personalized and intelligent responses based on your documents, chats, and code.
                        </p>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="space-y-6">

                {/* Available Now */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-type-secondary  tracking-widest px-1">Available Connectors</h4>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {CONNECTORS.filter(c => c.status !== 'coming_soon').map(renderConnectorCard)}
                    </div>
                </div>

                {/* Coming Soon */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-type-muted  tracking-widest px-1">Coming Soon</h4>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {CONNECTORS.filter(c => c.status === 'coming_soon').map(renderConnectorCard)}
                    </div>
                </div>
            </div>

            {/* Unlink Confirmation Modal */}
            <ConfirmationModal
                isOpen={unlinkModalOpen}
                onClose={() => setUnlinkModalOpen(false)}
                onConfirm={confirmUnlink}
                title={`Disconnect ${selectedProvider?.name}?`}
                message={`Are you sure you want to disconnect ${selectedProvider?.name}? Gnani will no longer have access to data from this account.`}
                confirmLabel="Disconnect"
                isDangerous={true}
            />
        </div>
    );
};

export default LinkedAccountsSection;
