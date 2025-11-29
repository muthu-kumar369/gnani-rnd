import React, { useState } from 'react';
import { useUser } from '../../../context/UserContext';
import { useToast } from '../../../context/ToastContext';
import SectionHeader from '../SectionHeader';
import { Smartphone, Laptop, Monitor, Speaker, Trash2, CheckCircle } from 'lucide-react';
import Loader from '../../ui/Loader';
import Button from '../../ui/Button';

const DevicesSection: React.FC = () => {
    const { user, loading, removeDevice } = useUser();
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
        <div>
            <SectionHeader
                title="Connected Devices"
                description="Manage devices that have access to your Gnani account."
            />

            <div className="space-y-4">
                {user.devices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="p-4 bg-jarvis-blue/5 rounded-sm border border-jarvis-border/30 mb-4">
                            <Monitor size={32} className="text-jarvis-cyan/40" />
                        </div>
                        <p className="text-jarvis-cyan/60 font-mono text-sm">
                            No devices connected to your account.
                        </p>
                    </div>
                ) : (
                    user.devices.map((device) => (
                        <div
                            key={device.deviceId}
                            className="flex items-center justify-between bg-jarvis-panel border border-jarvis-border rounded-sm p-4 hover:bg-jarvis-blue/10 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-jarvis-blue/10 rounded-sm text-jarvis-blue border border-jarvis-blue/30">
                                    {getDeviceIcon(device.deviceType)}
                                </div>
                                <div>
                                    <h4 className="text-jarvis-text font-medium flex items-center gap-2 font-mono tracking-wide">
                                        {device.deviceName}
                                        {device.isTrusted && (
                                            <CheckCircle size={14} className="text-jarvis-success" />
                                        )}
                                    </h4>
                                    <p className="text-xs text-jarvis-cyan/60 font-mono">
                                        Last active: {formatDate(device.lastActive)}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleRemoveDevice(device.deviceId)}
                                disabled={removingDeviceId === device.deviceId}
                                isLoading={removingDeviceId === device.deviceId}
                                icon={!removingDeviceId && <Trash2 size={16} />}
                            >
                                {removingDeviceId !== device.deviceId && "REMOVE"}
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DevicesSection;
