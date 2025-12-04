# Stage 2.1: Model Switcher with Resource Management

## Summary
Enable users to switch between different LLM models per conversation while managing limited GPU/RAM resources through intelligent model loading/unloading.

## Goals
- Add model selection dropdown in conversation settings
- Implement model loading/unloading service
- Show loading progress during model switches (30-60s)
- Persist model choice per conversation
- Handle model loading failures gracefully

## Files to Modify / Create

### Backend
- `/src/modules/model/model-manager.service.ts` → **[NEW]** Service to manage model lifecycle
- `/src/modules/model/model.controller.ts` → **[NEW]** Endpoints for model switching
- `/src/modules/conversation/conversation.schema.ts` → Add `modelId` field
- `/src/config/models.config.ts` → **[NEW]** Configuration for available models

### Frontend
- `/src/components/ModelSwitcher/ModelSwitcher.tsx` → **[NEW]** UI component for switching models
- `/src/stores/modelStore.ts` → **[NEW]** State management for models
- `/src/components/ConversationHeader.tsx` → Integrate ModelSwitcher

## Detailed Implementation Instructions

### Backend Implementation

#### Step 1: Create Model Manager Service
In `/src/modules/model/model-manager.service.ts`:

```typescript
class ModelManager {
  private currentModel: LoadedModel | null = null;
  private modelRegistry: Map<string, ModelConfig>;
  
  async switchModel(modelId: string): Promise<void> {
    // 1. Unload current model (free RAM/VRAM)
    if (this.currentModel) {
      await this.unloadModel(this.currentModel.id);
      this.emitProgress('unloading', 25);
    }
    
    // 2. Load new model
    this.emitProgress('loading', 50);
    this.currentModel = await this.loadModel(modelId);
    this.emitProgress('ready', 100);
  }
  
  async loadModel(modelId: string): Promise<LoadedModel> {
    const config = this.modelRegistry.get(modelId);
    // Use Ollama, LM Studio, or vLLM API
    // Return loaded model handle
  }
  
  async unloadModel(modelId: string): Promise<void> {
    // Call model server unload endpoint
    // Free resources
  }
}
```

#### Step 2: Create Model Controller
In `/src/modules/model/model.controller.ts`:

- `GET /api/models`: List available models
- `POST /api/models/switch`: Switch active model
- `GET /api/models/status`: Get current model loading status

### Frontend Implementation

#### Step 3: Create Model Switcher UI
In `/src/components/ModelSwitcher/ModelSwitcher.tsx`:

- Dropdown in conversation header or settings
- Display model name, size, quantization level
- Show loading bar during switch
- Disable input during model loading
- Fallback to previous model on failure

#### Step 4: Integrate into Conversation Header
In `/src/components/ConversationHeader.tsx`:

- Add `ModelSwitcher` component
- Ensure it reflects the current conversation's model

## Acceptance Criteria
- [ ] Users can switch models without app restart
- [ ] Loading progress is shown
- [ ] Model choice is persisted per conversation
- [ ] System handles loading failures gracefully
