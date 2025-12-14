import { useEffect, useState } from 'react';
import { useThemeStore } from '../store/themeStore';

interface ThemeColors {
    primary: string;
    secondary: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    typePrimary: string;
    typeSecondary: string;
    typeMuted: string;
    canvasApp: string;
    canvasPanel: string;
    canvasSurface: string;
    lineBase: string;
    voiceBgIdleStart: string;
    voiceBgIdleEnd: string;
    voiceBgListeningStart: string;
    voiceBgListeningEnd: string;
    voiceBgThinkingStart: string;
    voiceBgThinkingEnd: string;
    voiceBgSpeakingStart: string;
    voiceBgSpeakingEnd: string;
    voiceBlobListening: string;
    voiceBlobThinking: string;
    voiceBlobSpeaking: string;
}

export const useThemeColors = (): ThemeColors => {
    const { theme } = useThemeStore();
    const [colors, setColors] = useState<ThemeColors>({
        primary: '#00E5FF',
        secondary: '#0ea5e9',
        success: '#00FF99',
        error: '#FF3333',
        warning: '#FFB74D',
        info: '#29B6F6',
        typePrimary: '#E0F7FA',
        typeSecondary: '#94A3B8',
        typeMuted: '#64748B',
        canvasApp: '#050A14',
        canvasPanel: '#0A192F',
        canvasSurface: '#0f172a',
        lineBase: 'rgba(0, 240, 255, 0.2)',
        voiceBgIdleStart: '#020617',
        voiceBgIdleEnd: '#172554',
        voiceBgListeningStart: '#022c22',
        voiceBgListeningEnd: '#0d9488',
        voiceBgThinkingStart: '#2e1065',
        voiceBgThinkingEnd: '#7e22ce',
        voiceBgSpeakingStart: '#172554',
        voiceBgSpeakingEnd: '#3b82f6',
        voiceBlobListening: '#2dd4bf',
        voiceBlobThinking: '#d8b4fe',
        voiceBlobSpeaking: '#60a5fa',
    });

    useEffect(() => {
        const getVar = (name: string) => {
            const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
            return value || '';
        };

        const updateColors = () => {
            setColors({
                primary: getVar('--gnani-primary') || '#00E5FF',
                secondary: getVar('--gnani-secondary') || '#0ea5e9',
                success: getVar('--status-success') || '#00FF99',
                error: getVar('--status-error') || '#FF3333',
                warning: getVar('--status-warning') || '#FFB74D',
                info: getVar('--status-info') || '#29B6F6',
                typePrimary: getVar('--type-primary') || '#E0F7FA',
                typeSecondary: getVar('--type-secondary') || '#94A3B8',
                typeMuted: getVar('--type-muted') || '#64748B',
                canvasApp: getVar('--canvas-app') || '#050A14',
                canvasPanel: getVar('--canvas-panel') || '#0A192F',
                canvasSurface: getVar('--bg-surface') || '#0f172a',
                lineBase: getVar('--line-base') || 'rgba(0, 240, 255, 0.2)',
                voiceBgIdleStart: getVar('--voice-bg-idle-start') || '#020617',
                voiceBgIdleEnd: getVar('--voice-bg-idle-end') || '#172554',
                voiceBgListeningStart: getVar('--voice-bg-listening-start') || '#022c22',
                voiceBgListeningEnd: getVar('--voice-bg-listening-end') || '#0d9488',
                voiceBgThinkingStart: getVar('--voice-bg-thinking-start') || '#2e1065',
                voiceBgThinkingEnd: getVar('--voice-bg-thinking-end') || '#7e22ce',
                voiceBgSpeakingStart: getVar('--voice-bg-speaking-start') || '#172554',
                voiceBgSpeakingEnd: getVar('--voice-bg-speaking-end') || '#3b82f6',
                voiceBlobListening: getVar('--voice-blob-listening') || '#2dd4bf',
                voiceBlobThinking: getVar('--voice-blob-thinking') || '#d8b4fe',
                voiceBlobSpeaking: getVar('--voice-blob-speaking') || '#60a5fa',
            });
        };

        // Initial update
        updateColors();

        // Optional: Observe theme attribute changes if needed, but dependency on 'theme' key is usually enough
        // provided the CSS vars update synchronously with the class change.
        const observer = new MutationObserver(updateColors);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => observer.disconnect();
    }, [theme]);

    return colors;
};
