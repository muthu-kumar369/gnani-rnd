# Stage 1.6: Code Syntax Highlighting

## Summary
Implement syntax highlighting for code blocks in assistant messages using Prism.js or Highlight.js. This significantly improves developer UX by making code more readable and professional-looking.

## Goals
- Add syntax highlighting to all code blocks in messages
- Support 50+ programming languages
- Auto-detect language from code fence
- Add line numbers for long code blocks
- Integrate with existing message rendering
- Match Jarvis HUD theme colors
- Optimize performance for large code blocks

## Files to Modify / Create

### Frontend
- `/src/components/Terminal/CodeBlock.tsx` → Update with syntax highlighting
- `/src/utils/markdown-renderer.ts` → **[NEW]** Custom markdown renderer with code highlighting
- `/src/styles/code-theme.css` → **[NEW]** Custom syntax highlighting theme
- `/src/components/Terminal/MessageBubble.tsx` → Use new markdown renderer

### Dependencies
- Add `react-syntax-highlighter` or `prismjs` package

## Detailed Implementation Instructions

### Step 1: Choose Syntax Highlighting Library

**Option A: react-syntax-highlighter (Recommended)**
- Pros: React-friendly, easy integration, many themes
- Cons: Larger bundle size

**Option B: Prism.js**
- Pros: Lightweight, highly customizable
- Cons: Requires manual theme setup

**Recommendation:** Use `react-syntax-highlighter` for easier integration.

### Step 2: Install Dependencies

```bash
npm install react-syntax-highlighter
npm install --save-dev @types/react-syntax-highlighter
```

### Step 3: Update CodeBlock Component
In `/src/components/Terminal/CodeBlock.tsx`:

```typescript
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  fileName?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ 
  code, 
  language, 
  showLineNumbers = true,
  fileName 
}) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Normalize language name
  const normalizedLang = normalizeLanguage(language);
  
  return (
    <div className="code-block-container">
      <div className="code-header">
        <div className="code-info">
          {fileName && <span className="file-name">{fileName}</span>}
          <span className="language-badge">{normalizedLang}</span>
        </div>
        <button onClick={handleCopy} className="copy-btn">
          {copied ? (
            <>
              <CheckIcon /> Copied!
            </>
          ) : (
            <>
              <CopyIcon /> Copy code
            </>
          )}
        </button>
      </div>
      
      <SyntaxHighlighter
        language={normalizedLang}
        style={customJarvisTheme}
        showLineNumbers={showLineNumbers && code.split('\n').length > 5}
        customStyle={{
          margin: 0,
          borderRadius: '0 0 8px 8px',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
        codeTagProps={{
          style: {
            fontFamily: "'Fira Code', 'Consolas', monospace"
          }
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

// Language normalization helper
const normalizeLanguage = (lang: string): string => {
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'sh': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    'jsx': 'javascript',
    'tsx': 'typescript'
  };
  
  return langMap[lang.toLowerCase()] || lang.toLowerCase();
};

export default CodeBlock;
```

### Step 4: Create Custom Jarvis Theme
Create `/src/styles/code-theme.css`:

```typescript
// In a separate file: /src/styles/jarvisCodeTheme.ts
export const customJarvisTheme = {
  'code[class*="language-"]': {
    color: '#e0e0e0',
    background: 'none',
    fontFamily: "'Fira Code', 'Consolas', monospace",
    fontSize: '14px',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: '4',
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#e0e0e0',
    background: '#1a1a1a',
    fontFamily: "'Fira Code', 'Consolas', monospace",
    fontSize: '14px',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: '4',
    hyphens: 'none',
    padding: '1em',
    margin: '.5em 0',
    overflow: 'auto',
  },
  'comment': { color: '#6a9955' },
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
  'keyword': { color: '#00ffff' }, // Jarvis cyan for keywords
  'regex': { color: '#d16969' },
  'important': { color: '#f44747', fontWeight: 'bold' },
  'bold': { fontWeight: 'bold' },
  'italic': { fontStyle: 'italic' },
};
```

### Step 5: Create Markdown Renderer with Code Highlighting
Create `/src/utils/markdown-renderer.ts`:

```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '../components/Terminal/CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : 'text';
          const code = String(children).replace(/\n$/, '');
          
          return !inline ? (
            <CodeBlock code={code} language={language} />
          ) : (
            <code className="inline-code" {...props}>
              {children}
            </code>
          );
        },
        // Custom renderers for other markdown elements
        a({ node, children, href, ...props }) {
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          );
        },
        table({ node, children, ...props }) {
          return (
            <div className="table-wrapper">
              <table {...props}>{children}</table>
            </div>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
```

### Step 6: Update MessageBubble to Use Markdown Renderer
In `/src/components/Terminal/MessageBubble.tsx`:

```typescript
import { MarkdownRenderer } from '../../utils/markdown-renderer';

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  return (
    <div className={`message-bubble ${message.role}`}>
      <div className="message-content">
        <MarkdownRenderer content={message.content} />
      </div>
    </div>
  );
};
```

### Step 7: Style Code Blocks
Create `/src/styles/code-theme.css`:

```css
.code-block-container {
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  background: #1a1a1a;
  border: 1px solid #333;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #404040;
}

.code-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-name {
  color: #9cdcfe;
  font-size: 13px;
  font-family: 'Fira Code', monospace;
}

.language-badge {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid #00ffff;
  border-radius: 4px;
  color: #00ffff;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 600;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid #00ffff;
  color: #00ffff;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  font-family: 'Inter', sans-serif;
}

.copy-btn:hover {
  background: rgba(0, 255, 255, 0.1);
  transform: translateY(-1px);
}

.copy-btn:active {
  transform: translateY(0);
}

/* Inline code */
.inline-code {
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.9em;
  color: #00ffff;
}

/* Line numbers */
.code-block-container .linenumber {
  color: #858585;
  min-width: 2.5em;
  padding-right: 1em;
  text-align: right;
  user-select: none;
}

/* Scrollbar styling for code blocks */
.code-block-container pre::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.code-block-container pre::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.code-block-container pre::-webkit-scrollbar-thumb {
  background: #404040;
  border-radius: 4px;
}

.code-block-container pre::-webkit-scrollbar-thumb:hover {
  background: #00ffff;
}
```

### Step 8: Add Language Detection Fallback
For code blocks without language specification:

```typescript
const detectLanguage = (code: string): string => {
  // Simple heuristics for common languages
  if (code.includes('function') || code.includes('const') || code.includes('let')) {
    return 'javascript';
  }
  if (code.includes('def ') || code.includes('import ')) {
    return 'python';
  }
  if (code.includes('<?php')) {
    return 'php';
  }
  if (code.includes('SELECT') || code.includes('FROM')) {
    return 'sql';
  }
  
  return 'text'; // Default fallback
};
```

### Step 9: Optimize Performance for Large Code Blocks

```typescript
// Lazy load syntax highlighter for better performance
import { lazy, Suspense } from 'react';

const SyntaxHighlighter = lazy(() => 
  import('react-syntax-highlighter').then(module => ({
    default: module.Prism
  }))
);

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  return (
    <Suspense fallback={<pre className="code-loading">{code}</pre>}>
      <SyntaxHighlighter language={language} style={customJarvisTheme}>
        {code}
      </SyntaxHighlighter>
    </Suspense>
  );
};
```

### Step 10: Add Support for Diff Highlighting

```typescript
// For code diffs (additions/deletions)
const DiffCodeBlock: React.FC<{ diff: string }> = ({ diff }) => {
  return (
    <SyntaxHighlighter
      language="diff"
      style={customJarvisTheme}
      showLineNumbers={true}
    >
      {diff}
    </SyntaxHighlighter>
  );
};
```

## Supported Languages

Ensure support for these common languages:
- JavaScript, TypeScript, JSX, TSX
- Python, Java, C, C++, C#, Go, Rust
- HTML, CSS, SCSS, SASS
- SQL, GraphQL
- Bash, PowerShell, Shell
- JSON, YAML, TOML, XML
- Markdown, LaTeX
- PHP, Ruby, Swift, Kotlin
- Docker, Nginx config

## Acceptance Criteria

- [ ] All code blocks in messages have syntax highlighting
- [ ] 50+ programming languages are supported
- [ ] Language is auto-detected from code fence (```language)
- [ ] Fallback language detection works for unfenced code blocks
- [ ] Line numbers appear for code blocks > 5 lines
- [ ] Copy button works and copies raw code (no syntax highlighting)
- [ ] Inline code has subtle background highlighting
- [ ] Theme matches Jarvis HUD aesthetic (cyan accents, dark background)
- [ ] Code blocks have horizontal scrolling for long lines
- [ ] Syntax highlighting renders within 100ms for typical code blocks
- [ ] Large code blocks (> 500 lines) don't freeze UI
- [ ] Custom scrollbar matches Jarvis theme
- [ ] Code font is monospace (Fira Code or Consolas)
- [ ] Keywords are highlighted in Jarvis cyan (#00ffff)
- [ ] File names are displayed when provided in code fence
