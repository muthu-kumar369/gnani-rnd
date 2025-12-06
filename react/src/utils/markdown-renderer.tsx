// @ts-ignore
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import remarkGfm from 'remark-gfm';
// @ts-ignore
import remarkMath from 'remark-math';
// @ts-ignore
import rehypeKatex from 'rehype-katex';
// @ts-ignore
import rehypeRaw from 'rehype-raw';
import CodeBlock from '../components/terminal/CodeBlock';
import MermaidDiagram from '../components/terminal/MermaidDiagram';
import 'katex/dist/katex.min.css';

// Custom component for code blocks
const CustomCodeBlock = ({ inline, className, children, node }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    if (inline) {
        return (
            <code className="px-1.5 py-0.5 bg-cyan-900/30 text-cyan-300 rounded text-xs font-mono border border-cyan-500/20">
                {children}
            </code>
        );
    }

    // Handle Mermaid diagrams
    if (language === 'mermaid') {
        return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
    }

    return (
        <CodeBlock
            code={String(children).replace(/\n$/, '')}
            language={language}
            fileName=""
        />
    );
};

// Custom component for tables
const CustomTable = ({ children }: any) => (
    <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse border border-cyan-500/30 rounded-lg overflow-hidden">
            {children}
        </table>
    </div>
);

// Custom component for table headers
const CustomTableHeader = ({ children }: any) => (
    <th className="px-4 py-2 bg-cyan-900/30 border border-cyan-500/30 text-left text-xs font-bold uppercase tracking-wider text-cyan-400">
        {children}
    </th>
);

// Custom component for table cells
const CustomTableCell = ({ children }: any) => (
    <td className="px-4 py-2 border border-cyan-500/20 text-sm text-cyan-200/90">
        {children}
    </td>
);

// Custom component for checkboxes (task lists)
const CustomCheckbox = ({ checked, ...props }: any) => (
    <input
        type="checkbox"
        checked={checked}
        disabled
        className="mr-2 w-4 h-4 rounded border-2 border-cyan-500/50 bg-transparent checked:bg-cyan-500 checked:border-cyan-500 cursor-default"
        {...props}
    />
);

// Custom component for blockquotes
const CustomBlockquote = ({ children }: any) => (
    <blockquote className="border-l-4 border-cyan-500/50 pl-4 py-2 my-4 bg-cyan-900/10 italic text-cyan-200/80">
        {children}
    </blockquote>
);

// Custom component for links
const CustomLink = ({ href, children }: any) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/30 hover:decoration-cyan-400 transition-colors"
    >
        {children}
    </a>
);

// Custom component for lists
const CustomList = ({ ordered, children }: any) => {
    const Component = ordered ? 'ol' : 'ul';
    return (
        <Component className={`my-2 ml-6 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-cyan-500/70 space-y-1`}>
            {children}
        </Component>
    );
};

// Custom component for list items
const CustomListItem = ({ children, ...props }: any) => (
    <li className="text-cyan-200/90 text-sm leading-relaxed" {...props}>
        {children}
    </li>
);

// Custom component for paragraphs
// Fixed to use div instead of p when containing code blocks to prevent HTML nesting errors
const CustomParagraph = ({ children, node }: any) => {
    // Check if paragraph contains code blocks or pre elements
    // In HTML, <p> cannot contain <div> or <pre>, so use <div> instead
    const hasCodeBlock = node?.children?.some((child: any) =>
        child.tagName === 'code' || child.tagName === 'pre' ||
        (child.type === 'element' && (child.tagName === 'div' || child.tagName === 'pre'))
    );

    if (hasCodeBlock) {
        return <div className="text-sm text-cyan-200/90 leading-relaxed my-2">{children}</div>;
    }

    return <p className="text-sm text-cyan-200/90 leading-relaxed my-2">{children}</p>;
};

// Custom component for horizontal rules
const CustomHr = () => (
    <hr className="my-4 border-t border-cyan-500/30" />
);

// Main markdown renderer function
export const renderMarkdown = (content: string) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            components={{
                code: CustomCodeBlock,
                table: CustomTable,
                th: CustomTableHeader,
                td: CustomTableCell,
                input: CustomCheckbox,
                blockquote: CustomBlockquote,
                a: CustomLink,
                ul: CustomList,
                ol: CustomList,
                li: CustomListItem,
                h1: ({ children }: any) => <h1 className="text-2xl font-bold text-cyan-400 mt-4 mb-2 tracking-wide">{children}</h1>,
                h2: ({ children }: any) => <h2 className="text-xl font-bold text-cyan-400 mt-4 mb-2 tracking-wide">{children}</h2>,
                h3: ({ children }: any) => <h3 className="text-lg font-bold text-cyan-400 mt-4 mb-2 tracking-wide">{children}</h3>,
                h4: ({ children }: any) => <h4 className="text-base font-bold text-cyan-400 mt-4 mb-2 tracking-wide">{children}</h4>,
                h5: ({ children }: any) => <h5 className="text-sm font-bold text-cyan-400 mt-4 mb-2 tracking-wide">{children}</h5>,
                h6: ({ children }: any) => <h6 className="text-xs font-bold text-cyan-400 mt-4 mb-2 tracking-wide">{children}</h6>,
                p: CustomParagraph,
                hr: CustomHr,
            }}
        >
            {content}
        </ReactMarkdown>
    );
};
