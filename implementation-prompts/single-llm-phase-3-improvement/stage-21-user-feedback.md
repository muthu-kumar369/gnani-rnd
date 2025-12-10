# Stage 21: User Feedback System

## Overview
Add thumbs up/down buttons and feedback collection for responses.

## Implementation Steps

### Step 1: Add Feedback Buttons
```tsx
const FeedbackButtons = ({ messageId }) => {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  
  const handleFeedback = async (type: 'up' | 'down') => {
    setFeedback(type);
    await submitFeedback(messageId, type);
  };
  
  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleFeedback('up')}
        className={feedback === 'up' ? 'text-green-500' : 'text-gray-500'}
      >
        <ThumbsUp size={14} />
      </button>
      <button
        onClick={() => handleFeedback('down')}
        className={feedback === 'down' ? 'text-red-500' : 'text-gray-500'}
      >
        <ThumbsDown size={14} />
      </button>
    </div>
  );
};
```

### Step 2: Add Feedback Modal
```tsx
const FeedbackModal = ({ messageId, onClose }) => (
  <Modal>
    <h3>What went wrong?</h3>
    <textarea placeholder="Tell us more..." />
    <button onClick={submitDetailedFeedback}>Submit</button>
  </Modal>
);
```

### Step 3: Store Feedback
```typescript
// feedback.model.ts
const feedbackSchema = new Schema({
  userId: String,
  messageId: String,
  type: { type: String, enum: ['up', 'down'] },
  comment: String,
  timestamp: { type: Date, default: Date.now }
});
```

## Success Criteria
- ✅ Feedback buttons on all assistant messages
- ✅ Detailed feedback modal for negative feedback
- ✅ Feedback stored in database

## Estimated Time: 6 hours
