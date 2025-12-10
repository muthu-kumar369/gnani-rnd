# Stage 3: Message Branching Visualization

## Overview
Implement visual branching UI to show and navigate between different conversation paths, similar to ChatGPT's branching feature.

## Current State
- Backend supports branching via `allMessages` and `currentLeafId`
- No frontend UI to visualize or navigate branches
- Users can't see alternative conversation paths

## Implementation Steps

### Step 1: Add Branch Indicators to Messages

```tsx
// MessageBubble.tsx
const getBranchInfo = () => {
  const siblings = allMessages.filter(m => m.parentId === message.parentId);
  const currentIndex = siblings.findIndex(m => m._id === message._id);
  return { total: siblings.length, current: currentIndex + 1 };
};

const branchInfo = getBranchInfo();

{branchInfo.total > 1 && (
  <div className="flex items-center gap-2 mt-2 text-xs text-cyan-500/60">
    <button onClick={() => navigateBranch('prev')} disabled={branchInfo.current === 1}>
      <ChevronLeft size={14} />
    </button>
    <span>{branchInfo.current} / {branchInfo.total}</span>
    <button onClick={() => navigateBranch('next')} disabled={branchInfo.current === branchInfo.total}>
      <ChevronRight size={14} />
    </button>
  </div>
)}
```

### Step 2: Implement Branch Navigation

```typescript
const navigateBranch = (direction: 'prev' | 'next') => {
  const siblings = allMessages.filter(m => m.parentId === message.parentId);
  const currentIndex = siblings.findIndex(m => m._id === message._id);
  const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
  
  if (newIndex >= 0 && newIndex < siblings.length) {
    const newLeafId = siblings[newIndex]._id;
    updateCurrentLeaf(newLeafId);
  }
};
```

### Step 3: Add Branch Tree Visualization

```tsx
// BranchTree.tsx (NEW)
const BranchTree = ({ allMessages, currentLeafId }) => {
  const buildTree = () => {
    // Build tree structure from flat message list
    const tree = {};
    allMessages.forEach(msg => {
      if (!tree[msg.parentId]) tree[msg.parentId] = [];
      tree[msg.parentId].push(msg);
    });
    return tree;
  };

  return (
    <div className="branch-tree">
      {/* Render tree with SVG connections */}
    </div>
  );
};
```

## Success Criteria
- ✅ Branch indicators show on messages with siblings
- ✅ Navigation between branches works smoothly
- ✅ Current branch is highlighted
- ✅ Branch tree visualization is clear

## Estimated Time: 10 hours
