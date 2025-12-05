export interface ActiveWindowInfo {
    title: string | null;
    owner: {
        name: string | null;
        processId: number | null;
        path: string | null;
    };
    timestamp: number;
}

export interface SystemStatus {
    cpu: {
        usage: number;
        cores: number;
        speed: number;
    };
    memory: {
        total: number;
        used: number;
        free: number;
        usagePercent: number;
    };
    disk: Array<{
        fs: string;
        type: string;
        size: number;
        used: number;
        available: number;
        usagePercent: number;
        mount: string;
    }>;
    uptime: number;
    timestamp: number;
}

export interface BatteryStatus {
    hasBattery: boolean;
    isCharging: boolean;
    level: number;
    timeRemaining: number | null;
    onAC: boolean;
    onBattery: boolean;
    timestamp: number;
}

export interface ConnectivityStatus {
    online: boolean;
    latency: number | null;
    timestamp: number;
}

export interface AudioDevices {
    input: Array<{
        id: string;
        label: string;
        kind: string;
    }>;
    output: Array<{
        id: string;
        label: string;
        kind: string;
    }>;
    timestamp: number;
}
