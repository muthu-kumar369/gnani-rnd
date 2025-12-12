# STAGE 2: CRITICAL FEATURE MIGRATION

**Duration:** 1-2 weeks  
**Complexity:** Medium-High  
**Risk:** Medium  
**Dependencies:** Stage 1 complete

---

## 🎯 OBJECTIVE

Migrate critical features from terminal components to chat components to achieve feature parity. This stage focuses on three high-priority features:
1. **Feedback Buttons** (thumbs up/down)
2. **Share Conversation** functionality
3. **Branch Visualization** for message alternatives

---

## 📋 SCOPE

### Priority 1: Feedback Buttons (CRITICAL)
- **Current State:** Implemented in `terminal/MessageBubble.tsx`, NOT in `chat/MessageItem.tsx`
- **Backend:** ✅ Ready (`/api/feedback` endpoints)
- **Goal:** Add thumbs up/down buttons to chat messages

### Priority 2: Share Button
- **Current State:** Backend ready, no UI button
- **Backend:** ✅ Ready (`/api/share` endpoints)
- **Goal:** Add share button to ChatHeader

### Priority 3: Branch Visualization
- **Current State:** `BranchTree.tsx` and `GenerationNavigator.tsx` in terminal only
- **Goal:** Add branching UI to chat messages

---

## 🔧 PRIORITY 1: FEEDBACK BUTTONS (2-3 days)

### Current Implementation Analysis

**Terminal Implementation:**
- **File:** `src/components/terminal/MessageBubble.tsx` (line 172)
- **Component:** `src/components/common/FeedbackButtons.tsx` (160 lines)
- **Backend:** `POST /api/feedback` (rating: 'positive' | 'negative')

**Features:**
- Thumbs up/down buttons
- Feedback modal for negative feedback
- Category selection (accuracy, helpfulness, speed, other)
- Optional comment field
- Circuit breaker integration

### Implementation Steps

#### Step 1: Analyze FeedbackButtons Component (30 minutes)

**File to Review:** `src/components/common/FeedbackButtons.tsx`

**Key Features:**
```typescript
interface FeedbackButtonsProps {
    messageId: string;
    conversationId: string;
}

// Features:
// - Thumbs up: Immediate submission
// - Thumbs down: Opens modal for details
// - Category selection
// - Comment field
// - Circuit breaker for API calls
```

#### Step 2: Update MessageItem Component (2-3 hours)

**File:** `src/components/chat/MessageItem.tsx`

**Current Structure:**
```tsx
// Line 2: Add import
import FeedbackButtons from '../common/FeedbackButtons';

// In message actions section (around line 150-200)
// Add FeedbackButtons after existing actions
```

**Implementation:**

```tsx
// src/components/chat/MessageItem.tsx

import React, { useState } from 'react';
import { User, Sparkles, Copy, RefreshCw, Edit2, Check, X } from 'lucide-react';
import FeedbackButtons from '../common/FeedbackButtons'; // ADD THIS
import { useConversationStore } from '../../store/useConversationStore';
// ... other imports

interface MessageItemProps {
    message: Message;
    isLatest?: boolean;
    onEdit?: (messageId: string, newContent: string) => void;
    onRegenerate?: (messageId: string) => void;
    onDelete?: (messageId: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
    message,
    isLatest,
    onEdit,
    onRegenerate,
    onDelete
}) => {
    const { conversationId } = useConversationStore();
    const [showActions, setShowActions] = useState(false);
    
    // ... existing code ...

    return (
        <div 
            className="message-item group relative"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Message content */}
            <div className="message-content">
                {/* ... existing message rendering ... */}
            </div>

            {/* Message actions - ENHANCED */}
            {showActions && message.sender === 'assistant' && (
                <div className="absolute right-2 top-2 flex items-center gap-1 bg-jarvis-bg/90 backdrop-blur-sm border border-jarvis-border/30 rounded-lg p-1">
                    {/* Copy button */}
                    <button
                        onClick={() => handleCopy(message.content)}
                        className="p-1.5 rounded hover:bg-white/10 transition-colors"
                        title="Copy"
                    >
                        <Copy size={14} className="text-cyan-400" />
                    </button>

                    {/* Feedback buttons - NEW */}
                    {conversationId && (
                        <FeedbackButtons
                            messageId={message.id}
                            conversationId={conversationId}
                        />
                    )}

                    {/* Regenerate button */}
                    {isLatest && onRegenerate && (
                        <button
                            onClick={() => onRegenerate(message.id)}
                            className="p-1.5 rounded hover:bg-white/10 transition-colors"
                            title="Regenerate"
                        >
                            <RefreshCw size={14} className="text-cyan-400" />
                        </button>
                    )}

                    {/* Edit button */}
                    {onEdit && (
                        <button
                            onClick={() => handleEdit(message.id)}
                            className="p-1.5 rounded hover:bg-white/10 transition-colors"
                            title="Edit"
                        >
                            <Edit2 size={14} className="text-cyan-400" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessageItem;
```

#### Step 3: Update FeedbackButtons Styling (1 hour)

**File:** `src/components/common/FeedbackButtons.tsx`

**Ensure Jarvis Theme Consistency:**

```tsx
// Update button styles to match Jarvis theme
<button
    onClick={() => handleRating('positive')}
    className={`p-1.5 rounded transition-colors ${
        rating === 'positive'
            ? 'bg-green-500/20 text-green-400'
            : 'text-cyan-400/60 hover:text-green-400 hover:bg-green-500/10'
    }`}
    title="Good response"
>
    <ThumbsUp size={14} />
</button>
```

#### Step 4: Test Feedback Integration (2-3 hours)

**Test Cases:**

1. **Thumbs Up Flow:**
   - Click thumbs up on assistant message
   - Verify button turns green
   - Check network tab: POST /api/feedback with rating: 'positive'
   - Verify feedback saved in database

2. **Thumbs Down Flow:**
   - Click thumbs down on assistant message
   - Verify modal opens
   - Select category (e.g., "Inaccurate information")
   - Add comment (optional)
   - Click Submit
   - Verify modal closes
   - Check network tab: POST /api/feedback with rating: 'negative', category, comment
   - Verify feedback saved in database

3. **Edge Cases:**
   - Change rating (thumbs up → thumbs down)
   - Verify upsert behavior (updates existing feedback)
   - Test without conversationId (should not render)
   - Test on user messages (should not show feedback buttons)

4. **UI/UX:**
   - Hover shows actions smoothly
   - Buttons are properly sized (14px icons)
   - Colors match Jarvis theme
   - Modal is centered and responsive
   - Loading states work correctly

**Verification Commands:**
```bash
# Check feedback in database (if using MongoDB)
# In MongoDB shell or Compass:
db.feedbacks.find({ conversationId: "YOUR_CONVERSATION_ID" })

# Check backend logs
tail -f logs/app.log | grep feedback
```

---

## 🔧 PRIORITY 2: SHARE BUTTON (1-2 days)

### Current Implementation Analysis

**Backend:**
- **Routes:** `src/routes/share.routes.ts`
- **Endpoints:**
  - `POST /api/share` - Create shareable link
  - `GET /api/share/:shareId` - Get shared conversation
  - `DELETE /api/share/:conversationId` - Revoke share

**Frontend:**
- **Page:** `src/pages/SharedConversationPage.tsx` (exists)
- **Missing:** Share button in chat interface

### Implementation Steps

#### Step 1: Create ShareButton Component (2-3 hours)

**File:** `src/components/common/ShareButton.tsx`

```tsx
import React, { useState } from 'react';
import { Share2, Copy, Check, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';
import { useConversationStore } from '../../store/useConversationStore';

interface ShareButtonProps {
    conversationId: string;
    conversationTitle?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ conversationId, conversationTitle }) => {
    const [showModal, setShowModal] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [expiresIn, setExpiresIn] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleShare = async () => {
        setLoading(true);
        try {
            const response = await api.post('/share', {
                conversationId,
                expiresIn: expiresIn ? expiresIn * 86400 : null, // Convert days to seconds
            });
            
            setShareUrl(response.data.shareUrl);
            setShowModal(true);
        } catch (error) {
            console.error('Failed to create share link:', error);
            alert('Failed to create share link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRevoke = async () => {
        try {
            await api.delete(`/share/${conversationId}`);
            setShowModal(false);
            setShareUrl('');
        } catch (error) {
            console.error('Failed to revoke share:', error);
        }
    };

    return (
        <>
            <button
                onClick={handleShare}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-cyan-400 hover:text-cyan-300"
                title="Share conversation"
            >
                <Share2 size={18} />
            </button>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 border border-cyan-500/30 rounded-lg p-6 max-w-md w-full mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-cyan-400">
                                    Share Conversation
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-cyan-500/60 hover:text-cyan-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-cyan-500/80 mb-2">
                                        Share Link
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={shareUrl}
                                            readOnly
                                            className="flex-1 px-3 py-2 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 text-sm focus:outline-none"
                                        />
                                        <button
                                            onClick={handleCopy}
                                            className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                                        >
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleRevoke}
                                        className="flex-1 px-4 py-2 border border-red-500/30 rounded text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        Revoke Share
                                    </button>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ShareButton;
```

#### Step 2: Add ShareButton to ChatHeader (30 minutes)

**File:** `src/components/chat/ChatHeader.tsx`

```tsx
import ShareButton from '../common/ShareButton';
import { useConversationStore } from '../../store/useConversationStore';

const ChatHeader: React.FC = () => {
    const { conversationId, title } = useConversationStore();

    return (
        <div className="chat-header flex items-center justify-between p-4 border-b border-jarvis-border/30">
            <h1 className="text-lg font-semibold text-white">{title || 'New Conversation'}</h1>
            
            <div className="flex items-center gap-2">
                {/* Share button - NEW */}
                {conversationId && (
                    <ShareButton 
                        conversationId={conversationId}
                        conversationTitle={title}
                    />
                )}
                
                {/* Existing buttons */}
                {/* ... */}
            </div>
        </div>
    );
};
```

#### Step 3: Test Share Functionality (1-2 hours)

**Test Cases:**

1. **Create Share Link:**
   - Click share button in ChatHeader
   - Verify modal opens
   - Check network: POST /api/share
   - Verify share URL generated
   - Copy link and verify clipboard

2. **Access Shared Conversation:**
   - Open share URL in incognito/private window
   - Verify conversation loads
   - Verify read-only mode (no editing)
   - Check view count increments

3. **Revoke Share:**
   - Click "Revoke Share" button
   - Verify confirmation
   - Check network: DELETE /api/share/:conversationId
   - Try accessing old link (should show expired/not found)

4. **Edge Cases:**
   - Share without conversationId (button should not render)
   - Share empty conversation
   - Network error handling

---

## 🔧 PRIORITY 3: BRANCH VISUALIZATION (3-4 days)

### Current Implementation Analysis

**Terminal Components:**
- **BranchTree:** `src/components/terminal/BranchTree.tsx` + `BranchTree.css`
- **GenerationNavigator:** `src/components/terminal/GenerationNavigator.tsx` + `GenerationNavigator.css`

**Features:**
- Visual tree of message branches
- Navigate between alternative generations
- Show current branch path

### Implementation Steps

#### Step 1: Copy Terminal Components (1 hour)

```bash
# Copy BranchTree to chat components
cp src/components/terminal/BranchTree.tsx src/components/chat/BranchTree.tsx
cp src/components/terminal/BranchTree.css src/components/chat/BranchTree.css

# Copy GenerationNavigator
cp src/components/terminal/GenerationNavigator.tsx src/components/chat/GenerationNavigator.tsx
cp src/components/terminal/GenerationNavigator.css src/components/chat/GenerationNavigator.css
```

#### Step 2: Adapt Components for Chat (2-3 hours)

**Update imports and styling to match chat theme**

#### Step 3: Add Branch Button to MessageItem (2 hours)

```tsx
// In MessageItem.tsx
import { GitBranch } from 'lucide-react';
import BranchTree from './BranchTree';
import GenerationNavigator from './GenerationNavigator';

// Add state
const [showBranchTree, setShowBranchTree] = useState(false);

// Add button in actions
<button
    onClick={() => setShowBranchTree(!showBranchTree)}
    className="p-1.5 rounded hover:bg-white/10 transition-colors"
    title="Show branches"
>
    <GitBranch size={14} className="text-cyan-400" />
</button>

// Render branch tree below message
{showBranchTree && <BranchTree />}
```

#### Step 4: Test Branching (2-3 hours)

**Test Cases:**
1. Create message branch (edit and regenerate)
2. Navigate between branches
3. Verify branch tree visualization
4. Test generation navigator

---

## ✅ ACCEPTANCE CRITERIA

### Feedback Buttons
- [ ] FeedbackButtons component imported in MessageItem
- [ ] Thumbs up/down buttons visible on assistant messages
- [ ] Thumbs up submits immediately
- [ ] Thumbs down opens modal
- [ ] Feedback saved to backend
- [ ] UI matches Jarvis theme

### Share Button
- [ ] ShareButton component created
- [ ] Share button in ChatHeader
- [ ] Modal opens with share link
- [ ] Copy to clipboard works
- [ ] Revoke share works
- [ ] Shared conversation accessible

### Branch Visualization
- [ ] BranchTree component in chat
- [ ] GenerationNavigator in chat
- [ ] Branch button in message actions
- [ ] Branch tree displays correctly
- [ ] Navigation between branches works

---

## 🧪 TESTING CHECKLIST

- [ ] All features work in development
- [ ] All features work in production build
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All tests pass
- [ ] Responsive design works
- [ ] Accessibility (keyboard navigation)

---

**End of Stage 2 Prompt**
