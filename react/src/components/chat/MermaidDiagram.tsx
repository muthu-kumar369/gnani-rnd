import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
    chart: string;
}

// Initialize mermaid with Jarvis theme
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
        primaryColor: '#0891b2', // cyan-600
        primaryTextColor: '#a5f3fc', // cyan-200
        primaryBorderColor: '#22d3ee', // cyan-500
        lineColor: '#67e8f9', // cyan-300
        secondaryColor: '#164e63', // cyan-900
        tertiaryColor: '#083344', // cyan-950
        background: 'transparent', // Transparent to blend with chat bubble
        mainBkg: 'transparent',
        secondBkg: '#164e63',
        textColor: '#a5f3fc',
        border1: '#22d3ee',
        border2: '#0891b2',
        fontSize: '14px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
    },
    flowchart: {
        htmlLabels: true,
        curve: 'basis'
    }
});

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const [renderError, setRenderError] = useState<string | null>(null);
    const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        if (!elementRef.current || !chart) return;

        const renderDiagram = async () => {
            try {
                // Clear previous error
                setRenderError(null);

                // Render
                const { svg } = await mermaid.render(idRef.current, chart);

                if (elementRef.current) {
                    elementRef.current.innerHTML = svg;
                }
            } catch (error: any) {
                console.error('Mermaid rendering error:', error);
                setRenderError(error.message || 'Failed to render diagram');
            }
        };

        renderDiagram();
    }, [chart]);

    if (renderError) {
        return (
            <div className="text-red-400 text-xs p-3 border border-red-500/30 rounded bg-red-900/10 font-mono my-2">
                <strong>Diagram Error:</strong> {renderError}
                <pre className="mt-2 text-[10px] opacity-70 overflow-auto whitespace-pre-wrap">{chart}</pre>
            </div>
        );
    }

    return (
        <div
            ref={elementRef}
            className="mermaid-diagram my-4 p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-lg overflow-x-auto flex justify-center backdrop-blur-sm"
        />
    );
};

export default MermaidDiagram;
