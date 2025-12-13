import React, { useState } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';

import { Smartphone, Laptop, Monitor, Speaker, Trash2, CheckCircle } from 'lucide-react';
import Loader from '../../ui/Loader';
import Button from '../../ui/Button';

const DevicesSection: React.FC = () => {
    const { user, loading, removeDevice } = useUserStore();
    const { addToast } = useToast();
    const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);

    if (loading || !user) return <div className="flex justify-center p-8"><Loader text="Loading devices..." /></div>;

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'mobile': return <Smartphone size={20} />;
            case 'desktop': return <Monitor size={20} />;
            case 'web': return <Laptop size={20} />;
            case 'speaker': return <Speaker size={20} />;
            default: return <Monitor size={20} />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleRemoveDevice = async (deviceId: string) => {
        if (!confirm('Are you sure you want to remove this device?')) return;

        setRemovingDeviceId(deviceId);
        try {
            await removeDevice(deviceId);
            addToast('Device removed successfully', 'success');
        } catch (error) {
            console.error('Failed to remove device:', error);
            addToast('Failed to remove device', 'error');
        } finally {
            setRemovingDeviceId(null);
        }
    };

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            {user.devices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="p-3 bg-cyan-500/5 rounded-lg border border-white/5 mb-3">
                        <Monitor size={24} className="text-cyan-500/40" />
                    </div>
                    <p className="text-slate-500 font-medium text-xs">
                        No devices connected to your account.
                    </p>
                </div>
            ) : (
                user.devices.map((device) => (
                    <div
                        key={device.deviceId}
                        className="flex items-center justify-between bg-black/20 border border-white/5 rounded-lg p-3 hover:border-cyan-500/20 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                                {getDeviceIcon(device.deviceType)}
                            </div>
                            <div>
                                <h4 className="text-white text-sm font-bold flex items-center gap-2">
                                    {device.deviceName}
                                    {device.isTrusted && (
                                        <CheckCircle size={12} className="text-green-400" />
                                    )}
                                </h4>
                                <p className="text-[10px] text-slate-500 font-mono">
                                    Last active: {formatDate(device.lastActive)}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDevice(device.deviceId)}
                            disabled={removingDeviceId === device.deviceId}
                            isLoading={removingDeviceId === device.deviceId}
                            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-8 px-2"
                        >
                            {removingDeviceId !== device.deviceId && <Trash2 size={14} />}
                        </Button>
                    </div>
                ))
            )}
        </div>
    );
};

export default DevicesSection;
