# Stage 26: Conversation Folders

## Overview
Organize conversations into folders with drag-and-drop support.

## Implementation Steps

### Step 1: Add Folder Schema
```typescript
const folderSchema = new Schema({
  userId: String,
  name: String,
  color: String,
  icon: String,
  conversationIds: [String],
  createdAt: { type: Date, default: Date.now }
});
```

### Step 2: Create Folder UI
```tsx
const FolderList = ({ folders, onSelect }) => (
  <div className="space-y-2">
    {folders.map(folder => (
      <button
        key={folder._id}
        onClick={() => onSelect(folder)}
        className="flex items-center gap-2 w-full p-2 hover:bg-cyan-500/10 rounded"
      >
        <Folder size={16} style={{ color: folder.color }} />
        <span>{folder.name}</span>
        <span className="ml-auto text-xs text-gray-500">
          {folder.conversationIds.length}
        </span>
      </button>
    ))}
  </div>
);
```

### Step 3: Drag and Drop
```tsx
import { DndContext, DragOverlay } from '@dnd-kit/core';

const handleDragEnd = (event) => {
  const { active, over } = event;
  
  if (over && over.id.startsWith('folder-')) {
    const folderId = over.id.replace('folder-', '');
    moveConversationToFolder(active.id, folderId);
  }
};
```

## Success Criteria
- ✅ Folders created and deleted
- ✅ Drag-and-drop works smoothly
- ✅ Conversations organized by folder
- ✅ Folder colors customizable

## Estimated Time: 8 hours
