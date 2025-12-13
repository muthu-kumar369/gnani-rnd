import React, { useState } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';

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
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* MFA Status */}
            <div className="bg-[#0f0f1a]/60 border border-white/5 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                        <Shield size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Multi-Factor Authentication</h4>
                        <p className="text-xs text-slate-500">
                            {user.security.mfaEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleToggleMFA}
                    disabled={isUpdating}
                    className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {user.security.mfaEnabled ? 'Disable' : 'Enable'}
                </button>
            </div>

            {/* Login History */}
            <div className="bg-[#0f0f1a]/60 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Key size={16} className="text-cyan-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Login Activity
                    </h4>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-xs text-slate-400">Active Sessions</span>
                        <span className="text-sm font-bold text-cyan-400 font-mono">{user.security.activeSessions}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-xs text-slate-400">Failed Attempts (Last 24h)</span>
                        <span className={`text-sm font-mono font-bold ${user.security.failedLoginAttempts > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {user.security.failedLoginAttempts}
                        </span>
                    </div>
                    {user.security.lastFailedLogin && (
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-xs text-slate-400">Last Failed Login</span>
                            <span className="text-red-400 text-xs font-mono">
                                {new Date(user.security.lastFailedLogin).toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Recovery Options */}
            <div className="bg-[#0f0f1a]/60 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Lock size={16} className="text-cyan-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Recovery Options
                    </h4>
                </div>
                <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recovery Email</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={recoveryEmail}
                                onChange={(e) => setRecoveryEmail(e.target.value)}
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                            />
                            <button
                                onClick={handleUpdateRecoveryEmail}
                                disabled={isUpdating || recoveryEmail === user.security.recoveryEmail}
                                className="px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mt-2">
                <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} className="text-red-400" />
                    <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider">
                        Danger Zone
                    </h4>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-red-300/60 text-xs">Log out of all other sessions</p>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-red-500/30">
                        <LogOut size={12} />
                        Terminate All
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SecuritySection;
