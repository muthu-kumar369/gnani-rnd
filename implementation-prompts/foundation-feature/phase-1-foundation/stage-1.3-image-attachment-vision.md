# Stage 1.3: Image Attachment System (Multimodal Vision)

## Summary
Implement multimodal vision capabilities by enabling image uploads and integrating with open-source vision models. Users can attach images (PNG, JPG, JPEG, GIF, WebP) to conversations, and the LLM will analyze and respond to image content using locally-hosted vision models.

## Goals
- Enable image upload via drag-and-drop and file picker
- Integrate open-source vision model (LLaVA, BLIP-2, or CogVLM)
- Process images and generate descriptions/analysis
- Display images in conversation UI
- Optimize image storage and processing
- Support multiple images per message
- Maintain performance with local model hosting

## Files to Modify / Create

### Backend
- `/src/modules/vision/vision.service.ts` → **[NEW]** Vision model integration and image analysis
- `/src/modules/vision/vision.controller.ts` → **[NEW]** Image processing endpoints
- `/src/modules/vision/vision.routes.ts` → **[NEW]** Vision API routes
- `/src/modules/vision/model-manager.ts` → **[NEW]** Vision model loading and management
- `/src/modules/file/file.service.ts` → Extend for image uploads
- `/src/modules/file/parsers/image.parser.ts` → **[NEW]** Image preprocessing (resize, optimize)
- `/src/modules/conversation/conversation.service.ts` → Handle image context injection
- `/src/config/vision.config.ts` → **[NEW]** Vision model configuration

### Frontend
- `/src/components/Terminal/ImageUploadZone.tsx` → **[NEW]** Image drag-and-drop UI
- `/src/components/Terminal/ImagePreview.tsx` → **[NEW]** Display attached images
- `/src/components/Terminal/ImageGallery.tsx` → **[NEW]** Multi-image display
- `/src/stores/gnaniStore.ts` → Add image attachment state
- `/src/types/vision.types.ts` → **[NEW]** Vision-related type definitions

### Infrastructure
- `/scripts/setup-vision-model.sh` → **[NEW]** Script to download and setup vision model
- `/docker/vision-service.dockerfile` → **[NEW]** Docker container for vision model (optional)

## Detailed Implementation Instructions

### Backend Implementation

#### Step 1: Choose and Setup Vision Model

**Recommended Model: LLaVA 1.5 (7B or 13B)**
- **Pros:** Best open-source vision-language model, good accuracy, reasonable size
- **Cons:** Requires GPU (4GB VRAM for 7B, 8GB for 13B)

**Alternative: BLIP-2**
- **Pros:** Lighter weight, faster inference
- **Cons:** Less capable than LLaVA

**Model Serving Options:**
1. **vLLM** (recommended for production)
2. **Ollama** (easiest setup)
3. **Hugging Face Transformers** (most flexible)

#### Step 2: Create Vision Model Manager
Create `/src/modules/vision/model-manager.ts`:

```typescript
class VisionModelManager {
  private modelLoaded: boolean = false;
  private modelEndpoint: string;
  
  async loadModel(): Promise<void> {
    // Initialize connection to vision model server
    // Options:
    // 1. Local vLLM server: http://localhost:8000
    // 2. Ollama: http://localhost:11434
    // 3. Direct Transformers inference
  }
  
  async analyzeImage(imagePath: string, prompt: string): Promise<string> {
    // Send image + prompt to vision model
    // Return generated description/analysis
  }
  
  async unloadModel(): Promise<void> {
    // Free GPU memory if needed
  }
  
  isModelReady(): boolean {
    return this.modelLoaded;
  }
}
```

#### Step 3: Create Vision Service
Create `/src/modules/vision/vision.service.ts`:

```typescript
class VisionService {
  constructor(private modelManager: VisionModelManager) {}
  
  async processImage(
    imageBuffer: Buffer,
    userId: string,
    prompt?: string
  ): Promise<VisionAnalysis> {
    // 1. Validate image format
    // 2. Optimize image (resize if > 1024px, compress)
    // 3. Save to storage
    // 4. Generate image description using vision model
    // 5. Return analysis result
  }
  
  async analyzeMultipleImages(
    images: Buffer[],
    prompt: string
  ): Promise<string> {
    // Process multiple images and combine analysis
  }
}
```

#### Step 4: Implement Image Preprocessing
Create `/src/modules/file/parsers/image.parser.ts`:

```typescript
import sharp from 'sharp';

class ImageParser {
  async optimizeImage(buffer: Buffer): Promise<Buffer> {
    // Resize to max 1024x1024 (preserve aspect ratio)
    // Convert to JPEG for consistency
    // Compress to reduce size
    return sharp(buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
  }
  
  async extractMetadata(buffer: Buffer): Promise<ImageMetadata> {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length
    };
  }
}
```

#### Step 5: Create Vision API Endpoints
In `/src/modules/vision/vision.controller.ts`:

1. **POST /api/vision/analyze**
   - Accept image file + optional prompt
   - Process image through vision model
   - Return analysis result

2. **POST /api/vision/batch-analyze**
   - Accept multiple images
   - Process all images
   - Return combined analysis

#### Step 6: Integrate with Conversation Flow
In `/src/modules/conversation/conversation.service.ts`:

When user sends message with images:
```typescript
async handleMessageWithImages(
  conversationId: string,
  text: string,
  imageIds: string[]
): Promise<Message> {
  // 1. Retrieve image files
  // 2. Generate vision analysis for each image
  // 3. Build enhanced context:
  //    [Image 1 Analysis]: {visionDescription}
  //    [Image 2 Analysis]: {visionDescription}
  //    User's message: {text}
  // 4. Send to LLM
  // 5. Store message with image attachments
}
```

#### Step 7: Setup Vision Model Server

**Option A: Using Ollama (Easiest)**
Create `/scripts/setup-vision-model.sh`:
```bash
#!/bin/bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull LLaVA model
ollama pull llava:7b

# Start Ollama server
ollama serve
```

**Option B: Using vLLM (Production)**
```bash
# Install vLLM
pip install vllm

# Start vLLM server with LLaVA
python -m vllm.entrypoints.openai.api_server \
  --model liuhaotian/llava-v1.5-7b \
  --trust-remote-code \
  --port 8000
```

**Option C: Using Transformers (Most Flexible)**
```python
from transformers import LlavaNextProcessor, LlavaNextForConditionalGeneration
import torch

model = LlavaNextForConditionalGeneration.from_pretrained(
    "llava-hf/llava-v1.6-mistral-7b-hf",
    torch_dtype=torch.float16,
    device_map="auto"
)
processor = LlavaNextProcessor.from_pretrained("llava-hf/llava-v1.6-mistral-7b-hf")
```

### Frontend Implementation

#### Step 8: Create Image Upload UI Components

**ImageUploadZone** (`/src/components/Terminal/ImageUploadZone.tsx`):
```typescript
// Drag-and-drop zone for images
// Show image preview on drop
// Support multiple image selection
// Validate image types (PNG, JPG, JPEG, GIF, WebP)
// Show upload progress
```

**ImagePreview** (`/src/components/Terminal/ImagePreview.tsx`):
```typescript
// Display thumbnail of attached image
// Show image name and size
// Remove button
// Click to view full size
```

**ImageGallery** (`/src/components/Terminal/ImageGallery.tsx`):
```typescript
// Grid layout for multiple images
// Lightbox for full-size viewing
// Image navigation (prev/next)
```

#### Step 9: Integrate into Terminal
In `/src/components/Terminal/Terminal.tsx`:

1. Add image upload button (camera icon)
2. Display `<ImagePreview>` for each attached image
3. Show processing indicator when analyzing images
4. Include image IDs when sending message

#### Step 10: State Management
In `/src/stores/gnaniStore.ts`:

```typescript
attachedImages: ImageAttachment[],
addAttachedImage: (image: ImageAttachment) => void,
removeAttachedImage: (imageId: string) => void,
clearAttachedImages: () => void,
imageAnalysisStatus: Map<string, 'pending' | 'analyzing' | 'complete' | 'error'>
```

#### Step 11: Image Upload Flow
1. User drops image or clicks camera button
2. Frontend validates image type and size (max 5MB per image)
3. Show image preview immediately
4. Upload to `/api/files/upload` (image endpoint)
5. Backend processes and analyzes image
6. Return image metadata + vision analysis
7. Display in conversation
8. When sending message, include image IDs
9. LLM receives both image analysis and user's text

### Performance Optimization

#### Model Loading Strategy
```typescript
// Load model on first image upload (lazy loading)
// Keep model loaded for 10 minutes after last use
// Unload to free GPU memory if idle
```

#### Image Caching
```typescript
// Cache vision analysis results
// If same image uploaded again, reuse analysis
// Use image hash (MD5) as cache key
```

#### Batch Processing
```typescript
// If multiple images attached, process in parallel
// Limit concurrent processing to 3 images
```

### Error Handling

1. **Model Not Ready:** Show "Vision model is loading, please wait..." (30-60s)
2. **Image Too Large:** Auto-resize or show error "Image exceeds 5MB"
3. **Invalid Format:** Show "Unsupported image format. Please use PNG, JPG, or WebP"
4. **Analysis Failed:** Show "Could not analyze image" but still allow upload
5. **GPU Out of Memory:** Fallback to CPU inference (slower) or queue for retry

### Resource Management (Critical for Open Source)

Since you're running on limited resources:

1. **Use Quantized Models:**
   - 4-bit quantization: `llava-v1.5-7b-4bit`
   - Reduces memory from 14GB to ~4GB

2. **Model Unloading:**
   - Unload vision model when not in use
   - Only load when user uploads image

3. **CPU Fallback:**
   - If no GPU available, use CPU inference (slower but works)
   - Show "Processing may take 30-60 seconds" warning

4. **Image Size Limits:**
   - Resize all images to max 512x512 for faster processing
   - Quality is still good for most use cases

## Acceptance Criteria

- [ ] Users can drag-and-drop images into conversation
- [ ] Users can click camera button to select images
- [ ] Image previews are shown before sending
- [ ] Vision model analyzes images and generates descriptions
- [ ] LLM responses reference image content accurately
- [ ] Multiple images can be attached to one message
- [ ] Images are displayed in conversation history
- [ ] Image analysis completes within 10 seconds (GPU) or 60 seconds (CPU)
- [ ] Vision model loads automatically on first image upload
- [ ] Model unloads after 10 minutes of inactivity to free resources
- [ ] Error messages are clear when analysis fails
- [ ] Image size limit (5MB per image) is enforced
- [ ] Supported formats: PNG, JPG, JPEG, GIF, WebP
- [ ] Vision analysis is cached to avoid reprocessing same images
