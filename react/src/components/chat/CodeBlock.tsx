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
    language: string;
    code: string;
    showLineNumbers?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
    language,
    code,
    showLineNumbers = false
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const normalizedLang = normalizeLanguage(language);

    return (
        <div className="code-block relative group my-4 rounded-lg overflow-hidden border border-cyan-500/20 shadow-lg shadow-cyan-900/10 transition-all hover:border-cyan-500/40">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-cyan-950/40 border-b border-cyan-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <span data-testid="language-label" className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                        {normalizedLang}
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-cyan-500 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all duration-200"
                    title="Copy code"
                >
                    {copied ? (
                        <>
                            <Check size={14} className="text-green-400" />
                            <span className="text-green-400 font-medium">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={14} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code Content */}
            <div className="relative bg-[#0a0a0a]/80">
                <Suspense fallback={
                    <pre className="p-4 m-0 text-sm text-gray-300 bg-transparent overflow-auto font-mono">
                        {code}
                    </pre>
                }>
                    {/* @ts-ignore */}
                    <SyntaxHighlighter
                        language={normalizedLang}
                        style={jarvisCodeTheme}
                        showLineNumbers={showLineNumbers}
                        customStyle={{
                            margin: 0,
                            padding: '1rem',
                            background: 'transparent',
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                        }}
                        codeTagProps={{
                            style: {
                                fontFamily: '"Fira Code", "Courier New", monospace',
                            }
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
