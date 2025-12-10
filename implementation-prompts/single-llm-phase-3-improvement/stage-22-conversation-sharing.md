# Stage 22: Conversation Sharing

## Overview
Generate shareable links for conversations with privacy controls.

## Implementation Steps

### Step 1: Add Share Schema
```typescript
const shareSchema = new Schema({
  conversationId: String,
  shareId: { type: String, unique: true },
  createdBy: String,
  expiresAt: Date,
  isPublic: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 }
});
```

### Step 2: Create Share Link
```typescript
const createShareLink = async (conversationId: string) => {
  const shareId = generateUniqueId();
  await Share.create({
    conversationId,
    shareId,
    createdBy: userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  
  return `https://gnani.app/share/${shareId}`;
};
```

### Step 3: Add Share Button
```tsx
const ShareButton = ({ conversationId }) => {
  const handleShare = async () => {
    const link = await createShareLink(conversationId);
    await navigator.clipboard.writeText(link);
    showToast('Link copied to clipboard');
  };
  
  return (
    <button onClick={handleShare}>
      <Share2 size={16} />
      Share
    </button>
  );
};
```

### Step 4: Create Public View Page
```tsx
const SharedConversationPage = ({ shareId }) => {
  const [conversation, setConversation] = useState(null);
  
  useEffect(() => {
    fetchSharedConversation(shareId).then(setConversation);
  }, [shareId]);
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1>{conversation?.title}</h1>
      {conversation?.messages.map(msg => (
        <MessageBubble key={msg._id} message={msg} />
      ))}
    </div>
  );
};
```

## Success Criteria
- ✅ Share links generated successfully
- ✅ Public view works without auth
- ✅ Links expire after set time
- ✅ Privacy controls work

## Estimated Time: 8 hours
