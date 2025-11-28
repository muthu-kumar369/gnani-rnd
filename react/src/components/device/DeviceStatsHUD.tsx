import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, HardDrive, Wifi, WifiOff, ChevronRight, ChevronLeft } from 'lucide-react';
import { useDeviceAwareness } from '../../hooks/useDeviceAwareness';
import BatteryIcon from './BatteryIcon';

const DeviceStatsHUD: React.FC = () => {
    const { systemStatus, batteryStatus, connectivityStatus } = useDeviceAwareness();
    const [isExpanded, setIsExpanded] = useState(true);

    // Helper to format percentage
    const formatPercent = (val?: number) => val ? `${Math.round(val)}%` : '--';

    // Helper to get color based on value (high usage = warning)
    const getUsageColor = (val?: number) => {
        if (!val) return 'text-white/40';
        if (val > 80) return 'text-red-400';
        if (val > 50) return 'text-yellow-400';
        return 'text-cyan-400';
    };

    const StatItem = ({ icon: Icon, label, value, colorClass }: { icon: any, label: string, value: string, colorClass: string }) => (
        <div className="flex flex-col items-center justify-center min-w-[40px]">
            <div className="flex items-center gap-1.5 mb-0.5">
                <Icon size={12} className="text-cyan-500/70" />
                <span className="text-[9px] font-bold text-cyan-500/50 uppercase tracking-wider">{label}</span>
            </div>
            <span className={`text-xs font-bold font-mono ${colorClass} tabular-nums`}>
                {value}
            </span>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center"
        >
            <AnimatePresence mode="wait">
                {isExpanded ? (
                    <motion.div
                        key="expanded"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-lg overflow-hidden"
                    >
                        <StatItem
                            icon={Cpu}
                            label="CPU"
                            value={formatPercent(systemStatus?.cpu.usage)}
                            colorClass={getUsageColor(systemStatus?.cpu.usage)}
                        />

                        <div className="w-px h-6 bg-white/10" />

                        <StatItem
                            icon={HardDrive}
                            label="RAM"
                            value={formatPercent(systemStatus?.memory.usagePercent)}
                            colorClass={getUsageColor(systemStatus?.memory.usagePercent)}
                        />

                        <div className="w-px h-6 bg-white/10" />

                        <div className="flex flex-col items-center justify-center min-w-[40px]">
                            <div className="flex items-center gap-1.5 mb-0.5 relative">
                                <BatteryIcon level={batteryStatus?.level || 0} isCharging={batteryStatus?.isCharging || false} size={16} />
                                <span className="text-[9px] font-bold text-cyan-500/50 uppercase tracking-wider">BAT</span>
                            </div>
                            <span className={`text-xs font-bold font-mono ${batteryStatus?.level && batteryStatus.level < 20 ? 'text-red-400' : 'text-cyan-400'} tabular-nums`}>
                                {formatPercent(batteryStatus?.level)}
                            </span>
                        </div>

                        <div className="w-px h-6 bg-white/10" />

                        <div className="flex flex-col items-center justify-center min-w-[40px]">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                {connectivityStatus?.online ?
                                    <Wifi size={12} className="text-cyan-500/70" /> :
                                    <WifiOff size={12} className="text-red-400/70" />
                                }
                                <span className="text-[9px] font-bold text-cyan-500/50 uppercase tracking-wider">NET</span>
                            </div>
                            <span className={`text-xs font-bold font-mono ${connectivityStatus?.online ? 'text-cyan-400' : 'text-red-400'}`}>
                                {connectivityStatus?.online ? 'ON' : 'OFF'}
                            </span>
                        </div>

                        <button
                            onClick={() => setIsExpanded(false)}
                            className="ml-1 p-1 hover:bg-white/5 rounded-full transition-colors text-white/30 hover:text-white/60"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </motion.div>
                ) : (
                    <motion.button
                        key="collapsed"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={() => setIsExpanded(true)}
                        className="p-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white/5 transition-colors group"
                    >
                        <ChevronLeft size={16} className="text-cyan-400 group-hover:text-cyan-300" />
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DeviceStatsHUD;
