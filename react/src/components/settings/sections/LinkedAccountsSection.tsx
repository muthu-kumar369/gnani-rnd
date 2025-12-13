import React, { useState } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useOAuth } from '../../../hooks/useOAuth';

import { Link as LinkIcon, Github, Mail, Globe, Loader2 } from 'lucide-react';
import Loader from '../../ui/Loader';
import { motion } from 'framer-motion';

const LinkedAccountsSection: React.FC = () => {
    const { user, loading, unlinkOAuthProvider } = useUserStore();
    const { linkProvider, isAuthenticating } = useOAuth();
    const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);

    if (loading || !user) return <div className="flex justify-center p-8"><Loader text="Loading linked accounts..." /></div>;

    const handleLink = async (provider: string) => {
        await linkProvider(provider);
    };

    const handleUnlink = async (provider: string) => {
        if (!confirm(`Are you sure you want to unlink your ${provider} account?`)) return;

        setUnlinkingProvider(provider);
        try {
            await unlinkOAuthProvider(provider);
        } catch (error) {
            console.error('Failed to unlink provider:', error);
        } finally {
            setUnlinkingProvider(null);
        }
    };

    const getProviderIcon = (provider: string) => {
        switch (provider.toLowerCase()) {
            case 'github': return <Github size={20} />;
            case 'google': return <Mail size={20} />;
            default: return <Globe size={20} />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const supportedProviders = [
        { id: 'google', name: 'Google', description: 'Connect your Google account' },
        { id: 'github', name: 'GitHub', description: 'Connect your GitHub account' }
    ];

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-3">
                {supportedProviders.map((provider) => {
                    const linkedAccount = user.oauthProviders.find(p => p.provider.toLowerCase() === provider.id);
                    const isAccountLinked = !!linkedAccount;
                    const isProcessing = isAuthenticating || unlinkingProvider === provider.id;

                    return (
                        <motion.div
                            key={provider.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex items-center justify-between border rounded-lg p-3 transition-colors ${isAccountLinked
                                ? 'bg-cyan-900/10 border-cyan-500/30'
                                : 'bg-black/20 border-white/5 hover:border-cyan-500/20'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isAccountLinked ? 'bg-cyan-500/10 text-cyan-400' : 'bg-gray-700/50 text-gray-400'
                                    }`}>
                                    {getProviderIcon(provider.id)}
                                </div>
                                <div>
                                    <h4 className={`text-sm font-bold capitalize ${isAccountLinked ? 'text-white' : 'text-slate-400'
                                        }`}>
                                        {provider.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-500">
                                        {isAccountLinked
                                            ? `Linked on ${formatDate(linkedAccount!.linkedAt)}`
                                            : provider.description}
                                    </p>
                                </div>
                            </div>

                            <div>
                                {isProcessing ? (
                                    <div className="px-3 py-1.5 flex items-center gap-1.5 text-cyan-400/60">
                                        <Loader2 size={14} className="animate-spin" />
                                        <span className="text-xs">Processing...</span>
                                    </div>
                                ) : isAccountLinked ? (
                                    <button
                                        onClick={() => handleUnlink(provider.id)}
                                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-red-500/30"
                                    >
                                        Unlink
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleLink(provider.id)}
                                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1.5"
                                    >
                                        <LinkIcon size={12} />
                                        Link
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default LinkedAccountsSection;
