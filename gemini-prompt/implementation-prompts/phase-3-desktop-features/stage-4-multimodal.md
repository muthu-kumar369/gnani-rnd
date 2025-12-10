# Stage 4: Multi-Modal Support (Screenshots, Files, Clipboard)

## Objective

Enable Gnani to process images, files, and clipboard content for richer interactions.

---

## Context

**Current**: Text and audio only  
**Desired**: Screenshots, PDFs, code files, clipboard  
**Constraints**: Must support Gemini Vision API, must handle large files

---

## Implementation Prompt

### Part 1: Screenshot Capture

**Electron Implementation**:

```javascript
// electron/screenshot/capture.js
const { desktopCapturer } = require('electron');

async function captureScreenshot() {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1920, height: 1080 }
  });
  
  // Get primary screen
  const primarySource = sources[0];
  const screenshot = primarySource.thumbnail.toPNG();
  
  return screenshot;
}

// Register global hotkey for screenshot (Ctrl+Shift+S)
globalShortcut.register('CommandOrControl+Shift+S', async () => {
  const screenshot = await captureScreenshot();
  mainWindow.webContents.send('screenshot:captured', screenshot);
});
```

**Frontend**:

```typescript
// src/hooks/useScreenshot.ts
const useScreenshot = () => {
  const handleScreenshot = async (screenshot: Buffer) => {
    // Convert to base64
    const base64 = screenshot.toString('base64');
    
    // Send to backend with current query
    await sendMessage({
      type: 'image',
      content: base64,
      mimeType: 'image/png'
    });
  };
  
  useEffect(() => {
    window.gnani?.on('screenshot:captured', handleScreenshot);
    return () => window.gnani?.off('screenshot:captured', handleScreenshot);
  }, []);
};
```

**Backend**:

```typescript
// src/modules/llm/vision.service.ts
class VisionService {
  async analyzeImage(imageBase64: string, prompt: string) {
    const response = await geminiClient.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/png', data: imageBase64 } }
        ]
      }]
    });
    
    return response.text();
  }
}
```

---

### Part 2: File Attachments

**Drag-Drop Support**:

```typescript
// src/components/gnani/FileDropZone.tsx
const FileDropZone: React.FC = () => {
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    for (const file of files) {
      if (file.type === 'application/pdf') {
        await handlePDF(file);
      } else if (file.type.startsWith('image/')) {
        await handleImage(file);
      } else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        await handleText(file);
      }
    }
  };
  
  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="file-drop-zone"
    >
      {children}
    </div>
  );
};
```

**File Processing**:
- PDF: Extract text using `pdf-parse`
- Images: Send to vision API
- Text/Code: Send as context

---

### Part 3: Clipboard Integration

**Read Clipboard**:

```typescript
// src/hooks/useClipboard.ts
const useClipboard = () => {
  const pasteClipboard = async () => {
    const text = await navigator.clipboard.readText();
    // Auto-paste into context
    return text;
  };
  
  // Hotkey: Ctrl+Shift+V to paste clipboard as context
  useEffect(() => {
    const handlePaste = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'v') {
        const text = await pasteClipboard();
        // Add to conversation context
      }
    };
    
    window.addEventListener('keydown', handlePaste);
    return () => window.removeEventListener('keydown', handlePaste);
  }, []);
};
```

---

## Testing

- [ ] Screenshot hotkey captures screen
- [ ] Drag-drop PDF extracts text
- [ ] Images are analyzed by vision API
- [ ] Clipboard paste adds context

---

## Success Criteria

- [ ] Screenshots work on all platforms
- [ ] Files <10MB are processed
- [ ] Vision API returns accurate descriptions
- [ ] Clipboard integration is seamless
