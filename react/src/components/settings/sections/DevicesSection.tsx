import React, { useState } from 'react';
import { useUser } from '../../../context/UserContext';
import SectionHeader from '../SectionHeader';
import { Smartphone, Laptop, Monitor, Speaker, Trash2, CheckCircle } from 'lucide-react';

const DevicesSection: React.FC = () => {
    const { user, loading, removeDevice } = useUser();
    const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);

    if (loading || !user) return <div className="text-cyan-400">Loading devices...</div>;

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
        } catch (error) {
            console.error('Failed to remove device:', error);
            alert('Failed to remove device. Please try again.');
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
                {user.devices.map((device) => (
                    <div
                        key={device.deviceId}
                        className="flex items-center justify-between bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-4 hover:bg-cyan-900/20 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400">
                                {getDeviceIcon(device.deviceType)}
                            </div>
                            <div>
                                <h4 className="text-cyan-100 font-medium flex items-center gap-2">
                                    {device.deviceName}
                                    {device.isTrusted && (
                                        <CheckCircle size={14} className="text-green-400" />
                                    )}
                                </h4>
                                <p className="text-xs text-cyan-400/60">
                                    Last active: {formatDate(device.lastActive)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleRemoveDevice(device.deviceId)}
                            disabled={removingDeviceId === device.deviceId}
                            className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove Device"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DevicesSection;
