import React, { useState } from 'react';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import api from '../../api/client';

export const ExportButton: React.FC = () => {
    const [exporting, setExporting] = useState(false);

    const handleExport = async (format: 'csv' | 'json') => {
        setExporting(true);
        try {
            const response = await api.get(`/analytics/export?format=${format}`, {
                responseType: 'blob' // Important for file download
            });

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
                className="flex items-center gap-2 px-3 py-1.5 bg-black/30 hover:bg-black/50 border border-white/10 rounded text-xs text-white/80 transition-colors disabled:opacity-50"
            >
                {exporting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileSpreadsheet size={14} />}
                CSV
            </button>
            <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="flex items-center gap-2 px-3 py-1.5 bg-black/30 hover:bg-black/50 border border-white/10 rounded text-xs text-white/80 transition-colors disabled:opacity-50"
            >
                {exporting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileJson size={14} />}
                JSON
            </button>
        </div>
    );
};
