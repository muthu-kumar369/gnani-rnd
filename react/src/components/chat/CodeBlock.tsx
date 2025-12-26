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
        <div className="code-block relative group my-4 rounded-lg overflow-hidden border transition-all duration-300 border-black/5 dark:border-white/10 shadow-lg dark:shadow-none hover:border-black/10 dark:hover:border-white/20">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-[#1a2639] border-b border-black/5 dark:border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <span data-testid="language-label" className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        {normalizedLang}
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all duration-200 text-gray-500 hover:text-gray-900 hover:bg-black/5 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
                    title="Copy code"
                >
                    {copied ? (
                        <>
                            <Check size={14} className="text-emerald-500 dark:text-emerald-400" />
                            <span className="text-emerald-500 dark:text-emerald-400 font-medium">Copied!</span>
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
            <div className="relative bg-white dark:bg-[#0d1520]">
                <Suspense fallback={
                    <pre className="p-4 m-0 text-sm overflow-auto font-mono text-gray-800 dark:text-gray-300 bg-transparent">
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
                        PreTag="div"
                    >
                        {code.replace(/\n$/, '')}
                    </SyntaxHighlighter>
                </Suspense>
            </div>
        </div>
    );
};

export default CodeBlock;
