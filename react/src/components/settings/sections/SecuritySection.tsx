import React, { useState } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';
import { useThemeStore } from '../../../store/themeStore';
import { motion } from 'framer-motion';
import { Shield, Key, Lock, AlertTriangle, LogOut, Check, Smartphone, Globe } from 'lucide-react';
import Loader from '../../ui/Loader';
import ConfirmationModal from '../../ui/ConfirmationModal';
import Switch from '../../ui/Switch';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

const SecuritySection: React.FC = () => {
    const { user, loading, updateSecurity, terminateSessions } = useUserStore();
    const { addToast } = useToast();
    const { theme } = useThemeStore();
    const [isUpdating, setIsUpdating] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState(user?.security.recoveryEmail || '');
    const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);

    if (loading && !user) return <div className="flex justify-center p-8"><Loader text="Loading security settings..." /></div>;
    if (!user) return null;

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
        if (recoveryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) {
            addToast('Please enter a valid email address', 'error');
            return;
        }

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

    const handleTerminateSessions = async () => {
        setIsUpdating(true);
        try {
            await terminateSessions();
            addToast('All other sessions terminated successfully', 'success');
            setIsTerminateModalOpen(false);
        } catch (error) {
            console.error('Failed to terminate sessions:', error);
            addToast('Failed to terminate sessions', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="h-full flex flex-col pt-1">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex-1 overflow-y-auto custom-scrollbar px-1 py-1 space-y-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* MFA Card */}
                    <div className={`${theme === 'dark' ? 'bg-[#1a2639] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] ring-white/5' : 'bg-white shadow-sm ring-black/5'} rounded-xl p-6 ring-1 backdrop-blur-md relative overflow-hidden transition-all hover:shadow-md`}>
                        <span className="absolute top-6 right-6 text-[10px] bg-gnani-primary/10 text-gnani-primary px-2 py-0.5 rounded-full border border-gnani-primary/20 shadow-sm uppercase tracking-wider font-bold">
                            Coming Soon
                        </span>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-glass-shimmer text-type-muted">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-type-primary">Two-Factor Authentication</h4>
                                    <p className="text-xs text-type-muted mt-0.5">Secure your account with 2FA</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-glass-border opacity-50">
                            <div className="flex items-center gap-2 text-xs text-type-muted bg-glass-shimmer px-3 py-2 rounded-lg border border-glass-border">
                                <Shield size={12} />
                                <span className="font-bold">Protection Disabled</span>
                            </div>
                        </div>
                    </div>

                    {/* Recovery Email Card */}
                    <div className={`${theme === 'dark' ? 'bg-[#1a2639] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] ring-white/5' : 'bg-white shadow-sm ring-black/5'} rounded-xl p-6 ring-1 backdrop-blur-md relative overflow-hidden transition-all hover:shadow-md`}>
                        <span className="absolute top-6 right-6 text-[10px] bg-gnani-primary/10 text-gnani-primary px-2 py-0.5 rounded-full border border-gnani-primary/20 shadow-sm uppercase tracking-wider font-bold">
                            Coming Soon
                        </span>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl bg-glass-shimmer text-type-muted">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-type-primary">Recovery Methods</h4>
                                <p className="text-xs text-type-muted mt-0.5">Backup access to your account</p>
                            </div>
                        </div>

                        <div className="space-y-3 opacity-60 pointer-events-none grayscale">
                            <div className="space-y-1.5">
                                <label className="text-[10px]  font-bold text-type-secondary tracking-wider ml-1">Recovery Email</label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Input
                                            type="email"
                                            value={recoveryEmail}
                                            onChange={(e) => setRecoveryEmail(e.target.value)}
                                            placeholder="backup@example.com"
                                            className="h-10 text-sm bg-canvas-surface"
                                            disabled
                                        />
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={handleUpdateRecoveryEmail}
                                        disabled={true}
                                        className="h-10 min-w-[80px]"
                                        variant="primary"
                                    >
                                        Update
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Login History / Active Sessions */}
                    <div className={`${theme === 'dark' ? 'bg-[#1a2639] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] ring-white/5' : 'bg-white shadow-sm ring-black/5'} md:col-span-2 rounded-xl p-6 ring-1 backdrop-blur-md transition-all hover:shadow-md`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                                    <Key size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-type-primary">Session Activity</h4>
                                    <p className="text-xs text-type-muted mt-0.5">Monitor your account usage</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row bg-canvas-surface/50 rounded-xl border border-glass-border overflow-hidden divide-y md:divide-y-0 md:divide-x divide-glass-border">
                            {/* Stat 1: Active Sessions */}
                            <div className="flex-1 p-5 flex items-center justify-between group hover:bg-canvas-surface/50 transition-colors">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-type-muted  tracking-wider">Active Sessions</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-type-primary font-mono">{user.security.activeSessions}</span>
                                        <span className="relative flex h-2.5 w-2.5 ml-1">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                        </span>
                                    </div>
                                </div>
                                <Smartphone size={20} className="text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />
                            </div>

                            {/* Stat 2: Failed Attempts */}
                            <div className="flex-1 p-5 flex items-center justify-between group hover:bg-canvas-surface/50 transition-colors">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-type-muted  tracking-wider">Failed Attempts</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-2xl font-bold font-mono ${user.security.failedLoginAttempts > 0 ? 'text-status-error' : 'text-type-primary'}`}>{user.security.failedLoginAttempts}</span>
                                    </div>
                                </div>
                                <AlertTriangle size={20} className={`${user.security.failedLoginAttempts > 0 ? 'text-status-error' : 'text-type-muted/50'} group-hover:opacity-100 transition-opacity`} />
                            </div>

                            {/* Stat 3: Last Failed Login */}
                            <div className="flex-1 p-5 flex items-center justify-between group hover:bg-canvas-surface/50 transition-colors">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-type-muted  tracking-wider">Last Failed Login</span>
                                    <span className="text-sm font-bold text-type-primary font-mono truncate">
                                        {user.security.lastFailedLogin ? new Date(user.security.lastFailedLogin).toLocaleDateString() : 'None'}
                                    </span>
                                </div>
                                <Globe size={20} className="text-blue-500/50 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Danger Zone */}
                <motion.div
                    variants={itemVariants}
                    className={`group relative overflow-hidden rounded-2xl p-6 transition-all ${theme === 'dark'
                        ? 'bg-[#1a2639] shadow-[0_0_30px_-10px_rgba(239,68,68,0.15)]'
                        : 'bg-red-50'
                        }`}
                >
                    <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-red-500/10 blur-3xl transition-all group-hover:bg-red-500/20" />

                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`rounded-full p-3 text-red-500 ring-1 shadow-sm ${theme === 'dark'
                                ? 'bg-red-500/10 ring-red-500/20'
                                : 'bg-white ring-red-100'
                                }`}>
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-type-primary">Emergency Session Termination</h4>
                                <p className="text-xs text-type-muted mt-0.5 max-w-md">
                                    Suspect unauthorized access? This will verify your identity and immediately invalidate all other active sessions and tokens.
                                </p>
                            </div>
                        </div>

                        <Button
                            variant="danger"
                            onClick={() => setIsTerminateModalOpen(true)}
                            className="shrink-0 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white border-none shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
                            leftIcon={<LogOut size={16} />}
                        >
                            Terminate All Sessions
                        </Button>
                    </div>
                </motion.div>
            </motion.div>

            <ConfirmationModal
                isOpen={isTerminateModalOpen}
                onClose={() => setIsTerminateModalOpen(false)}
                onConfirm={handleTerminateSessions}
                title="Terminate All Other Sessions?"
                message="This will log you out of all other devices and invalidate their access tokens. Your current session will remain active. Are you sure you want to proceed?"
                confirmLabel="Yes, Terminate All"
                cancelLabel="Cancel"
                isDangerous={true}
            />
        </div>
    );
};

export default SecuritySection;

