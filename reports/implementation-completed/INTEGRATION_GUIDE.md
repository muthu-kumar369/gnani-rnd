# File Attachment Integration Guide

## Terminal Component Integration

To complete the file attachment feature, integrate the components into your Terminal component:

### 1. Import Components and Hooks

```typescript
import FileUploadZone from './FileUploadZone';
import FileAttachmentButton from './FileAttachmentButton';
import AttachedFilesList from './AttachedFilesList';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useGnaniStore } from '../../store/useGnaniStore';
```

### 2. Use the Hook

```typescript
const { uploadFile, isUploading } = useFileUpload(userId);
const { attachedFiles, removeAttachedFile, clearAttachedFiles } = useGnaniStore();
```

### 3. Handle File Selection

```typescript
const handleFileSelect = async (file: File) => {
    try {
        await uploadFile(file);
    } catch (error) {
        console.error('File upload failed:', error);
        alert('Failed to upload file. Please try again.');
    }
};
```

### 4. Update Message Sending

When sending a message, include file IDs:

```typescript
const handleSendMessage = async (message: string) => {
    const fileIds = attachedFiles.map(f => f.id);
    
    // Send message with file IDs
    await sendMessage(message, fileIds);
    
    // Clear attached files after sending
    clearAttachedFiles();
};
```

### 5. Wrap Terminal with FileUploadZone

```tsx
<FileUploadZone onFileDrop={handleFileSelect} disabled={isUploading}>
    <div className="terminal-container">
        {/* Existing terminal content */}
        
        {/* Add AttachedFilesList above input */}
        <AttachedFilesList 
            files={attachedFiles}
            onRemove={removeAttachedFile}
        />
        
        <div className="input-area">
            {/* Add FileAttachmentButton next to send button */}
            <FileAttachmentButton 
                onFileSelect={handleFileSelect}
                disabled={isUploading}
            />
            {/* Existing input and send button */}
        </div>
    </div>
</FileUploadZone>
```

## Backend Message Handling

When receiving a message with file attachments on the backend:

### 1. Fetch File Metadata

```typescript
const fileAttachments = await Promise.all(
    fileIds.map(id => fileService.getFile(id, userId))
);
```

### 2. Pass to Context Builder

```typescript
const context = await contextBuilder.build(
    sessionId,
    userId,
    transcript,
    fileAttachments  // Pass attachments here
);
```

### 3. Store with Message

```typescript
await shortTermMemory.storeMessage(
    userId,
    sessionId,
    'user',
    content,
    {
        attachments: fileAttachments.map(f => ({
            fileId: f._id,
            fileName: f.fileName,
            fileSize: f.fileSize,
            mimeType: f.mimeType,
            parsedContent: f.parsedContent
        }))
    }
);
```

## Testing

1. **Upload a PDF**: Select a PDF file, verify it uploads and appears in the list
2. **Drag and Drop**: Drag a file over the terminal, verify drop zone appears
3. **Send with Attachment**: Attach a file and send a message asking about it
4. **Remove File**: Click the X button to remove an attached file
5. **Error Handling**: Try uploading a 15MB file or .exe file, verify error messages

## Environment Setup

Add to backend `.env`:

```bash
# Optional S3 configuration
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket
AWS_REGION=us-east-1
```

If not configured, files will automatically save to `/uploads` folder.
