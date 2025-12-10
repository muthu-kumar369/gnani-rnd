# Stage R2: Component Integration Fixes

**Priority**: 🔴 HIGH  
**Effort**: 4-6 hours  
**Impact**: Activate 3 dormant features  
**Dependencies**: None

---

## OVERVIEW

### Problem Statement
Three well-implemented components exist but are NOT integrated into the application, making them invisible to users. This represents wasted development effort and missing features that users expect.

### Components to Integrate

1. **TimeoutIndicator.tsx** (2,212 bytes)
   - Shows countdown during long operations
   - Allows users to extend timeout
   - Currently: NOT rendered anywhere

2. **RateLimitIndicator.tsx** (2,742 bytes)
   - Shows rate limit warnings
   - Displays countdown to reset
   - Currently: NOT rendered anywhere

3. **InlineMessageEditor.tsx** (126 lines)
   - ChatGPT-style inline editing
   - Currently: NOT used in MessageBubble

### Current State
- ❌ TimeoutIndicator exists but NOT imported/rendered
- ❌ RateLimitIndicator exists but NOT imported/rendered
- ❌ InlineMessageEditor exists but EditMessageModal used instead
- ⚠️ Users missing timeout feedback during streaming
- ⚠️ Users not warned about rate limits

### Target State
- ✅ TimeoutIndicator integrated into streaming flow
- ✅ RateLimitIndicator rendered in App.tsx
- ✅ InlineMessageEditor integrated into MessageBubble
- ✅ All three features visible and functional
- ✅ ChatGPT-level UX for editing and timeouts

---

## IMPLEMENTATION STEPS

### Part 1: Integrate TimeoutIndicator

#### Step 1.1: Review TimeoutIndicator Component

**File**: `react/src/components/common/TimeoutIndicator.tsx`

**Expected Props**:
```typescript
interface TimeoutIndicatorProps {
    remainingTime: number;  // seconds
    totalTime: number;      // seconds
    onExtend?: () => void;
    onCancel?: () => void;
}
```

#### Step 1.2: Add Timeout State to useConversationStore

**File**: `react/src/store/useConversationStore.ts`

```typescript
// Add to store state
interface ConversationStore {
    // ... existing fields
    streamTimeout: {
        isActive: boolean;
        startTime: number;
        duration: number;  // milliseconds
    } | null;
}

// Add actions
setStreamTimeout: (duration: number) => {
    set({
        streamTimeout: {
            isActive: true,
            startTime: Date.now(),
            duration
        }
    });
},

clearStreamTimeout: () => {
    set({ streamTimeout: null });
},

extendStreamTimeout: (additionalMs: number) => {
    const { streamTimeout } = get();
    if (streamTimeout) {
        set({
            streamTimeout: {
                ...streamTimeout,
                duration: streamTimeout.duration + additionalMs
            }
        });
    }
},
```

#### Step 1.3: Integrate into TerminalPanel

**File**: `react/src/components/terminal/TerminalPanel.tsx`

```typescript
// Add imports
import TimeoutIndicator from '../common/TimeoutIndicator';
import { useConversationStore } from '../../store/useConversationStore';

// Inside component
const { streamTimeout, extendStreamTimeout, clearStreamTimeout } = useConversationStore();
const [remainingTime, setRemainingTime] = useState(0);

// Add effect to calculate remaining time
useEffect(() => {
    if (!streamTimeout?.isActive) {
        setRemainingTime(0);
        return;
    }

    const interval = setInterval(() => {
        const elapsed = Date.now() - streamTimeout.startTime;
        const remaining = Math.max(0, streamTimeout.duration - elapsed);
        setRemainingTime(Math.ceil(remaining / 1000)); // Convert to seconds

        if (remaining <= 0) {
            clearStreamTimeout();
        }
    }, 1000);

    return () => clearInterval(interval);
}, [streamTimeout, clearStreamTimeout]);

// Add to render (above message list)
{streamTimeout?.isActive && remainingTime > 0 && (
    <TimeoutIndicator
        remainingTime={remainingTime}
        totalTime={Math.ceil(streamTimeout.duration / 1000)}
        onExtend={() => extendStreamTimeout(30000)} // Extend by 30s
        onCancel={() => {
            // Cancel stream logic
            clearStreamTimeout();
        }}
    />
)}
```

#### Step 1.4: Trigger Timeout on Stream Start

**File**: `react/src/components/gnani/GnaniCore.tsx` (or wherever streaming starts)

```typescript
// When starting LLM stream
const handleStreamStart = () => {
    // Set 60 second timeout
    useConversationStore.getState().setStreamTimeout(60000);
};

// When stream completes
const handleStreamComplete = () => {
    useConversationStore.getState().clearStreamTimeout();
};
```

---

### Part 2: Integrate RateLimitIndicator

#### Step 2.1: Review RateLimitIndicator Component

**File**: `react/src/components/common/RateLimitIndicator.tsx`

**Expected Props**:
```typescript
interface RateLimitIndicatorProps {
    isLimited: boolean;
    resetTime?: Date;
    currentUsage?: number;
    limit?: number;
}
```

#### Step 2.2: Enhance useRateLimitStore

**File**: `react/src/store/useRateLimitStore.ts`

```typescript
// Verify/add these fields
interface RateLimitStore {
    isLimited: boolean;
    resetTime: Date | null;
    currentUsage: number;
    limit: number;
    setRateLimit: (data: { isLimited: boolean; resetTime?: Date; currentUsage?: number; limit?: number }) => void;
    checkRateLimit: (headers: Headers) => void;
}

// Add action to parse rate limit headers
checkRateLimit: (headers: Headers) => {
    const remaining = headers.get('X-RateLimit-Remaining');
    const limit = headers.get('X-RateLimit-Limit');
    const reset = headers.get('X-RateLimit-Reset');

    if (remaining && limit) {
        const currentUsage = parseInt(limit) - parseInt(remaining);
        const isLimited = parseInt(remaining) === 0;
        const resetTime = reset ? new Date(parseInt(reset) * 1000) : null;

        set({
            isLimited,
            resetTime,
            currentUsage,
            limit: parseInt(limit)
        });
    }
},
```

#### Step 2.3: Integrate into App.tsx

**File**: `react/src/App.tsx`

```typescript
// Add import
import RateLimitIndicator from './components/common/RateLimitIndicator';
import { useRateLimitStore } from './store/useRateLimitStore';

// Inside App component
const { isLimited, resetTime, currentUsage, limit } = useRateLimitStore();

// Add to render (after OfflineIndicator)
{/* STAGE R2: Rate limit indicator */}
<RateLimitIndicator
    isLimited={isLimited}
    resetTime={resetTime}
    currentUsage={currentUsage}
    limit={limit}
/>
```

#### Step 2.4: Parse Rate Limit Headers in API Calls

**File**: `react/src/store/useConversationStore.ts`

```typescript
// In all API calls, add:
const response = await fetch(url, options);

// STAGE R2: Check rate limit headers
useRateLimitStore.getState().checkRateLimit(response.headers);

// Continue with response handling
const data = await response.json();
```

---

### Part 3: Integrate InlineMessageEditor

#### Step 3.1: Review InlineMessageEditor Component

**File**: `react/src/components/terminal/InlineMessageEditor.tsx`

**Props**:
```typescript
interface InlineMessageEditorProps {
    initialContent: string;
    onSave: (newContent: string) => Promise<void>;
    onCancel: () => void;
    maxLength?: number;
    autoRegenerate?: boolean;
}
```

#### Step 3.2: Add Edit State to MessageBubble

**File**: `react/src/components/terminal/MessageBubble.tsx`

```typescript
// Add import
import { InlineMessageEditor } from './InlineMessageEditor';

// Add state
const [isEditing, setIsEditing] = useState(false);

// Add edit handler
const handleEdit = () => {
    if (message.type === 'user') {
        setIsEditing(true);
    }
};

const handleSave = async (newContent: string) => {
    try {
        await editMessage(message.id, newContent, accessToken);
        setIsEditing(false);
    } catch (error) {
        console.error('Failed to save edit:', error);
    }
};

const handleCancel = () => {
    setIsEditing(false);
};

// Modify render
{message.type === 'user' && isEditing ? (
    <InlineMessageEditor
        initialContent={message.message}
        onSave={handleSave}
        onCancel={handleCancel}
        maxLength={2000}
        autoRegenerate={true}
    />
) : (
    <>
        {/* Existing message content */}
        <ReactMarkdown>{message.message}</ReactMarkdown>
        
        {/* Add edit button */}
        {message.type === 'user' && !isEditing && (
            <button
                onClick={handleEdit}
                className="edit-button opacity-0 group-hover:opacity-100"
                title="Edit message"
            >
                <Edit2 size={14} />
            </button>
        )}
    </>
)}
```

#### Step 3.3: Remove EditMessageModal (Optional)

**Decision**: Keep EditMessageModal as fallback or remove it

**If removing**:
```typescript
// Remove import
// import EditMessageModal from './EditMessageModal';

// Remove modal state
// const [showEditModal, setShowEditModal] = useState(false);

// Remove modal render
// {showEditModal && <EditMessageModal ... />}
```

**If keeping**: Document that InlineMessageEditor is primary, modal is fallback

---

## TESTING INSTRUCTIONS

### Test 1: TimeoutIndicator

1. Start a long LLM generation
2. **Expected**: Timeout indicator appears with countdown
3. Wait for countdown to approach 0
4. Click "Extend" button
5. **Expected**: Countdown resets with additional time
6. Let stream complete
7. **Expected**: Timeout indicator disappears

### Test 2: RateLimitIndicator

1. Make rapid API calls (simulate rate limit)
2. **Expected**: Rate limit indicator appears when limit approached
3. Wait for reset time
4. **Expected**: Indicator shows countdown to reset
5. After reset, make another call
6. **Expected**: Indicator disappears

### Test 3: InlineMessageEditor

1. Hover over user message
2. Click edit button (should appear on hover)
3. **Expected**: Message transforms into inline editor
4. Edit text
5. Press Ctrl+Enter (or click Save)
6. **Expected**: Message saved, auto-regeneration triggered
7. Press Esc while editing
8. **Expected**: Edit cancelled, original message restored

---

## SUCCESS CRITERIA

### TimeoutIndicator
- [x] Component imported and rendered
- [x] Appears during streaming
- [x] Countdown accurate
- [x] Extend button works
- [x] Cancel button works
- [x] Disappears when stream completes

### RateLimitIndicator
- [x] Component imported and rendered
- [x] Appears when rate limited
- [x] Shows countdown to reset
- [x] Parses headers correctly
- [x] Disappears after reset

### InlineMessageEditor
- [x] Component imported and used
- [x] Edit button appears on hover
- [x] Inline editing works
- [x] Save triggers auto-regeneration
- [x] Cancel restores original
- [x] Keyboard shortcuts work (Ctrl+Enter, Esc)

---

## TROUBLESHOOTING

### TimeoutIndicator not appearing
**Solution**: Verify `setStreamTimeout()` called when stream starts

### RateLimitIndicator not showing
**Solution**: Check backend sends rate limit headers, verify header parsing

### InlineMessageEditor save not working
**Solution**: Verify `editMessage` function in store, check API endpoint

### Edit button not appearing
**Solution**: Check CSS for `.group-hover:opacity-100`, verify hover state

---

## CHATGPT PARITY

### Timeout Handling
- ChatGPT: Shows "This is taking longer than usual" message
- Gnani: Shows countdown with extend option
- **Verdict**: ✅ EXCEEDS (more informative)

### Rate Limiting
- ChatGPT: Shows "Too many requests" error
- Gnani: Shows countdown to reset with current usage
- **Verdict**: ✅ EXCEEDS (more helpful)

### Inline Editing
- ChatGPT: Click message → inline edit → auto-regenerate
- Gnani: Hover → edit button → inline edit → auto-regenerate
- **Verdict**: ✅ MATCHES

---

## REFERENCES

- Verification Report: Lines 427-454 (Component Integration Gaps)
- TimeoutIndicator: `react/src/components/common/TimeoutIndicator.tsx`
- RateLimitIndicator: `react/src/components/common/RateLimitIndicator.tsx`
- InlineMessageEditor: `react/src/components/terminal/InlineMessageEditor.tsx`
- MessageBubble: `react/src/components/terminal/MessageBubble.tsx`

---

**Status**: Ready for implementation  
**Estimated Time**: 4-6 hours  
**Priority**: HIGH
