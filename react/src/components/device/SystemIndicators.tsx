import React from 'react';
import { Battery, Wifi, WifiOff } from 'lucide-react';
import { useDeviceAwareness } from '../../hooks/useDeviceAwareness';

const SystemIndicators: React.FC = () => {
    const { batteryStatus, connectivityStatus } = useDeviceAwareness();

    if (!batteryStatus && !connectivityStatus) return null;

    return (
        <div className="flex items-center gap-2 text-cyan-400/60">
            {/* Connectivity Indicator */}
            {connectivityStatus && (
                <div className="flex items-center gap-1" title={connectivityStatus.online ? 'Online' : 'Offline'}>
                    {connectivityStatus.online ? (
                        <Wifi size={14} className="text-green-400" />
                    ) : (
                        <WifiOff size={14} className="text-red-400" />
                    )}
                </div>
            )}

            {/* Battery Indicator */}
            {batteryStatus && batteryStatus.hasBattery && (
                <div
                    className="flex items-center gap-1"
                    title={`Battery: ${batteryStatus.level}%${batteryStatus.isCharging ? ' (Charging)' : ''}`}
                >
                    <Battery
                        size={14}
                        className={
                            batteryStatus.isCharging ? 'text-green-400' :
                                batteryStatus.level > 20 ? 'text-cyan-400' :
                                    'text-red-400'
                        }
                    />
                    <span className="text-[10px]">{batteryStatus.level}%</span>
                </div>
            )}
        </div>
    );
};

export default SystemIndicators;
