// Custom Jarvis HUD theme for code syntax highlighting
export const jarvisCodeTheme = {
    'code[class*="language-"]': {
        color: '#e0e0e0',
        background: 'none',
        fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
        fontSize: '13px',
        textAlign: 'left' as const,
        whiteSpace: 'pre' as const,
        wordSpacing: 'normal',
        wordBreak: 'normal' as const,
        wordWrap: 'normal' as const,
        lineHeight: '1.6',
        tabSize: 4,
        hyphens: 'none' as const,
    },
    'pre[class*="language-"]': {
        color: '#e0e0e0',
        background: '#0a0a0a',
        fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
        fontSize: '13px',
        textAlign: 'left' as const,
        whiteSpace: 'pre' as const,
        wordSpacing: 'normal',
        wordBreak: 'normal' as const,
        wordWrap: 'normal' as const,
        lineHeight: '1.6',
        tabSize: 4,
        hyphens: 'none' as const,
        padding: '1em',
        margin: '0',
        overflow: 'auto',
        borderRadius: '0 0 8px 8px',
    },
    'comment': { color: '#6a9955', fontStyle: 'italic' },
    'prolog': { color: '#6a9955' },
    'doctype': { color: '#6a9955' },
    'cdata': { color: '#6a9955' },
    'punctuation': { color: '#d4d4d4' },
    'property': { color: '#9cdcfe' },
    'tag': { color: '#569cd6' },
    'boolean': { color: '#569cd6' },
    'number': { color: '#b5cea8' },
    'constant': { color: '#4fc1ff' },
    'symbol': { color: '#4fc1ff' },
    'deleted': { color: '#f44747' },
    'selector': { color: '#d7ba7d' },
    'attr-name': { color: '#9cdcfe' },
    'string': { color: '#ce9178' },
    'char': { color: '#ce9178' },
    'builtin': { color: '#4ec9b0' },
    'inserted': { color: '#4ec9b0' },
    'operator': { color: '#d4d4d4' },
    'entity': { color: '#d7ba7d', cursor: 'help' },
    'url': { color: '#3b8eea' },
    'variable': { color: '#9cdcfe' },
    'atrule': { color: '#c586c0' },
    'attr-value': { color: '#ce9178' },
    'function': { color: '#dcdcaa' },
    'class-name': { color: '#4ec9b0' },
    'keyword': { color: '#00ffff', fontWeight: '600' }, // Jarvis cyan for keywords
    'regex': { color: '#d16969' },
    'important': { color: '#f44747', fontWeight: 'bold' },
    'bold': { fontWeight: 'bold' },
    'italic': { fontStyle: 'italic' },
};

// Language normalization map
export const normalizeLanguage = (lang: string): string => {
    const langMap: Record<string, string> = {
        'js': 'javascript',
        'ts': 'typescript',
        'py': 'python',
        'rb': 'ruby',
        'sh': 'bash',
        'shell': 'bash',
        'yml': 'yaml',
        'md': 'markdown',
        'jsx': 'javascript',
        'tsx': 'typescript',
        'dockerfile': 'docker',
        'makefile': 'makefile',
        'conf': 'nginx',
        'config': 'nginx',
    };

    const normalized = lang?.toLowerCase() || 'text';
    return langMap[normalized] || normalized;
};

// Simple language detection fallback
export const detectLanguage = (code: string): string => {
    // Check for common patterns
    if (code.includes('function') || code.includes('const ') || code.includes('let ') || code.includes('var ')) {
        return 'javascript';
    }
    if (code.includes('def ') || code.includes('import ') || code.includes('from ')) {
        return 'python';
    }
    if (code.includes('<?php')) {
        return 'php';
    }
    if (code.includes('SELECT ') || code.includes('FROM ') || code.includes('WHERE ')) {
        return 'sql';
    }
    if (code.includes('public class ') || code.includes('private ')) {
        return 'java';
    }
    if (code.includes('<html') || code.includes('<!DOCTYPE')) {
        return 'html';
    }

    return 'text';
};
