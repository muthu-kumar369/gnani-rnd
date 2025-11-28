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
        <div className="flex flex-col items-center justify-center min-w-[50px] relative group">
            <div className="flex items-center gap-1.5 mb-1">
                <Icon size={14} className="text-jarvis-cyan/70 group-hover:text-jarvis-blue transition-colors" />
                <span className="text-[9px] font-bold text-jarvis-cyan/50 uppercase tracking-wider font-mono">{label}</span>
            </div>
            <span className={`text-xs font-bold font-mono ${colorClass} tabular-nums text-glow`}>
                {value}
            </span>
            {/* Mini Bar Graph */}
            <div className="w-full h-[2px] bg-jarvis-panel mt-1 rounded-full overflow-hidden">
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
                        className="flex items-center gap-4 px-6 py-3 glass-panel rounded-full overflow-hidden relative"
                    >
                        {/* Scanline Effect */}
                        <div className="absolute inset-0 bg-scan animate-scan opacity-10 pointer-events-none" />

                        <StatItem
                            icon={Cpu}
                            label="CPU"
                            value={formatPercent(systemStatus?.cpu.usage)}
                            colorClass={getUsageColor(systemStatus?.cpu.usage)}
                        />

                        <div className="w-px h-8 bg-jarvis-border/50" />

                        <StatItem
                            icon={HardDrive}
                            label="RAM"
                            value={formatPercent(systemStatus?.memory.usagePercent)}
                            colorClass={getUsageColor(systemStatus?.memory.usagePercent)}
                        />

                        <div className="w-px h-8 bg-jarvis-border/50" />

                        <div className="flex flex-col items-center justify-center min-w-[50px] group">
                            <div className="flex items-center gap-1.5 mb-1 relative">
                                <BatteryIcon level={batteryStatus?.level || 0} isCharging={batteryStatus?.isCharging || false} size={16} />
                                <span className="text-[9px] font-bold text-jarvis-cyan/50 uppercase tracking-wider font-mono">BAT</span>
                            </div>
                            <span className={`text-xs font-bold font-mono ${batteryStatus?.level && batteryStatus.level < 20 ? 'text-jarvis-alert' : 'text-jarvis-blue'} tabular-nums text-glow`}>
                                {formatPercent(batteryStatus?.level)}
                            </span>
                            <div className="w-full h-[2px] bg-jarvis-panel mt-1 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${batteryStatus?.level && batteryStatus.level < 20 ? 'bg-jarvis-alert' : 'bg-jarvis-blue'}`}
                                    style={{ width: `${batteryStatus?.level || 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="w-px h-8 bg-jarvis-border/50" />

                        <div className="flex flex-col items-center justify-center min-w-[50px] group">
                            <div className="flex items-center gap-1.5 mb-1">
                                {connectivityStatus?.online ?
                                    <Wifi size={14} className="text-jarvis-cyan/70 group-hover:text-jarvis-blue" /> :
                                    <WifiOff size={14} className="text-jarvis-alert/70" />
                                }
                                <span className="text-[9px] font-bold text-jarvis-cyan/50 uppercase tracking-wider font-mono">NET</span>
                            </div>
                            <span className={`text-xs font-bold font-mono ${connectivityStatus?.online ? 'text-jarvis-success' : 'text-jarvis-alert'} text-glow`}>
                                {connectivityStatus?.online ? 'ON' : 'OFF'}
                            </span>
                            <div className="w-full h-[2px] bg-jarvis-panel mt-1 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${connectivityStatus?.online ? 'bg-jarvis-success' : 'bg-jarvis-alert'}`}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setIsExpanded(false)}
                            className="ml-2 p-1 hover:bg-jarvis-blue/10 rounded-full transition-colors text-jarvis-cyan/50 hover:text-jarvis-blue"
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
                        className="p-3 glass-panel rounded-full hover:bg-jarvis-blue/10 transition-colors group border-glow"
                    >
                        <ChevronLeft size={18} className="text-jarvis-blue group-hover:text-jarvis-cyan" />
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DeviceStatsHUD;
