import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
    chart: string;
}

// Initialize mermaid with dark theme
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
        background: '#0c1e25',
        mainBkg: '#0c1e25',
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
    },
    sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35
    }
});

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        if (elementRef.current) {
            try {
                // Clear previous content
                elementRef.current.innerHTML = '';

                // Render the diagram
                mermaid.render(idRef.current, chart).then(({ svg }) => {
                    if (elementRef.current) {
                        elementRef.current.innerHTML = svg;
                    }
                }).catch((error) => {
                    console.error('Mermaid rendering error:', error);
                    if (elementRef.current) {
                        elementRef.current.innerHTML = `
                            <div class="text-red-400 text-sm p-4 border border-red-500/30 rounded bg-red-900/10">
                                <strong>Diagram Error:</strong> ${error.message || 'Failed to render diagram'}
                            </div>
                        `;
                    }
                });
            } catch (error: any) {
                console.error('Mermaid error:', error);
                if (elementRef.current) {
                    elementRef.current.innerHTML = `
                        <div class="text-red-400 text-sm p-4 border border-red-500/30 rounded bg-red-900/10">
                            <strong>Diagram Error:</strong> ${error.message || 'Failed to render diagram'}
                        </div>
                    `;
                }
            }
        }
    }, [chart]);

    return (
        <div
            ref={elementRef}
            className="mermaid-diagram my-4 p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-lg overflow-x-auto"
        />
    );
};

export default MermaidDiagram;
