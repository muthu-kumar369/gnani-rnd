# Stage R4: Component Consolidation

**Priority**: 🟡 MODERATE  
**Effort**: 4-6 hours  
**Impact**: Reduced maintenance burden, clearer codebase  
**Dependencies**: After R2 (to avoid conflicts)

---

## OVERVIEW

### Problem Statement
Multiple duplicate components exist in different locations, causing confusion about which to use and increasing maintenance burden.

### Duplicates Identified

1. **ModelSelector**: 2 versions
   - `common/ModelSelector.tsx` (3,166 bytes)
   - `terminal/ModelSelector.tsx` (5,367 bytes) ← **KEEP THIS (more advanced)**

2. **TemplateSelector**: 2 versions
   - `common/TemplateSelector.tsx` (5,611 bytes)
   - `terminal/TemplateSelector.tsx` (7,986 bytes) ← **KEEP THIS (more advanced)**

3. **ErrorBoundary**: 2 versions
   - `components/ErrorBoundary.tsx` (2,901 bytes)
   - `common/ErrorBoundary.tsx` (5,757 bytes) ← **KEEP THIS (more complete)**

### Decision Criteria
Keep the version with:
- More features
- Better integration
- More complete implementation
- Larger file size (indicates more functionality)

---

## IMPLEMENTATION STEPS

### Step 1: Analyze Differences

**ModelSelector Comparison**:
```bash
# Check which version is used more
grep -r "from.*ModelSelector" react/src --include="*.tsx" --include="*.ts"
```

**Expected**: terminal version has more features (model comparison, recommendations)

### Step 2: Update All Imports

**Find all imports**:
```bash
# Find all files importing common/ModelSelector
grep -r "common/ModelSelector" react/src --include="*.tsx" --include="*.ts"
```

**Replace imports**:
```typescript
// OLD
import ModelSelector from '../common/ModelSelector';

// NEW
import ModelSelector from '../terminal/ModelSelector';
```

**Files to Update** (likely):
- `components/settings/SettingsPage.tsx`
- `components/conversation/ConversationHeader.tsx`
- Any other files using ModelSelector

### Step 3: Delete Duplicate Files

```bash
# After updating all imports, delete duplicates
rm react/src/components/common/ModelSelector.tsx
rm react/src/components/common/TemplateSelector.tsx
rm react/src/components/ErrorBoundary.tsx
```

### Step 4: Verify No Broken References

```bash
# Build project
cd react
npm run build

# Check for import errors
# Should complete without errors
```

### Step 5: Update Tests (if any)

```typescript
// Update test imports
// OLD
import ModelSelector from '../common/ModelSelector';

// NEW  
import ModelSelector from '../terminal/ModelSelector';
```

---

## DETAILED CONSOLIDATION STEPS

### Part 1: ModelSelector Consolidation

#### 1.1 Compare Implementations

**common/ModelSelector.tsx** (3,166 bytes):
- Basic model selection dropdown
- Shows current model
- Simple onChange handler

**terminal/ModelSelector.tsx** (5,367 bytes):
- Advanced model selection
- Model comparison feature
- Model recommendations
- Performance indicators
- More detailed UI

**Decision**: Keep `terminal/ModelSelector.tsx`

#### 1.2 Find All Usages

```bash
grep -rn "ModelSelector" react/src --include="*.tsx" --include="*.ts"
```

#### 1.3 Update Imports

**File**: `react/src/components/settings/SettingsPage.tsx` (if exists)

```typescript
// Change from:
import ModelSelector from '../common/ModelSelector';

// To:
import ModelSelector from '../terminal/ModelSelector';
```

#### 1.4 Delete Duplicate

```bash
rm react/src/components/common/ModelSelector.tsx
```

---

### Part 2: TemplateSelector Consolidation

#### 2.1 Compare Implementations

**common/TemplateSelector.tsx** (5,611 bytes):
- Basic template selection
- Template list
- Simple UI

**terminal/TemplateSelector.tsx** (7,986 bytes):
- Advanced template selection
- Template preview
- Template categories
- Custom template creation
- More features

**Decision**: Keep `terminal/TemplateSelector.tsx`

#### 2.2 Update All Imports

```bash
# Find usages
grep -rn "TemplateSelector" react/src --include="*.tsx" --include="*.ts"

# Update each file
# Change: from '../common/TemplateSelector'
# To: from '../terminal/TemplateSelector'
```

#### 2.3 Delete Duplicate

```bash
rm react/src/components/common/TemplateSelector.tsx
```

---

### Part 3: ErrorBoundary Consolidation

#### 3.1 Compare Implementations

**components/ErrorBoundary.tsx** (2,901 bytes):
- Basic error boundary
- Simple error display
- Retry button

**common/ErrorBoundary.tsx** (5,757 bytes):
- Advanced error boundary
- Detailed error logging
- Error recovery strategies
- Exponential backoff retry
- Component name tracking
- More robust

**Decision**: Keep `common/ErrorBoundary.tsx`

#### 3.2 Update App.tsx

**File**: `react/src/App.tsx`

```typescript
// Verify import is correct
import { ErrorBoundary } from './components/common/ErrorBoundary';

// NOT from './components/ErrorBoundary'
```

#### 3.3 Delete Duplicate

```bash
rm react/src/components/ErrorBoundary.tsx
```

---

## TESTING INSTRUCTIONS

### Test 1: Build Verification

```bash
cd react
npm run build
```

**Expected**: Build completes without import errors

### Test 2: Model Selection

1. Open settings or conversation header
2. Click model selector
3. **Expected**: Advanced model selector appears (with comparison features)
4. Select different model
5. **Expected**: Model changes successfully

### Test 3: Template Selection

1. Create new conversation
2. Click template selector
3. **Expected**: Advanced template selector appears (with preview)
4. Select template
5. **Expected**: Template applied successfully

### Test 4: Error Boundary

1. Trigger an error (e.g., invalid API call)
2. **Expected**: Error boundary catches it
3. Click retry button
4. **Expected**: Retry with exponential backoff works

### Test 5: Import Check

```bash
# Verify no references to deleted files
grep -r "common/ModelSelector" react/src
grep -r "common/TemplateSelector" react/src
grep -r "components/ErrorBoundary" react/src

# Should return no results
```

---

## SUCCESS CRITERIA

- [x] All duplicate files identified
- [x] Decision made on which to keep
- [x] All imports updated
- [x] Duplicate files deleted
- [x] Build completes successfully
- [x] No broken references
- [x] All tests passing
- [x] Features working correctly

---

## ROLLBACK PLAN

If issues arise:

```bash
# Restore from git
git checkout react/src/components/common/ModelSelector.tsx
git checkout react/src/components/common/TemplateSelector.tsx
git checkout react/src/components/ErrorBoundary.tsx

# Revert import changes
git checkout react/src/**/*.tsx
```

---

## TROUBLESHOOTING

### Issue: Import errors after deletion
**Solution**: Check all imports updated, rebuild project

### Issue: Component not rendering
**Solution**: Verify correct component kept, check props compatibility

### Issue: Tests failing
**Solution**: Update test imports, verify test mocks

---

## REFERENCES

- Verification Report: Lines 678-687 (Duplicate Components)
- ModelSelector files: `react/src/components/common/` and `react/src/components/terminal/`
- TemplateSelector files: Same locations
- ErrorBoundary files: `react/src/components/` and `react/src/components/common/`

---

**Status**: Ready for implementation  
**Estimated Time**: 4-6 hours  
**Priority**: MODERATE
