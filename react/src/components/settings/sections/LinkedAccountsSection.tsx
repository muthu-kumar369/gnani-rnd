import React, { useState } from 'react';
import { useUser } from '../../../context/UserContext';
import SectionHeader from '../SectionHeader';
import { Link as LinkIcon, Github, Mail, Globe } from 'lucide-react';

const LinkedAccountsSection: React.FC = () => {
    const { user, loading, unlinkOAuthProvider } = useUser();
    const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);

    if (loading || !user) return <div className="text-cyan-400">Loading linked accounts...</div>;

    const handleUnlink = async (provider: string) => {
        if (!confirm(`Are you sure you want to unlink your ${provider} account?`)) return;

        setUnlinkingProvider(provider);
        try {
            await unlinkOAuthProvider(provider);
        } catch (error) {
            console.error('Failed to unlink provider:', error);
            alert('Failed to unlink account. Please try again.');
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

    return (
        <div>
            <SectionHeader
                title="Linked Accounts"
                description="Manage external accounts connected to Gnani."
            />

            <div className="space-y-4">
                {user.oauthProviders.map((provider) => (
                    <div
                        key={provider.provider}
                        className="flex items-center justify-between bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400">
                                {getProviderIcon(provider.provider)}
                            </div>
                            <div>
                                <h4 className="text-cyan-100 font-medium capitalize">
                                    {provider.provider}
                                </h4>
                                <p className="text-xs text-cyan-400/60">
                                    Linked on {formatDate(provider.linkedAt)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleUnlink(provider.provider)}
                            disabled={unlinkingProvider === provider.provider}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg text-sm font-medium transition-colors border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Unlink
                        </button>
                    </div>
                ))}

                {/* Add New Link Placeholder */}
                <button className="w-full py-4 border-2 border-dashed border-cyan-500/20 rounded-xl text-cyan-400/60 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all flex items-center justify-center gap-2">
                    <LinkIcon size={18} />
                    Connect another account
                </button>
            </div>
        </div>
    );
};

export default LinkedAccountsSection;
