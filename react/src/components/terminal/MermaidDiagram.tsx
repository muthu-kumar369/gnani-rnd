import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { useThemeColors } from '../../hooks/useThemeColors';

interface MermaidDiagramProps {
    chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
    const colors = useThemeColors();

    useEffect(() => {
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
                background: colors.canvasApp,
                mainBkg: colors.canvasApp,
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

        if (elementRef.current) {
            try {
                // Clear previous content
                elementRef.current.innerHTML = '';

                // Render the diagram
                mermaid.render(idRef.current, chart).then(({ svg }: { svg: string }) => {
                    if (elementRef.current) {
                        elementRef.current.innerHTML = svg;
                    }
                }).catch((error: any) => {
                    console.error('Mermaid rendering error:', error);
                    if (elementRef.current) {
                        elementRef.current.innerHTML = `
                            <div class="text-status-error text-sm p-4 border border-status-error/30 rounded bg-status-error/10">
                                <strong>Diagram Error:</strong> ${error.message || 'Failed to render diagram'}
                            </div>
                        `;
                    }
                });
            } catch (error: any) {
                console.error('Mermaid error:', error);
                if (elementRef.current) {
                    elementRef.current.innerHTML = `
                        <div class="text-status-error text-sm p-4 border border-status-error/30 rounded bg-status-error/10">
                            <strong>Diagram Error:</strong> ${error.message || 'Failed to render diagram'}
                        </div>
                    `;
                }
            }
        }
    }, [chart, colors]);

    return (
        <div
            ref={elementRef}
            className="mermaid-diagram my-4 p-4 bg-canvas-panel border border-line-base rounded-lg overflow-x-auto"
        />
    );
};

export default MermaidDiagram;
