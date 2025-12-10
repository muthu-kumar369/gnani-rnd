# Stage 2.1: User-Preferred Model Routing

## Summary
Implement a persistent, user-centric model selection system. Instead of dynamic loading/unloading per conversation, users select their preferred model (e.g., "Llama 3", "Mistral", "GPT-4") in their settings. This preference is stored in the user profile and dictates the routing logic for all subsequent interactions.

## Goals
- **User Persistence:** Store `preferredModel` in the User Profile.
- **Backend Routing:** Update LLM Service to route requests to the specific model provider/endpoint based on the user's preference.
- **UI Integration:** Add a "Default Model" selector in the Assistant Settings (and optionally a quick-switcher in the header).
- **Seamless Experience:** Ensure the selected model is used across app restarts without manual reselections.

## Files to Modify / Create

### Backend
- `/src/modules/user/user.model.ts` → Add `preferredModel` field to schema.
- `/src/modules/user/dto/update-user.dto.ts` → Add validation for model updates.
- `/src/modules/llm/llm.service.ts` → Modify `generateResponse` to accept/lookup model preference.
- `/src/modules/llm/llm.factory.ts` or `router.ts` → **[NEW]** Logic to select correct provider (Ollama, OpenAI, etc.) based on model ID.
- `/src/config/llm.config.ts` → Define available models and their providers.

### Frontend
- `/src/components/Settings/AssistantSettings.tsx` → Add Model Selector dropdown.
- `/src/store/useUserStore.ts` → Ensure `preferredModel` is synced.
- `/src/types/user.types.ts` → Update User interface.

## Detailed Implementation Instructions

### Backend Implementation

#### Step 1: Update User Schema
In `/src/modules/user/user.model.ts`:
```typescript
@Prop({ default: 'llama3' }) // or a sensible default
preferredModel: string;
```

#### Step 2: Define Model Configuration
In `/src/config/llm.config.ts`, define the registry of supported models:
```typescript
export const AVAILABLE_MODELS = {
  'llama3': { provider: 'ollama', modelName: 'llama3:latest' },
  'mistral': { provider: 'ollama', modelName: 'mistral:latest' },
  'gpt-4': { provider: 'openai', modelName: 'gpt-4-turbo' },
  // ...
};
```

#### Step 3: Implement Routing Logic
In `/src/modules/llm/llm.service.ts`:
- When processing a message, retrieve the user's `preferredModel`.
- Look up the provider configuration.
- Instantiate or use the correct client (OllamaClient, OpenAIClient, etc.).

```typescript
async generateResponse(userId: string, prompt: string) {
  const user = await this.userService.findById(userId);
  const modelConfig = AVAILABLE_MODELS[user.preferredModel];
  
  // Route to appropriate provider
  if (modelConfig.provider === 'ollama') {
    return this.ollamaService.chat(modelConfig.modelName, prompt);
  }
  // ...
}
```

### Frontend Implementation

#### Step 4: Settings UI
In `/src/components/Settings/AssistantSettings.tsx`:
- Fetch available models from an endpoint (or hardcode if static).
- Render a `<Select>` component for "Default Model".
- On change, call `updateUser({ preferredModel: newValue })`.

#### Step 5: Store Updates
- Ensure `useUserStore` updates the local state immediately upon successful API call so the UI reflects the change instantly.

## Acceptance Criteria
- [ ] User can select a model in Settings.
- [ ] Selection persists after refreshing/restarting the app.
- [ ] Backend correctly routes the request to the selected model.
- [ ] If the selected model is unavailable (e.g., local Ollama model missing), fallback gracefully (e.g., to a default model) and notify user.
