# Stage R5: Editing Flow Unification

**Priority**: 🟡 MODERATE  
**Effort**: 3-4 hours  
**Impact**: Consistent ChatGPT-style editing UX  
**Dependencies**: After R2 (InlineMessageEditor integration)

---

## OVERVIEW

### Problem Statement
Two editing mechanisms exist:
1. `InlineMessageEditor.tsx` - ChatGPT-style inline editing (NOT integrated)
2. `EditMessageModal.tsx` - Modal-based editing (currently used)

This creates inconsistency and confusion.

### Decision
**Use `InlineMessageEditor.tsx`** as primary editing mechanism for ChatGPT parity.

### Current State
- ❌ InlineMessageEditor exists but NOT used
- ✅ EditMessageModal currently integrated
- ⚠️ Inconsistent with ChatGPT UX (uses modal instead of inline)

### Target State
- ✅ InlineMessageEditor as primary editing mechanism
- ✅ ChatGPT-style inline editing
- ✅ Auto-regeneration on save
- ✅ Keyboard shortcuts (Ctrl+Enter, Esc)
- ❌ EditMessageModal removed (or kept as fallback)

---

## IMPLEMENTATION STEPS

### Step 1: Verify InlineMessageEditor Integration

**Check if R2 completed**:
```bash
grep -n "InlineMessageEditor" react/src/components/terminal/MessageBubble.tsx
```

**Expected**: Should show import and usage from Stage R2

**If NOT integrated**, complete R2 first or integrate now:

```typescript
// react/src/components/terminal/MessageBubble.tsx
import { InlineMessageEditor } from './InlineMessageEditor';

const [isEditing, setIsEditing] = useState(false);

// Render logic
{message.type === 'user' && isEditing ? (
    <InlineMessageEditor
        initialContent={message.message}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
        maxLength={2000}
        autoRegenerate={true}
    />
) : (
    // ... message display
)}
```

---

### Step 2: Remove EditMessageModal

**Find all usages**:
```bash
grep -rn "EditMessageModal" react/src --include="*.tsx" --include="*.ts"
```

**Expected files**:
- `components/terminal/EditMessageModal.tsx` (component file)
- `components/terminal/MessageBubble.tsx` (usage)
- Possibly others

**Remove from MessageBubble.tsx**:
```typescript
// DELETE these lines
import EditMessageModal from './EditMessageModal';
const [showEditModal, setShowEditModal] = useState(false);

// DELETE modal render
{showEditModal && (
    <EditMessageModal
        message={message}
        onClose={() => setShowEditModal(false)}
        onSave={handleSave}
    />
)}

// DELETE modal trigger
onClick={() => setShowEditModal(true)}
```

---

### Step 3: Update Edit Button Handler

**File**: `react/src/components/terminal/MessageBubble.tsx`

```typescript
// REPLACE modal trigger with inline editor trigger
const handleEditClick = () => {
    if (message.type === 'user') {
        setIsEditing(true);
    }
};

// Update button
<button
    onClick={handleEditClick}  // Changed from setShowEditModal(true)
    className="edit-button opacity-0 group-hover:opacity-100"
    title="Edit message"
>
    <Edit2 size={14} />
</button>
```

---

### Step 4: Delete EditMessageModal File

```bash
rm react/src/components/terminal/EditMessageModal.tsx
```

**Alternative**: Keep as fallback for mobile or accessibility

If keeping:
```typescript
// Add comment explaining it's a fallback
/**
 * EditMessageModal.tsx
 * FALLBACK: Used on mobile devices or when inline editing is not suitable
 * Primary editing uses InlineMessageEditor.tsx
 */
```

---

### Step 5: Test Editing Flow

1. Hover over user message
2. Click edit button
3. **Expected**: Message transforms into inline editor (NOT modal)
4. Edit text
5. Press Ctrl+Enter
6. **Expected**: Save and auto-regenerate
7. Press Esc while editing
8. **Expected**: Cancel edit, restore original

---

## TESTING INSTRUCTIONS

### Test 1: Inline Editing

1. Send a user message
2. Hover over message
3. Click edit button
4. **Expected**: Inline editor appears (textarea in place)
5. **NOT Expected**: Modal popup

### Test 2: Save with Auto-Regenerate

1. Edit message
2. Change text
3. Press Ctrl+Enter (or click Save)
4. **Expected**: 
   - Message saved
   - Old assistant responses deleted
   - New response generated
   - Inline editor closes

### Test 3: Cancel Edit

1. Edit message
2. Change text
3. Press Esc (or click Cancel)
4. **Expected**:
   - Changes discarded
   - Original message restored
   - Inline editor closes

### Test 4: Character Limit

1. Edit message
2. Type > 2000 characters
3. **Expected**: Character count shows warning
4. Try to save
5. **Expected**: Save disabled or truncated

### Test 5: No Modal References

```bash
# Verify no EditMessageModal imports
grep -r "EditMessageModal" react/src

# Should only show the file itself (if kept as fallback)
# or no results (if deleted)
```

---

## SUCCESS CRITERIA

- [x] InlineMessageEditor integrated (from R2)
- [x] EditMessageModal removed from MessageBubble
- [x] Edit button triggers inline editor
- [x] No modal popups for editing
- [x] Auto-regeneration works
- [x] Keyboard shortcuts functional
- [x] ChatGPT-style UX achieved

---

## CHATGPT PARITY

ChatGPT Editing:
- Click message → inline edit ✅
- Auto-regenerate on save ✅
- Keyboard shortcuts ✅
- No modal popup ✅

**Verdict**: ✅ **MATCHES** ChatGPT editing UX

---

## ROLLBACK PLAN

If inline editing has issues:

```bash
# Restore EditMessageModal
git checkout react/src/components/terminal/EditMessageModal.tsx
git checkout react/src/components/terminal/MessageBubble.tsx
```

---

## TROUBLESHOOTING

### Issue: Inline editor not appearing
**Solution**: Verify R2 completed, check InlineMessageEditor import

### Issue: Save not triggering regeneration
**Solution**: Check `autoRegenerate` prop set to `true`, verify backend integration

### Issue: Edit button not showing
**Solution**: Check CSS for `.group-hover:opacity-100`, verify hover state

---

## REFERENCES

- Verification Report: Lines 71-73 (Editing Flow recommendation)
- Stage R2: Component Integration (InlineMessageEditor)
- InlineMessageEditor: `react/src/components/terminal/InlineMessageEditor.tsx`
- MessageBubble: `react/src/components/terminal/MessageBubble.tsx`

---

**Status**: Ready for implementation  
**Estimated Time**: 3-4 hours  
**Priority**: MODERATE  
**Note**: Requires R2 completion first
