# STAGE 3: COMPONENT ENHANCEMENT & MIGRATION

**Duration:** 2-3 weeks  
**Complexity:** High  
**Risk:** Medium  
**Dependencies:** Stage 2 complete

---

## 🎯 OBJECTIVE

Migrate advanced features from terminal components to chat components to achieve full feature parity. This stage focuses on enhancing MessageItem and ChatInput with all the rich features currently only available in the terminal/voice mode.

---

## 📋 SCOPE

### Components to Migrate

| Terminal Component | Size | Features | Target |
|-------------------|------|----------|--------|
| MessageBubble.tsx | 17KB | Rich rendering, actions | → MessageItem.tsx (9KB) |
| CodeBlock.tsx | 3KB | Syntax highlighting, copy | → chat/CodeBlock.tsx |
| MermaidDiagram.tsx | 3KB | Diagram rendering | → chat/MermaidDiagram.tsx |
| ImageGallery.tsx | 1KB | Image display | → chat/ImageGallery.tsx |
| ImagePreview.tsx | 4KB | Image preview modal | → chat/ImagePreview.tsx |
| InlineMessageEditor.tsx | 4KB | Inline editing | → chat/InlineMessageEditor.tsx |
| DateSeparator.tsx | 1KB | Date headers | → chat/DateSeparator.tsx |
| TypingIndicator.tsx | 2KB | Typing animation | → chat/TypingIndicator.tsx |
| TextInput.tsx | 8KB | Advanced input | → Enhance ChatInput.tsx (6KB) |
| FileUploadZone.tsx | 3KB | Drag-drop upload | → chat/FileUploadZone.tsx |
| AttachedFilesList.tsx | 4KB | File previews | → chat/AttachedFilesList.tsx |

---

## 🔧 WEEK 1: MESSAGE DISPLAY ENHANCEMENT

### Task 1.1: Migrate CodeBlock Component (1 day)

**Source:** `src/components/terminal/CodeBlock.tsx`  
**Target:** `src/components/chat/CodeBlock.tsx`

**Features to Preserve:**
- Syntax highlighting (react-syntax-highlighter)
- Copy button
- Language badge
- Line numbers (optional)
- Theme matching (Jarvis dark theme)

**Implementation:**

```bash
# Copy component
cp src/components/terminal/CodeBlock.tsx src/components/chat/CodeBlock.tsx
```

**Update for Chat Theme:**

```tsx
// src/components/chat/CodeBlock.tsx
import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

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

    return (
        <div className="code-block relative group my-4 rounded-lg overflow-hidden border border-cyan-500/20">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-cyan-950/30 border-b border-cyan-500/20">
                <span className="text-xs font-mono text-cyan-400 uppercase">
                    {language || 'code'}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                >
                    {copied ? (
                        <>
                            <Check size={12} />
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={12} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code */}
            <SyntaxHighlighter
                language={language || 'text'}
                style={vscDarkPlus}
                showLineNumbers={showLineNumbers}
                customStyle={{
                    margin: 0,
                    padding: '1rem',
                    background: '#0a0a0a',
                    fontSize: '0.875rem',
                }}
                codeTagProps={{
                    style: {
                        fontFamily: '"Fira Code", "Courier New", monospace',
                    }
                }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
};

export default CodeBlock;
```

**Integration in MessageItem:**

```tsx
// src/components/chat/MessageItem.tsx
import CodeBlock from './CodeBlock';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// In message content rendering
<ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
        code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
                <CodeBlock
                    language={match[1]}
                    code={String(children).replace(/\n$/, '')}
                    showLineNumbers={false}
                />
            ) : (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
    }}
>
    {message.content}
</ReactMarkdown>
```

**Testing:**
- [ ] Syntax highlighting works for common languages (Python, JavaScript, TypeScript, etc.)
- [ ] Copy button copies code to clipboard
- [ ] Language badge displays correctly
- [ ] Theme matches Jarvis aesthetic
- [ ] Inline code (single backticks) still renders correctly

---

### Task 1.2: Migrate MermaidDiagram Component (1 day)

**Source:** `src/components/terminal/MermaidDiagram.tsx`  
**Target:** `src/components/chat/MermaidDiagram.tsx`

**Features:**
- Mermaid diagram rendering
- Error handling
- Responsive sizing
- Jarvis theme colors

**Implementation:**

```tsx
// src/components/chat/MermaidDiagram.tsx
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
    chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!ref.current) return;

        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            themeVariables: {
                primaryColor: '#00ffff',
                primaryTextColor: '#fff',
                primaryBorderColor: '#00ffff',
                lineColor: '#00ffff',
                secondaryColor: '#0ea5e9',
                tertiaryColor: '#a855f7',
                background: '#0a0a0a',
                mainBkg: '#1a1a1a',
                secondBkg: '#0a0a0a',
                textColor: '#ffffff',
                fontSize: '14px',
            },
        });

        const renderDiagram = async () => {
            try {
                const { svg } = await mermaid.render(
                    `mermaid-${Date.now()}`,
                    chart
                );
                if (ref.current) {
                    ref.current.innerHTML = svg;
                }
            } catch (err) {
                console.error('Mermaid rendering error:', err);
                setError('Failed to render diagram');
            }
        };

        renderDiagram();
    }, [chart]);

    if (error) {
        return (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
            </div>
        );
    }

    return (
        <div 
            ref={ref} 
            className="mermaid-diagram my-4 p-4 bg-black/40 border border-cyan-500/20 rounded-lg overflow-x-auto"
        />
    );
};

export default MermaidDiagram;
```

**Integration in MessageItem:**

```tsx
import MermaidDiagram from './MermaidDiagram';

// In ReactMarkdown components
components={{
    code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';
        
        if (!inline && language === 'mermaid') {
            return <MermaidDiagram chart={String(children)} />;
        }
        
        // ... rest of code block handling
    },
}}
```

**Testing:**
- [ ] Flowcharts render correctly
- [ ] Sequence diagrams render correctly
- [ ] Gantt charts render correctly
- [ ] Error handling works
- [ ] Theme colors match Jarvis

---

### Task 1.3: Migrate Image Components (1 day)

**Components:**
- `ImageGallery.tsx` - Grid of images
- `ImagePreview.tsx` - Full-size preview modal

**Implementation:**

```bash
# Copy components
cp src/components/terminal/ImageGallery.tsx src/components/chat/ImageGallery.tsx
cp src/components/terminal/ImagePreview.tsx src/components/chat/ImagePreview.tsx
```

**Update for Chat:**

```tsx
// src/components/chat/ImageGallery.tsx
import React, { useState } from 'react';
import ImagePreview from './ImagePreview';

interface Image {
    id: string;
    url: string;
    fileName: string;
}

interface ImageGalleryProps {
    images: Image[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
    const [selectedImage, setSelectedImage] = useState<Image | null>(null);

    if (images.length === 0) return null;

    return (
        <>
            <div className="image-gallery grid grid-cols-2 md:grid-cols-3 gap-2 my-4">
                {images.map((image) => (
                    <button
                        key={image.id}
                        onClick={() => setSelectedImage(image)}
                        className="relative aspect-square rounded-lg overflow-hidden border border-cyan-500/20 hover:border-cyan-500/50 transition-colors group"
                    >
                        <img
                            src={image.url}
                            alt={image.fileName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </button>
                ))}
            </div>

            {selectedImage && (
                <ImagePreview
                    image={selectedImage}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </>
    );
};

export default ImageGallery;
```

**Testing:**
- [ ] Images display in grid
- [ ] Click opens preview modal
- [ ] Modal shows full-size image
- [ ] Close button works
- [ ] Responsive on mobile

---

### Task 1.4: Migrate DateSeparator Component (2 hours)

**Source:** `src/components/terminal/DateSeparator.tsx`  
**Target:** `src/components/chat/DateSeparator.tsx`

**Implementation:**

```tsx
// src/components/chat/DateSeparator.tsx
import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';

interface DateSeparatorProps {
    timestamp: Date | string;
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ timestamp }) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

    const getDateLabel = () => {
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMMM d, yyyy');
    };

    return (
        <div className="date-separator flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <span className="text-xs font-medium text-cyan-400/60 uppercase tracking-wider">
                {getDateLabel()}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        </div>
    );
};

export default DateSeparator;
```

**Integration in MessageList:**

```tsx
// src/components/chat/MessageList.tsx
import DateSeparator from './DateSeparator';
import { isSameDate } from '../../utils/date-formatter';

// In message rendering loop
{messages.map((message, index) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDateSeparator = !prevMessage || !isSameDate(message.timestamp, prevMessage.timestamp);

    return (
        <React.Fragment key={message.id}>
            {showDateSeparator && <DateSeparator timestamp={message.timestamp} />}
            <MessageItem message={message} />
        </React.Fragment>
    );
})}
```

**Testing:**
- [ ] "Today" shows for today's messages
- [ ] "Yesterday" shows for yesterday's messages
- [ ] Full date shows for older messages
- [ ] Separators appear between different days
- [ ] No duplicate separators

---

### Task 1.5: Migrate InlineMessageEditor (1-2 days)

**Source:** `src/components/terminal/InlineMessageEditor.tsx` + `.css`  
**Target:** `src/components/chat/InlineMessageEditor.tsx` + `.css`

**Features:**
- Inline editing (no modal)
- Auto-expand textarea
- Save/cancel buttons
- Keyboard shortcuts (Cmd+Enter to save, Esc to cancel)

**Implementation:**

```tsx
// src/components/chat/InlineMessageEditor.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface InlineMessageEditorProps {
    initialContent: string;
    onSave: (newContent: string) => void;
    onCancel: () => void;
}

const InlineMessageEditor: React.FC<InlineMessageEditorProps> = ({
    initialContent,
    onSave,
    onCancel,
}) => {
    const [content, setContent] = useState(initialContent);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // Focus and select all on mount
        if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, []);

    useEffect(() => {
        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [content]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    };

    const handleSave = () => {
        if (content.trim()) {
            onSave(content);
        }
    };

    return (
        <div className="inline-message-editor p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-lg">
            <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-black/40 border border-cyan-500/20 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                rows={3}
            />
            <div className="flex items-center justify-end gap-2 mt-2">
                <span className="text-xs text-cyan-500/60">
                    Cmd+Enter to save, Esc to cancel
                </span>
                <button
                    onClick={onCancel}
                    className="px-3 py-1.5 rounded border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors text-sm"
                >
                    <X size={14} className="inline mr-1" />
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="px-3 py-1.5 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-sm"
                >
                    <Check size={14} className="inline mr-1" />
                    Save
                </button>
            </div>
        </div>
    );
};

export default InlineMessageEditor;
```

**Integration in MessageItem:**

```tsx
import InlineMessageEditor from './InlineMessageEditor';

const [isEditing, setIsEditing] = useState(false);

// In render
{isEditing ? (
    <InlineMessageEditor
        initialContent={message.content}
        onSave={(newContent) => {
            onEdit?.(message.id, newContent);
            setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
    />
) : (
    <MessageContent content={message.content} />
)}
```

**Testing:**
- [ ] Click edit button shows editor
- [ ] Textarea auto-expands
- [ ] Cmd+Enter saves
- [ ] Esc cancels
- [ ] Save button works
- [ ] Cancel button works

---

## 🔧 WEEK 2: INPUT ENHANCEMENT

### Task 2.1: Migrate FileUploadZone (1 day)

**Source:** `src/components/terminal/FileUploadZone.tsx`  
**Target:** `src/components/chat/FileUploadZone.tsx`

**Features:**
- Drag-and-drop file upload
- Visual feedback on drag over
- File type validation
- Size validation

**Implementation:**

```tsx
// src/components/chat/FileUploadZone.tsx
import React, { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadZoneProps {
    onFileDrop: (file: File) => void;
    disabled?: boolean;
    children: React.ReactNode;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
    onFileDrop,
    disabled = false,
    children,
}) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) {
            setIsDragging(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (disabled) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            onFileDrop(files[0]);
        }
    }, [disabled, onFileDrop]);

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative"
        >
            {children}

            {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-cyan-500/10 backdrop-blur-sm border-2 border-dashed border-cyan-500 rounded-lg">
                    <div className="text-center">
                        <Upload className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
                        <p className="text-cyan-400 font-medium">Drop file to upload</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploadZone;
```

**Integration:**

```tsx
// Wrap ChatPage with FileUploadZone
<FileUploadZone onFileDrop={handleFileUpload}>
    <MessageList />
    <ChatInput />
</FileUploadZone>
```

**Testing:**
- [ ] Drag file over shows overlay
- [ ] Drop file uploads
- [ ] Disabled state works
- [ ] Multiple files handled correctly

---

### Task 2.2: Migrate AttachedFilesList (1 day)

**Source:** `src/components/terminal/AttachedFilesList.tsx`  
**Target:** `src/components/chat/AttachedFilesList.tsx`

**Features:**
- Show attached files before sending
- Remove button for each file
- File type icons
- File size display

**Implementation:**

```tsx
// src/components/chat/AttachedFilesList.tsx
import React from 'react';
import { File, X, FileText, Image as ImageIcon } from 'lucide-react';

interface AttachedFile {
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
}

interface AttachedFilesListProps {
    files: AttachedFile[];
    onRemove: (id: string) => void;
}

const AttachedFilesList: React.FC<AttachedFilesListProps> = ({ files, onRemove }) => {
    if (files.length === 0) return null;

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) return ImageIcon;
        if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
        return File;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="attached-files-list flex flex-wrap gap-2 p-2 bg-cyan-950/10 border-t border-cyan-500/20">
            {files.map((file) => {
                const Icon = getFileIcon(file.fileType);
                return (
                    <div
                        key={file.id}
                        className="flex items-center gap-2 px-3 py-2 bg-cyan-950/30 border border-cyan-500/20 rounded-lg group"
                    >
                        <Icon size={16} className="text-cyan-400" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{file.fileName}</p>
                            <p className="text-xs text-cyan-500/60">{formatFileSize(file.fileSize)}</p>
                        </div>
                        <button
                            onClick={() => onRemove(file.id)}
                            className="p-1 rounded hover:bg-red-500/20 text-cyan-500/60 hover:text-red-400 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default AttachedFilesList;
```

**Integration in ChatInput:**

```tsx
import AttachedFilesList from './AttachedFilesList';

// Show above input
{attachedFiles.length > 0 && (
    <AttachedFilesList
        files={attachedFiles}
        onRemove={handleRemoveFile}
    />
)}
```

**Testing:**
- [ ] Files display correctly
- [ ] Icons match file types
- [ ] File size formatted correctly
- [ ] Remove button works

---

### Task 2.3: Enhance ChatInput (2-3 days)

**Current:** `src/components/chat/ChatInput.tsx` (6KB)  
**Goal:** Add features from `terminal/TextInput.tsx` (8KB)

**Features to Add:**
- Multi-line auto-expand
- Better attachment button styling
- Model/template selector (optional)
- Token counter (optional)
- Better keyboard shortcuts

**Implementation:**

```tsx
// Enhanced ChatInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image as ImageIcon, Mic, Square } from 'lucide-react';
import AttachedFilesList from './AttachedFilesList';

interface ChatInputProps {
    onSend: (message: string) => void;
    onMicClick?: () => void;
    disabled?: boolean;
    isStreaming?: boolean;
    onStop?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
    onSend,
    onMicClick,
    disabled = false,
    isStreaming = false,
    onStop,
}) => {
    const [message, setMessage] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [message]);

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message);
            setMessage('');
            setAttachedFiles([]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-input border-t border-jarvis-border/30 bg-jarvis-bg">
            {/* Attached files */}
            {attachedFiles.length > 0 && (
                <AttachedFilesList
                    files={attachedFiles}
                    onRemove={(id) => setAttachedFiles(files => files.filter(f => f.id !== id))}
                />
            )}

            {/* Input area */}
            <div className="flex items-end gap-2 p-4">
                {/* Attachment buttons */}
                <div className="flex gap-1">
                    <button
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-cyan-400"
                        title="Attach file"
                    >
                        <Paperclip size={20} />
                    </button>
                    <button
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-cyan-400"
                        title="Attach image"
                    >
                        <ImageIcon size={20} />
                    </button>
                </div>

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Shift+Enter for new line)"
                    disabled={disabled}
                    className="flex-1 bg-white/5 border border-jarvis-border/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none max-h-[200px]"
                    rows={1}
                />

                {/* Action buttons */}
                <div className="flex gap-1">
                    {isStreaming ? (
                        <button
                            onClick={onStop}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors text-red-400"
                            title="Stop generating"
                        >
                            <Square size={20} />
                        </button>
                    ) : (
                        <>
                            {onMicClick && (
                                <button
                                    onClick={onMicClick}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-cyan-400"
                                    title="Voice mode"
                                >
                                    <Mic size={20} />
                                </button>
                            )}
                            <button
                                onClick={handleSend}
                                disabled={!message.trim() || disabled}
                                className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 transition-colors text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Send message"
                            >
                                <Send size={20} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
```

**Testing:**
- [ ] Textarea auto-expands
- [ ] Shift+Enter adds new line
- [ ] Enter sends message
- [ ] Attachment buttons work
- [ ] Stop button works during streaming
- [ ] Disabled state works

---

## 🔧 WEEK 3: POLISH & TESTING

### Task 3.1: Add TypingIndicator (1 day)

**Source:** `src/components/terminal/TypingIndicator.tsx`  
**Target:** `src/components/chat/TypingIndicator.tsx`

**Implementation:**

```tsx
// src/components/chat/TypingIndicator.tsx
import React from 'react';
import './TypingIndicator.css';

interface TypingIndicatorProps {
    status?: string;
    message?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ status, message }) => {
    if (!status || status === 'idle') return null;

    return (
        <div className="typing-indicator flex items-center gap-2 px-4 py-2 text-cyan-400/60 text-sm">
            <div className="flex gap-1">
                <span className="dot animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="dot animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="dot animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
            </div>
            <span>{message || 'Gnani is typing...'}</span>
        </div>
    );
};

export default TypingIndicator;
```

**Integration in MessageList:**

```tsx
import TypingIndicator from './TypingIndicator';

// At the end of message list
{isThinking && <TypingIndicator status="thinking" message="Thinking..." />}
```

**Testing:**
- [ ] Shows when AI is thinking
- [ ] Animation is smooth
- [ ] Hides when response starts
- [ ] Message updates correctly

---

### Task 3.2: Integration Testing (2-3 days)

**Test all migrated components together:**

1. **Message Display:**
   - [ ] Code blocks with syntax highlighting
   - [ ] Mermaid diagrams
   - [ ] Image galleries
   - [ ] Date separators
   - [ ] Inline editing

2. **Input:**
   - [ ] File upload zone
   - [ ] Attached files list
   - [ ] Auto-expanding textarea
   - [ ] Keyboard shortcuts

3. **Actions:**
   - [ ] Feedback buttons
   - [ ] Share button
   - [ ] Branch visualization
   - [ ] Copy, edit, regenerate

4. **Performance:**
   - [ ] Large messages render quickly
   - [ ] Scrolling is smooth
   - [ ] No memory leaks

5. **Responsive:**
   - [ ] Works on mobile
   - [ ] Works on tablet
   - [ ] Works on desktop

---

## ✅ ACCEPTANCE CRITERIA

- [ ] All terminal components migrated to chat
- [ ] MessageItem has all features from MessageBubble
- [ ] ChatInput has all features from TextInput
- [ ] Code blocks with syntax highlighting work
- [ ] Mermaid diagrams render correctly
- [ ] Image galleries work
- [ ] Date separators show correctly
- [ ] Inline editing works
- [ ] File upload and previews work
- [ ] Typing indicator works
- [ ] All tests pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Performance is good
- [ ] Responsive design works

---

## 📊 SUCCESS METRICS

- **Components Migrated:** 11 components
- **MessageItem Size:** Increased from 9KB to ~15KB (with all features)
- **ChatInput Size:** Increased from 6KB to ~10KB (with all features)
- **Feature Parity:** 100% (chat = terminal features)
- **Test Coverage:** >80%

---

**End of Stage 3 Prompt**
