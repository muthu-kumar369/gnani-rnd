import React, { useState, lazy, Suspense } from 'react';
import { Check, Copy } from 'lucide-react';
import { jarvisCodeTheme, normalizeLanguage } from '../../styles/jarvisCodeTheme';

// Lazy load syntax highlighter for better performance
const SyntaxHighlighter = lazy(() =>
    // @ts-ignore
    import('react-syntax-highlighter').then(module => ({
        default: module.Prism
    }))
);

interface CodeBlockProps {
    code: string;
    language: string;
    fileName?: string;
    showLineNumbers?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
    code,
    language,
    fileName,
    showLineNumbers = true
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const normalizedLang = normalizeLanguage(language);
    const lineCount = code.split('\n').length;
    const shouldShowLineNumbers = showLineNumbers && lineCount > 5;

    return (
        <div className="code-block-wrapper group">
            <div className="code-header">
                <div className="code-info">
                    {fileName && <span className="file-name">{fileName}</span>}
                    <span className="language-badge">{normalizedLang}</span>
                </div>
                <button onClick={handleCopy} className="copy-code-btn">
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy code'}
                </button>
            </div>
            <div className="code-content">
                <Suspense fallback={
                    <pre className="code-loading" style={{
                        padding: '1rem',
                        margin: 0,
                        background: '#0a0a0a',
                        color: '#e0e0e0',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        overflow: 'auto'
                    }}>
                        {code}
                    </pre>
                }>
                    {/* @ts-ignore */}
                    <SyntaxHighlighter
                        language={normalizedLang}
                        style={jarvisCodeTheme}
                        showLineNumbers={shouldShowLineNumbers}
                        customStyle={{
                            margin: 0,
                            padding: '1rem',
                            background: '#0a0a0a',
                            fontSize: '13px',
                            lineHeight: '1.6',
                        }}
                        lineNumberStyle={{
                            color: '#4a5568',
                            minWidth: '2.5em',
                            paddingRight: '1em',
                            textAlign: 'right',
                            userSelect: 'none',
                        }}
                        wrapLines={true}
                        wrapLongLines={true}
                    >
                        {code.replace(/\n$/, '')}
                    </SyntaxHighlighter>
                </Suspense>
            </div>
        </div>
    );
};

export default CodeBlock;
