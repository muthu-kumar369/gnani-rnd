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
        if (!val) return 'text-type-muted';
        if (val > 80) return 'text-status-error';
        if (val > 50) return 'text-status-warning';
        return 'text-gnani-primary';
    };

    const StatItem = ({ icon: Icon, label, value, colorClass }: { icon: any, label: string, value: string, colorClass: string }) => (
        <div className="flex flex-col items-center justify-center min-w-[50px] relative group">
            <div className="flex items-center gap-1.5 mb-1">
                <Icon size={14} className="text-gnani-primary/70 group-hover:text-gnani-secondary transition-colors" />
                <span className="text-[9px] font-bold text-type-muted uppercase tracking-wider font-mono">{label}</span>
            </div>
            <span className={`text-xs font-bold font-mono ${colorClass} tabular-nums text-glow`}>
                {value}
            </span>
            {/* Mini Bar Graph */}
            <div className="w-full h-[2px] bg-glass-shimmer mt-1 rounded-full overflow-hidden">
                <div
                    className={`h-full ${colorClass.replace('text-', 'bg-')}`}
                    style={{ width: value === '--' ? '0%' : value }}
                />
            </div>
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
                        className="flex items-center gap-4 px-6 py-3 bg-canvas-panel/80 border border-glass-border backdrop-blur-md rounded-full overflow-hidden relative"
                    >
                        {/* Scanline Effect - Subtle overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-glass-shimmer/10 to-transparent w-[50%] animate-scan pointer-events-none" />

                        <StatItem
                            icon={Cpu}
                            label="CPU"
                            value={formatPercent(systemStatus?.cpu.usage)}
                            colorClass={getUsageColor(systemStatus?.cpu.usage)}
                        />

                        <div className="w-px h-8 bg-glass-border" />

                        <StatItem
                            icon={HardDrive}
                            label="RAM"
                            value={formatPercent(systemStatus?.memory.usagePercent)}
                            colorClass={getUsageColor(systemStatus?.memory.usagePercent)}
                        />

                        <div className="w-px h-8 bg-glass-border" />

                        <div className="flex flex-col items-center justify-center min-w-[50px] group">
                            <div className="flex items-center gap-1.5 mb-1 relative">
                                <BatteryIcon level={batteryStatus?.level || 0} isCharging={batteryStatus?.isCharging || false} size={16} />
                                <span className="text-[9px] font-bold text-type-muted uppercase tracking-wider font-mono">BAT</span>
                            </div>
                            <span className={`text-xs font-bold font-mono ${batteryStatus?.level && batteryStatus.level < 20 ? 'text-status-error' : 'text-gnani-primary'} tabular-nums text-glow`}>
                                {formatPercent(batteryStatus?.level)}
                            </span>
                            <div className="w-full h-[2px] bg-glass-shimmer mt-1 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${batteryStatus?.level && batteryStatus.level < 20 ? 'bg-status-error' : 'bg-gnani-primary'}`}
                                    style={{ width: `${batteryStatus?.level || 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="w-px h-8 bg-glass-border" />

                        <div className="flex flex-col items-center justify-center min-w-[50px] group">
                            <div className="flex items-center gap-1.5 mb-1">
                                {connectivityStatus?.online ?
                                    <Wifi size={14} className="text-gnani-primary/70 group-hover:text-gnani-secondary" /> :
                                    <WifiOff size={14} className="text-status-error/70" />
                                }
                                <span className="text-[9px] font-bold text-type-muted uppercase tracking-wider font-mono">NET</span>
                            </div>
                            <span className={`text-xs font-bold font-mono ${connectivityStatus?.online ? 'text-status-success' : 'text-status-error'} text-glow`}>
                                {connectivityStatus?.online ? 'ON' : 'OFF'}
                            </span>
                            <div className="w-full h-[2px] bg-glass-shimmer mt-1 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${connectivityStatus?.online ? 'bg-status-success' : 'bg-status-error'}`}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setIsExpanded(false)}
                            className="ml-2 p-1 hover:bg-glass-shimmer rounded-full transition-colors text-type-muted hover:text-gnani-primary"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </motion.div>
                ) : (
                    <motion.button
                        key="collapsed"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={() => setIsExpanded(true)}
                        className="p-3 bg-canvas-panel/80 border border-glass-border backdrop-blur-md rounded-full hover:bg-glass-shimmer transition-colors group border-glow"
                    >
                        <ChevronLeft size={18} className="text-gnani-primary group-hover:text-gnani-secondary" />
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DeviceStatsHUD;
