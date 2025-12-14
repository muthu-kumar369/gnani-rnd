// Custom Jarvis HUD theme for code syntax highlighting
// Updated to use semantic CSS variables for Light/Dark mode support
export const jarvisCodeTheme = {
    'code[class*="language-"]': {
        color: 'rgb(var(--type-primary))',
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
        color: 'rgb(var(--type-primary))',
        background: 'rgb(var(--canvas-app))',
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
    'comment': { color: 'var(--syntax-comment)', fontStyle: 'italic' },
    'prolog': { color: 'var(--syntax-comment)' },
    'doctype': { color: 'var(--syntax-comment)' },
    'cdata': { color: 'var(--syntax-comment)' },
    'punctuation': { color: 'rgb(var(--line-base))' },
    'property': { color: 'var(--syntax-variable)' },
    'tag': { color: 'var(--syntax-class)' },
    'boolean': { color: 'var(--syntax-keyword)' },
    'number': { color: 'var(--syntax-number)' },
    'constant': { color: 'var(--syntax-variable)' },
    'symbol': { color: 'var(--syntax-variable)' },
    'deleted': { color: 'rgb(var(--status-error))' },
    'selector': { color: 'var(--syntax-function)' },
    'attr-name': { color: 'var(--syntax-variable)' },
    'string': { color: 'var(--syntax-string)' },
    'char': { color: 'var(--syntax-string)' },
    'builtin': { color: 'var(--syntax-class)' },
    'inserted': { color: 'rgb(var(--status-success))' },
    'operator': { color: 'var(--syntax-operator)' },
    'entity': { color: 'var(--syntax-function)', cursor: 'help' },
    'url': { color: 'var(--syntax-string)' },
    'variable': { color: 'var(--syntax-variable)' },
    'atrule': { color: 'var(--syntax-keyword)' },
    'attr-value': { color: 'var(--syntax-string)' },
    'function': { color: 'var(--syntax-function)' },
    'class-name': { color: 'var(--syntax-class)' },
    'keyword': { color: 'var(--syntax-keyword)', fontWeight: '600' },
    'regex': { color: 'var(--syntax-string)' },
    'important': { color: 'rgb(var(--status-error))', fontWeight: 'bold' },
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
