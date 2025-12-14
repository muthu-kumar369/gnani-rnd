import React, { useState } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';
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
    const [isUpdating, setIsUpdating] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState(user?.security.recoveryEmail || '');
    const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);

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
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* MFA Card */}
                <motion.div variants={itemVariants} className="bg-[#0f0f1a]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
                    <span className="absolute top-6 right-6 text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                        Coming Soon
                    </span>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-slate-500/10 text-slate-400">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Two-Factor Authentication</h4>
                                <p className="text-xs text-slate-400 mt-0.5">Secure your account with 2FA</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5 opacity-50">
                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-500/10 px-3 py-2 rounded-lg border border-slate-500/20">
                            <Shield size={12} />
                            <span className="font-bold">Protection Disabled</span>
                        </div>
                    </div>
                </motion.div>

                {/* Recovery Email Card */}
                <motion.div variants={itemVariants} className="bg-[#0f0f1a]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
                    <span className="absolute top-6 right-6 text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                        Coming Soon
                    </span>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-slate-500/10 text-slate-400">
                            <Lock size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Recovery Methods</h4>
                            <p className="text-xs text-slate-400 mt-0.5">Backup access to your account</p>
                        </div>
                    </div>

                    <div className="space-y-3 opacity-60 pointer-events-none grayscale">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider ml-1">Recovery Email</label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        type="email"
                                        value={recoveryEmail}
                                        onChange={(e) => setRecoveryEmail(e.target.value)}
                                        placeholder="backup@example.com"
                                        className="h-10 text-sm bg-black/20"
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
                </motion.div>
            </div>

            {/* Login History / Active Sessions */}
            <motion.div variants={itemVariants} className="bg-[#0f0f1a]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                            <Key size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Session Activity</h4>
                            <p className="text-xs text-slate-400 mt-0.5">Monitor your account usage</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Stat Card 1 */}
                    <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex flex-col gap-1">
                        <div className="text-slate-400 text-xs font-medium">Active Sessions</div>
                        <div className="text-2xl font-bold text-white font-mono flex items-center gap-2">
                            {user.security.activeSessions}
                            <span className="text-[10px] py-0.5 px-2 bg-green-500/20 text-green-400 rounded-full border border-green-500/20 font-sans tracking-wide">
                                ONLINE
                            </span>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex flex-col gap-1">
                        <div className="text-slate-400 text-xs font-medium">Failed Attempts (24h)</div>
                        <div className={`text-2xl font-bold font-mono ${user.security.failedLoginAttempts > 0 ? 'text-red-400' : 'text-white'}`}>
                            {user.security.failedLoginAttempts}
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex flex-col gap-1 overflow-hidden">
                        <div className="text-slate-400 text-xs font-medium">Last Failed Login</div>
                        <div className="text-sm font-bold text-white truncate leading-8">
                            {user.security.lastFailedLogin ? new Date(user.security.lastFailedLogin).toLocaleString() : 'None'}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Danger Zone */}
            <motion.div variants={itemVariants} className="group relative overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/5 p-6 transition-all hover:bg-red-500/10">
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-red-500/10 blur-3xl transition-all group-hover:bg-red-500/20" />

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-red-500/10 p-3 text-red-400 ring-1 ring-red-500/20">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Emergency Session Termination</h4>
                            <p className="text-xs text-red-200/60 mt-0.5 max-w-md">
                                Suspect unauthorized access? This will verify your identity and immediately invalidate all other active sessions and tokens.
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="danger"
                        onClick={() => setIsTerminateModalOpen(true)}
                        className="shrink-0"
                        leftIcon={<LogOut size={16} />}
                    >
                        Terminate All Sessions
                    </Button>
                </div>
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
        </motion.div>
    );
};

export default SecuritySection;
