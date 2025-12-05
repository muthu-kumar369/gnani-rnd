You are analyzing my Electron + React app named “Gnani”. I want you to carefully inspect our current UI flow, especially the conversation panel, message input bar, templates handling, and model selector. Your job is to redesign these UI sections with a modern, clean, top-AI-assistant style layout similar to ChatGPT/Gemini/Claude.

### 🔥 What I need from you
1. **Analyze my entire current project UI structure** (React components, state management, styles, layout logic).
2. **Detect all issues automatically**:
   - Template selection only available at new-conversation creation
   - No option to change template during existing conversation
   - Cannot create templates independently
   - Attachment icon is in an unnatural/unattractive position
   - Message input bar and send button need standard modern design
   - Model selector missing inside conversation panel
   - No persistence for template/model selection on app restart

3. **Propose a complete UI redesign** for the entire conversation input section:
   - A modern message input bar
   - When typing → input bar expands normally
   - A row below the input bar:
        - Left side: “+” icon → small popup showing attachment types (image, document, audio, etc.)
        - Next to it: model selection dropdown (popup-style)
        - Next to it: template selection dropdown (popup-style)
   - Right side (same line): clean “Send” button
   - All UI must match top AI apps and follow correct spacing, shadows, modern typography, hover states, transitions

4. **Template System Redesign**
   - Move template management to Settings or a dedicated Templates page
   - Allow independent template creation/editing/deletion
   - Allow switching templates inside any conversation
   - Template selection must apply immediately to backend
   - Persist selected template per-user (load on app start)

5. **Model Selector System**
   - Add model dropdown inside conversation input area
   - Sync selection with backend gRPC model selection and other message. Like when we store the message then we need to store the model name also.
     Model selection must apply immediately to backend with user detail or particular area
   - Persist selected model per-user (load on app start)
   - Persist user selection

6. **Give exact implementation instructions**
   - Component hierarchy update (what new components to create)
   - State management update (local state, global/zustand/redux/etc.)
   - IPC/gRPC backend integration changes
   - How to save/restore preferences in local DB/config
   - Accessibility & UX best practices

7. **Output the following clearly:**
   - Final UX flow diagram
   - Detailed UI wireframe description
   - Full React component code (JSX + CSS/Tailwind)
   - Any required refactoring to existing components
   - Events & handlers for attachments/model/template
   - Persistent storage logic
   - Updated backend interaction code examples

8. **Make sure the redesign is consistent with a high-quality assistant UX**, similar to:
   - ChatGPT
   - Gemini
   - Claude
   - Perplexity

### ❗ Important
- You must reason deeply and autonomously about layout, spacing, accessibility, interactions, and persistence.
- You must generate code fully compatible with Electron + React + TypeScript (or JS if needed).
- You must improve everything that looks UI/UX inconsistent.
- You must explain how to integrate all features step-by-step.
- You must propose best-practice modern design patterns.

Now analyze everything and give the full redesigned UI flow, architecture, UX, and implementation.
