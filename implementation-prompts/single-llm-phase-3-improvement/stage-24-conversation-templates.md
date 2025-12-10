# Stage 24: Conversation Templates

## Overview
Create template gallery for common conversation starters.

## Implementation Steps

### Step 1: Define Templates
```typescript
const templates = [
  {
    id: 'code-review',
    title: 'Code Review',
    description: 'Get feedback on your code',
    prompt: 'Please review this code and suggest improvements:\n\n',
    icon: 'Code'
  },
  {
    id: 'brainstorm',
    title: 'Brainstorming',
    description: 'Generate creative ideas',
    prompt: 'Help me brainstorm ideas for: ',
    icon: 'Lightbulb'
  },
  {
    id: 'explain',
    title: 'Explain Concept',
    description: 'Learn something new',
    prompt: 'Explain this concept in simple terms: ',
    icon: 'BookOpen'
  }
];
```

### Step 2: Create Template Gallery
```tsx
const TemplateGallery = ({ onSelect }) => (
  <div className="grid grid-cols-3 gap-4">
    {templates.map(template => (
      <button
        key={template.id}
        onClick={() => onSelect(template)}
        className="p-4 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10"
      >
        <Icon name={template.icon} size={24} />
        <h3>{template.title}</h3>
        <p className="text-xs text-gray-400">{template.description}</p>
      </button>
    ))}
  </div>
);
```

### Step 3: Allow Custom Templates
```tsx
const CreateTemplateModal = () => (
  <Modal>
    <input placeholder="Template name" />
    <textarea placeholder="Template prompt" />
    <button onClick={saveTemplate}>Save Template</button>
  </Modal>
);
```

## Success Criteria
- ✅ Template gallery shows on new conversation
- ✅ Templates pre-fill input
- ✅ Users can create custom templates
- ✅ Templates searchable

## Estimated Time: 6 hours
