# Stage 4: Conversation Search

## Overview
Add search functionality to find conversations by title, content, or date.

## Implementation Steps

### Step 1: Add Search Bar to Sidebar

```tsx
// ConversationSidebar.tsx
const [searchQuery, setSearchQuery] = useState('');

<input
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Search conversations..."
  className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-sm"
/>
```

### Step 2: Implement Search Logic

```typescript
const searchConversations = async (query: string) => {
  const response = await fetch(
    `http://localhost:3000/api/conversations/search`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': accessToken
      },
      body: JSON.stringify({ query })
    }
  );
  return await response.json();
};
```

### Step 3: Add Search Highlighting

```tsx
const highlightMatch = (text: string, query: string) => {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? <mark key={i} className="bg-cyan-500/30">{part}</mark>
      : part
  );
};
```

## Success Criteria
- ✅ Search works for title and content
- ✅ Results update in real-time
- ✅ Matches are highlighted
- ✅ Search is fast (<200ms)

## Estimated Time: 8 hours
