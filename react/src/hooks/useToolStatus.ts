import { useState, useEffect } from 'react';

export interface ToolStatus {
    tool_name: string;
    status: 'starting' | 'running' | 'completed' | 'failed';
    progress: number;
    message: string;
    elapsed_ms: number;
}

export const useToolStatus = () => {
    const [currentTool, setCurrentTool] = useState<ToolStatus | null>(null);

    useEffect(() => {
        const handleToolStatus = (_event: any, status: ToolStatus) => {
            console.log('Received tool status:', status);
            setCurrentTool(status);

            // Auto-hide after completion
            if (status.status === 'completed' || status.status === 'failed') {
                setTimeout(() => setCurrentTool(null), 3000);
            }
        };

        // @ts-ignore - Electron IPC
        window.electron?.ipcRenderer.on('tool:status', handleToolStatus);

        return () => {
            // @ts-ignore
            window.electron?.ipcRenderer.removeAllListeners('tool:status');
        };
    }, []);

    return currentTool;
};
