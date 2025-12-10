# Stage 1.2: File Attachment System (Documents)

## Summary
Implement a complete file attachment system for document uploads (PDF, TXT, DOC, DOCX, MD). This includes file upload UI with drag-and-drop, backend storage, document parsing, and context injection into LLM conversations.

## Goals
- Enable users to attach documents to conversations
- Parse document content and inject into conversation context
- Support PDF, TXT, DOC, DOCX, and Markdown files
- Implement drag-and-drop and file picker UI
- Store files efficiently ( S3 and fallback to local as well)
- Display attached files in conversation UI
- Allow file removal and re-upload

## Files to Modify / Create

### Backend
- `/src/modules/file/file.service.ts` → **[NEW]** File upload, storage, and retrieval
- `/src/modules/file/file.controller.ts` → **[NEW]** File upload endpoints
- `/src/modules/file/file.routes.ts` → **[NEW]** File routes
- `/src/modules/file/parsers/pdf.parser.ts` → **[NEW]** PDF text extraction
- `/src/modules/file/parsers/doc.parser.ts` → **[NEW]** DOC/DOCX text extraction
- `/src/modules/file/parsers/text.parser.ts` → **[NEW]** Plain text parser
- `/src/modules/conversation/conversation.schema.ts` → Add file attachments field
- `/src/modules/conversation/conversation.service.ts` → Handle file context injection
- `/src/config/multer.config.ts` → **[NEW]** Multer configuration for file uploads

### Frontend
- `/src/components/Terminal/FileUploadZone.tsx` → **[NEW]** Drag-and-drop upload UI
- `/src/components/Terminal/AttachedFilesList.tsx` → **[NEW]** Display attached files
- `/src/components/Terminal/FileAttachmentButton.tsx` → **[NEW]** File picker button
- `/src/stores/gnaniStore.ts` → Add file attachment state management
- `/src/types/file.types.ts` → **[NEW]** File attachment type definitions

## Detailed Implementation Instructions

### Backend Implementation

#### Step 1: Create File Service Module
Create `/src/modules/file/file.service.ts`:

1. **File Upload Method:**
   ```typescript
   async uploadFile(file: Express.Multer.File, userId: string): Promise<FileDocument> {
     // 1. Validate file type and size
     // 2. Generate unique filename (UUID + original extension)
     // 3. Save to storage ( S3 and fallback to local: /uploads when it s3 fails)
     // 4. Parse file content based on type
     // 5. Create file document in database
     // 6. Return file metadata
   }
   ```

2. **File Parsing Method:**
   ```typescript
   async parseFile(filePath: string, mimeType: string): Promise<string> {
     // Route to appropriate parser based on MIME type
     // Return extracted text content
   }
   ```

3. **File Retrieval:**
   ```typescript
   async getFile(fileId: string, userId: string): Promise<FileDocument>
   async deleteFile(fileId: string, userId: string): Promise<void>
   ```

#### Step 2: Implement Document Parsers

**PDF Parser** (`/src/modules/file/parsers/pdf.parser.ts`):
- Use `pdf-parse` library
- Extract all text content
- Handle multi-page PDFs
- Return concatenated text

**DOC/DOCX Parser** (`/src/modules/file/parsers/doc.parser.ts`):
- Use `mammoth` library for DOCX
- Use `textract` or `antiword` for legacy DOC
- Extract formatted text
- Preserve basic structure (headings, paragraphs)

**Text Parser** (`/src/modules/file/parsers/text.parser.ts`):
- Read file as UTF-8
- Handle different encodings (UTF-8, UTF-16, ASCII)
- Return raw text content

#### Step 3: Configure Multer for File Uploads
Create `/src/config/multer.config.ts`:

```typescript
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
```

#### Step 4: Create File Upload Endpoints
In `/src/modules/file/file.controller.ts`:

1. **POST /api/files/upload**
   - Accept multipart/form-data
   - Validate file
   - Call file service to upload and parse
   - Return file metadata (id, name, size, type, parsedContent preview)

2. **GET /api/files/:fileId**
   - Retrieve file metadata
   - Optionally download file

3. **DELETE /api/files/:fileId**
   - Delete file from storage and database

#### Step 5: Update Conversation Schema
In `/src/modules/conversation/conversation.schema.ts`:

Add attachments field to message schema:
```typescript
attachments: [{
  fileId: { type: Schema.Types.ObjectId, ref: 'File' },
  fileName: String,
  fileType: String,
  fileSize: Number,
  parsedContent: String, // Extracted text
  uploadedAt: Date
}]
```

#### Step 6: Inject File Content into LLM Context
In `/src/modules/conversation/conversation.service.ts`:

When building context for LLM:
1. Check if message has attachments
2. For each attachment, prepend parsed content to user message:
   ```
   [Attached File: document.pdf]
   {parsedContent}
   
   User's message: {actualMessage}
   ```
3. Ensure total context doesn't exceed token limit (truncate if needed)

### Frontend Implementation

#### Step 7: Create File Upload UI Components

**FileUploadZone** (`/src/components/Terminal/FileUploadZone.tsx`):
```typescript
// Drag-and-drop zone
// Show "Drop files here" overlay when dragging
// Handle file drop event
// Trigger file upload
// Show upload progress
```

**FileAttachmentButton** (`/src/components/Terminal/FileAttachmentButton.tsx`):
```typescript
// Paperclip icon button
// Opens file picker dialog
// Filters to allowed file types
// Triggers upload on selection
```

**AttachedFilesList** (`/src/components/Terminal/AttachedFilesList.tsx`):
```typescript
// Display list of attached files
// Show file name, size, type
// Remove button for each file
// Loading state during upload
```

#### Step 8: Integrate into Terminal Component
In `/src/components/Terminal/Terminal.tsx`:

1. Add `<FileUploadZone>` wrapper around input area
2. Add `<FileAttachmentButton>` next to send button
3. Display `<AttachedFilesList>` above input when files are attached
4. Include file IDs when sending message

#### Step 9: State Management
In `/src/stores/gnaniStore.ts`:

```typescript
attachedFiles: FileAttachment[],
addAttachedFile: (file: FileAttachment) => void,
removeAttachedFile: (fileId: string) => void,
clearAttachedFiles: () => void,
uploadingFiles: Map<string, number>, // fileId -> progress percentage
```

#### Step 10: File Upload Flow
1. User drops file or clicks attach button
2. Frontend validates file type and size
3. Show upload progress indicator
4. POST to `/api/files/upload` with FormData
5. Receive file metadata response
6. Add to `attachedFiles` state
7. Display in `AttachedFilesList`
8. When sending message, include file IDs in request
9. Clear attached files after message sent

### Error Handling

1. **File Too Large:** Show error toast "File exceeds 10MB limit"
2. **Invalid Type:** Show error "Unsupported file type. Please upload PDF, DOC, DOCX, TXT, or MD files"
3. **Upload Failed:** Show retry button
4. **Parsing Failed:** Store file but show warning "Could not extract text from file"
5. **Network Error:** Queue upload for retry

### Security Considerations

1. **Virus Scanning:** Integrate ClamAV or similar for file scanning (optional for MVP)
2. **File Type Validation:** Validate both MIME type and file extension
3. **User Isolation:** Ensure users can only access their own files
4. **Storage Limits:** Implement per-user storage quota (e.g., 100MB)
5. **Sanitization:** Sanitize file names to prevent path traversal

## Acceptance Criteria

- [ ] Users can drag-and-drop PDF, DOC, DOCX, TXT, MD files into conversation
- [ ] Users can click attach button to select files
- [ ] Upload progress is shown during file upload
- [ ] Attached files are displayed with name, size, and remove button
- [ ] File content is extracted and injected into LLM context
- [ ] LLM responses reference the attached document content
- [ ] Files are stored securely and associated with correct user
- [ ] Users can remove attached files before sending message
- [ ] File attachments are visible in conversation history
- [ ] Error messages are clear and actionable
- [ ] File size limit (10MB) is enforced
- [ ] Only allowed file types can be uploaded
