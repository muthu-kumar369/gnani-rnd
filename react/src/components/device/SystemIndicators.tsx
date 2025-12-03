import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useDeviceAwareness } from '../../hooks/useDeviceAwareness';
import BatteryIcon from './BatteryIcon';

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
                    className="flex items-center gap-1 relative"
                    title={`Battery: ${batteryStatus.level}%${batteryStatus.isCharging ? ' (Charging)' : ''}`}
                >
                    <BatteryIcon level={batteryStatus.level} isCharging={batteryStatus.isCharging} size={16} />
                    <span className="text-[10px]">{batteryStatus.level}%</span>
                </div>
            )}
        </div>
    );
};

export default SystemIndicators;
