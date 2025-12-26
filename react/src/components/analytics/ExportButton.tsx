import React, { useState } from 'react';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import api from '../../api/client';
import { useThemeStore } from '../../store/themeStore';

export const ExportButton: React.FC = () => {
    const [exporting, setExporting] = useState(false);
    const { theme } = useThemeStore();

    const handleExport = async (format: 'csv' | 'json') => {
        setExporting(true);
        try {
            const response = await import('../../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                api.get(`/analytics/export?format=${format}`, {
                    responseType: 'blob' // Important for file download
                })
            ));

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `gnani_export_${new Date().toISOString()}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed', error);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${theme === 'dark'
                    ? 'bg-black/30 hover:bg-black/50 border-white/10 text-white/80'
                    : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                    }`}
            >
                {exporting ? <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${theme === 'dark' ? 'border-white/30' : 'border-gray-400'}`} /> : <FileSpreadsheet size={16} />}
                CSV
            </button>
            <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${theme === 'dark'
                    ? 'bg-black/30 hover:bg-black/50 border-white/10 text-white/80'
                    : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                    }`}
            >
                {exporting ? <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${theme === 'dark' ? 'border-white/30' : 'border-gray-400'}`} /> : <FileJson size={16} />}
                JSON
            </button>
        </div>
    );
};
