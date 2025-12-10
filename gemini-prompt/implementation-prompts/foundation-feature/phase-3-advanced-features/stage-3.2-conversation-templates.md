# Stage 3.2: Conversation Templates

## Summary
Pre-configured conversation templates with system prompts, tools, and settings to speed up common tasks.

## Goals
- Create template library (Code Assistant, Research Assistant, Creative Writer)
- Allow users to create custom templates
- Apply template when creating new conversation
- Template includes: system prompt, model, enabled tools, settings

## Files to Modify / Create

### Backend
- `/src/modules/template/template.schema.ts` → **[NEW]** Schema for templates
- `/src/modules/template/template.service.ts` → **[NEW]** CRUD for templates
- `/src/modules/template/template.controller.ts` → **[NEW]** Endpoints

### Frontend
- `/src/components/Templates/TemplateGallery.tsx` → **[NEW]** UI to browse/select templates
- `/src/components/Templates/TemplateEditor.tsx` → **[NEW]** UI to create/edit templates

## Detailed Implementation Instructions

### Backend Implementation

#### Step 1: Create Template Module
Implement CRUD operations for templates.

### Frontend Implementation

#### Step 2: Create Template Gallery
Show available templates when starting a new conversation.

## Acceptance Criteria
- [ ] Users can select a template when creating a conversation
- [ ] Users can create and save custom templates
- [ ] Templates correctly apply system prompts and settings
