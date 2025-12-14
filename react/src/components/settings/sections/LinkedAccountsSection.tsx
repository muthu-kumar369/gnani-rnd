import React, { useState } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useOAuth } from '../../../hooks/useOAuth';
import { useToast } from '../../../context/ToastContext';

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
            color: 'text-white',
            status: 'coming_soon'
        },
        {
            id: 'notion',
            name: 'Notion',
            description: 'Sync workspaces and pages',
            icon: FileText,
            category: 'productivity',
            color: 'text-white',
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
                className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${linked
                    ? 'bg-cyan-900/10 border-cyan-500/30 shadow-[0_0_15px_-5px_rgba(6,182,212,0.15)]'
                    : disabled
                        ? 'bg-gray-900/20 border-white/5 opacity-60'
                        : 'bg-[#0a0a15]/60 border-white/5 hover:border-cyan-500/20 hover:bg-[#0f0f1a]'
                    }`}
            >
                {/* Glow Effect for Connected */}
                {linked && (
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl transition-all group-hover:bg-cyan-500/20" />
                )}

                <div className="relative flex items-start justify-between">
                    <div className="flex gap-4">
                        {/* Icon Container */}
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${linked
                            ? 'bg-[#0f0f1a] border-cyan-500/30'
                            : 'bg-[#0f0f1a] border-white/5 group-hover:border-white/10'
                            }`}>
                            <Icon size={24} className={connector.color} />
                        </div>

                        {/* Info */}
                        <div className="flex flex-col gap-1">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                                {connector.name}
                                {linked && <CheckCircle2 size={12} className="text-cyan-400" />}
                                {disabled && <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400 uppercase tracking-wide">Coming Soon</span>}
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">
                                {connector.description}
                            </p>
                            {linked && (
                                <p className="text-[10px] text-cyan-400/60 mt-1 font-mono">
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
                                className="rounded-lg bg-red-500/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-400 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
                            >
                                Disconnect
                            </button>
                        ) : (
                            <button
                                onClick={() => handleLink(connector)}
                                disabled={disabled || processing}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all ${disabled
                                    ? 'cursor-not-allowed bg-white/5 text-slate-500'
                                    : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 hover:shadow-[0_0_10px_-2px_rgba(6,182,212,0.3)]'
                                    }`}
                            >
                                {processing ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <>
                                        <span>Connect</span>
                                        <LinkIcon size={12} />
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
                        <h3 className="text-sm font-bold text-white uppercase tracking-wide">Data Sources</h3>
                        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
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
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Available Connectors</h4>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {CONNECTORS.filter(c => c.status !== 'coming_soon').map(renderConnectorCard)}
                    </div>
                </div>

                {/* Coming Soon */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Coming Soon</h4>
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
