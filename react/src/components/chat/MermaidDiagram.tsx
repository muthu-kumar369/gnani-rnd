import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useThemeColors } from '../../hooks/useThemeColors';

interface MermaidDiagramProps {
    chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const [renderError, setRenderError] = useState<string | null>(null);
    const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
    const colors = useThemeColors();

    useEffect(() => {
        // Initialize with dynamic theme
        mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: {
                primaryColor: colors.primary,
                primaryTextColor: colors.typePrimary,
                primaryBorderColor: colors.primary,
                lineColor: colors.lineBase,
                secondaryColor: colors.secondary,
                tertiaryColor: colors.canvasSurface,
                background: 'transparent', // Transparent for chat bubbles
                mainBkg: 'transparent',
                secondBkg: colors.canvasPanel,
                textColor: colors.typePrimary,
                border1: colors.primary,
                border2: colors.secondary,
                fontSize: '14px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
            },
            flowchart: {
                htmlLabels: true,
                curve: 'basis'
            }
        });

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
    }, [chart, colors]);

    if (renderError) {
        return (
            <div className="text-status-error text-xs p-3 border border-status-error/30 rounded bg-status-error/10 font-mono my-2">
                <strong>Diagram Error:</strong> {renderError}
                <pre className="mt-2 text-[10px] opacity-70 overflow-auto whitespace-pre-wrap">{chart}</pre>
            </div>
        );
    }

    return (
        <div
            ref={elementRef}
            className="mermaid-diagram my-4 p-4 bg-gnani-primary/10 border border-gnani-primary/20 rounded-lg overflow-x-auto flex justify-center backdrop-blur-sm"
        />
    );
};

export default MermaidDiagram;
