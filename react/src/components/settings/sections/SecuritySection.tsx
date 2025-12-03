import React, { useState } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';
import SectionHeader from '../SectionHeader';
import { Shield, Key, Lock, AlertTriangle, LogOut } from 'lucide-react';
import Loader from '../../ui/Loader';

const SecuritySection: React.FC = () => {
    const { user, loading, updateSecurity } = useUserStore();
    const { addToast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState(user?.security.recoveryEmail || '');

    if (loading || !user) return <div className="flex justify-center p-8"><Loader text="Loading security settings..." /></div>;

    const handleToggleMFA = async () => {
        setIsUpdating(true);
        try {
            await updateSecurity({ mfaEnabled: !user.security.mfaEnabled });
            addToast(`MFA ${!user.security.mfaEnabled ? 'enabled' : 'disabled'} successfully`, 'success');
        } catch (error) {
            console.error('Failed to update MFA:', error);
            addToast('Failed to update MFA', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateRecoveryEmail = async () => {
        if (recoveryEmail === user.security.recoveryEmail) return;

        setIsUpdating(true);
        try {
            await updateSecurity({ recoveryEmail });
            addToast('Recovery email updated successfully', 'success');
        } catch (error) {
            console.error('Failed to update recovery email:', error);
            addToast('Failed to update recovery email', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div>
            <SectionHeader
                title="Security & Login"
                description="Protect your account and manage login methods."
            />

            <div className="grid grid-cols-1 gap-6">
                {/* MFA Status */}
                <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-lg text-green-400">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h4 className="text-cyan-100 font-medium">Multi-Factor Authentication</h4>
                            <p className="text-sm text-cyan-400/60">
                                {user.security.mfaEnabled ? 'Enabled' : 'Disabled'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleMFA}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg text-sm font-medium transition-colors border border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {user.security.mfaEnabled ? 'Disable' : 'Enable'}
                    </button>
                </div>

                {/* Login History */}
                <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-cyan-200 mb-4 flex items-center gap-2">
                        <Key size={20} />
                        Login Activity
                    </h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-cyan-500/10">
                            <span className="text-cyan-300 text-sm">Active Sessions</span>
                            <span className="text-cyan-100 font-mono">{user.security.activeSessions}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-cyan-500/10">
                            <span className="text-cyan-300 text-sm">Failed Attempts (Last 24h)</span>
                            <span className={`font-mono ${user.security.failedLoginAttempts > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {user.security.failedLoginAttempts}
                            </span>
                        </div>
                        {user.security.lastFailedLogin && (
                            <div className="flex justify-between items-center py-2 border-b border-cyan-500/10">
                                <span className="text-cyan-300 text-sm">Last Failed Login</span>
                                <span className="text-red-400 text-sm">
                                    {new Date(user.security.lastFailedLogin).toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recovery Options */}
                <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-cyan-200 mb-4 flex items-center gap-2">
                        <Lock size={20} />
                        Recovery Options
                    </h4>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-cyan-300 font-medium">Recovery Email</label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={recoveryEmail}
                                    onChange={(e) => setRecoveryEmail(e.target.value)}
                                    className="flex-1 bg-black/40 border border-cyan-500/30 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none"
                                />
                                <button
                                    onClick={handleUpdateRecoveryEmail}
                                    disabled={isUpdating || recoveryEmail === user.security.recoveryEmail}
                                    className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg text-sm font-medium transition-colors border border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-6 mt-4">
                    <h4 className="text-lg font-semibold text-red-200 mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} />
                        Danger Zone
                    </h4>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-200/80 text-sm">Sign out of all other sessions</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg text-sm font-medium transition-colors border border-red-500/30">
                            <LogOut size={16} />
                            Terminate All Sessions
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecuritySection;
