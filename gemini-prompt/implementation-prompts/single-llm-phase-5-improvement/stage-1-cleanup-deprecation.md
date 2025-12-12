# STAGE 1: CLEANUP & DEPRECATION

**Duration:** 3-5 days  
**Complexity:** Low  
**Risk:** Low  
**Dependencies:** None

---

## 🎯 OBJECTIVE

Clean up the codebase by moving unused components to a `deprecated/` folder and removing old backup files. This stage prepares the codebase for future enhancements by removing dead code and organizing deprecated items.

---

## 📋 SCOPE

### Items to Deprecate

1. **chat/Sidebar.tsx** (17KB, 344 lines)
   - **Location:** `src/components/chat/Sidebar.tsx`
   - **Reason:** ChatLayout uses `ConversationSidebar` instead
   - **Evidence:** No imports found, ConversationSidebar has more features (folders, sort)

2. **Plugin Components**
   - `src/components/common/PluginMarketplace.tsx`
   - `src/components/common/PluginCard.tsx`
   - **Reason:** User confirmed not needed

3. **Avatar Components** (5 files)
   - `src/components/gnani/avatar/GnaniAvatar.tsx`
   - `src/components/gnani/avatar/RealHumanAvatar.tsx`
   - `src/components/gnani/avatar/AvatarContainer.tsx`
   - `src/components/gnani/avatar/LipSyncEngine.ts`
   - `src/components/gnani/avatar/AvatarConfig.ts`
   - **Reason:** User confirmed to deprecate

4. **Backup Files**
   - `src/store/useConversationStore.ts.backup` (35KB)
   - **Action:** DELETE (not move)

---

## 🗂️ FOLDER STRUCTURE

Create the following structure:

```
src/
├── deprecated/
│   ├── README.md (explanation of deprecated items)
│   ├── chat/
│   │   └── Sidebar.tsx
│   ├── common/
│   │   ├── PluginMarketplace.tsx
│   │   └── PluginCard.tsx
│   └── gnani/
│       └── avatar/
│           ├── GnaniAvatar.tsx
│           ├── RealHumanAvatar.tsx
│           ├── AvatarContainer.tsx
│           ├── LipSyncEngine.ts
│           └── AvatarConfig.ts
```

---

## 📝 IMPLEMENTATION STEPS

### Step 1: Create Deprecated Folder Structure (30 minutes)

```bash
# Create deprecated folder structure
mkdir -p src/deprecated/chat
mkdir -p src/deprecated/common
mkdir -p src/deprecated/gnani/avatar
```

### Step 2: Create README.md in deprecated/ (15 minutes)

Create `src/deprecated/README.md`:

```markdown
# Deprecated Components

This folder contains components that are no longer used in the active codebase.

## Deprecation Date
December 12, 2025

## Deprecated Items

### chat/Sidebar.tsx
- **Reason:** Replaced by ConversationSidebar
- **Replacement:** Use `components/conversation/ConversationSidebar.tsx`
- **Features:** ConversationSidebar has folders, sort options, and better organization

### Plugin Components
- **Reason:** Plugin marketplace feature not needed
- **Files:** PluginMarketplace.tsx, PluginCard.tsx

### Avatar Components
- **Reason:** Avatar feature deprecated per user request
- **Files:** GnaniAvatar.tsx, RealHumanAvatar.tsx, AvatarContainer.tsx, LipSyncEngine.ts, AvatarConfig.ts

## Migration Guide

If you need to restore any component:
1. Copy from deprecated/ back to original location
2. Update imports in consuming files
3. Run tests to verify integration
```

### Step 3: Move chat/Sidebar.tsx (15 minutes)

```bash
# Move Sidebar to deprecated
git mv src/components/chat/Sidebar.tsx src/deprecated/chat/Sidebar.tsx
```

**Verification:**
- Check that no files import `from './chat/Sidebar'` or `from '../chat/Sidebar'`
- Run: `grep -r "from.*chat/Sidebar" src/`
- Expected: No results

### Step 4: Move Plugin Components (15 minutes)

```bash
# Move plugin components
git mv src/components/common/PluginMarketplace.tsx src/deprecated/common/PluginMarketplace.tsx
git mv src/components/common/PluginCard.tsx src/deprecated/common/PluginCard.tsx
```

**Verification:**
- Check imports: `grep -r "PluginMarketplace\|PluginCard" src/`
- Expected: No imports outside deprecated/

### Step 5: Move Avatar Components (20 minutes)

```bash
# Move avatar components
git mv src/components/gnani/avatar/GnaniAvatar.tsx src/deprecated/gnani/avatar/GnaniAvatar.tsx
git mv src/components/gnani/avatar/RealHumanAvatar.tsx src/deprecated/gnani/avatar/RealHumanAvatar.tsx
git mv src/components/gnani/avatar/AvatarContainer.tsx src/deprecated/gnani/avatar/AvatarContainer.tsx
git mv src/components/gnani/avatar/LipSyncEngine.ts src/deprecated/gnani/avatar/LipSyncEngine.ts
git mv src/components/gnani/avatar/AvatarConfig.ts src/deprecated/gnani/avatar/AvatarConfig.ts

# Remove empty avatar directory
rmdir src/components/gnani/avatar
```

**Verification:**
- Check GnaniCore.tsx for avatar imports
- Run: `grep -r "GnaniAvatar\|RealHumanAvatar\|AvatarContainer\|LipSyncEngine\|AvatarConfig" src/components/gnani/`
- If found, comment out or remove avatar-related code

### Step 6: Delete Backup Files (5 minutes)

```bash
# Delete backup file
rm src/store/useConversationStore.ts.backup
```

**Verification:**
- Confirm file is deleted: `ls src/store/*.backup`
- Expected: No files found

### Step 7: Update Git Ignore (10 minutes)

Add to `.gitignore`:

```
# Backup files
*.backup
*.bak
*.old
```

### Step 8: Audit Imports (1-2 hours)

**Critical:** Search for any remaining imports of deprecated components

```bash
# Search for Sidebar imports
grep -r "from.*chat/Sidebar" src/

# Search for plugin imports
grep -r "PluginMarketplace\|PluginCard" src/

# Search for avatar imports
grep -r "GnaniAvatar\|RealHumanAvatar\|AvatarContainer\|LipSyncEngine\|AvatarConfig" src/
```

**For each found import:**
1. Determine if it's in deprecated/ (OK) or active code (MUST FIX)
2. If in active code:
   - For Sidebar: Replace with ConversationSidebar
   - For plugins: Remove feature
   - For avatars: Remove feature or comment out

### Step 9: Run Tests (30 minutes)

```bash
# Run all tests
npm run test

# Run build
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

**Expected:**
- All tests pass
- Build succeeds
- No TypeScript errors

### Step 10: Create Deprecation Report (30 minutes)

Create `DEPRECATION_REPORT.md` in project root:

```markdown
# Deprecation Report - December 12, 2025

## Summary
Moved 9 files to deprecated/, deleted 1 backup file.

## Deprecated Components

| Component | Size | Reason | Replacement |
|-----------|------|--------|-------------|
| chat/Sidebar.tsx | 17KB | Unused | ConversationSidebar |
| PluginMarketplace.tsx | - | Not needed | None |
| PluginCard.tsx | - | Not needed | None |
| GnaniAvatar.tsx | - | Feature deprecated | None |
| RealHumanAvatar.tsx | - | Feature deprecated | None |
| AvatarContainer.tsx | - | Feature deprecated | None |
| LipSyncEngine.ts | - | Feature deprecated | None |
| AvatarConfig.ts | - | Feature deprecated | None |

## Deleted Files
- useConversationStore.ts.backup (35KB)

## Verification
- ✅ All tests passing
- ✅ Build successful
- ✅ No broken imports
- ✅ TypeScript clean

## Next Steps
Proceed to Stage 2: Critical Feature Migration
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] `deprecated/` folder created with proper structure
- [ ] `deprecated/README.md` created with documentation
- [ ] All 8 components moved to deprecated/
- [ ] Backup file deleted
- [ ] No broken imports in active code
- [ ] All tests passing
- [ ] Build succeeds
- [ ] TypeScript compiles without errors
- [ ] Deprecation report created
- [ ] Git commits made with clear messages

---

## 🧪 TESTING CHECKLIST

### Manual Testing
- [ ] Application starts without errors
- [ ] ChatLayout renders correctly (uses ConversationSidebar)
- [ ] No console errors related to missing components
- [ ] No 404 errors for missing files

### Automated Testing
- [ ] `npm run test` - All tests pass
- [ ] `npm run build` - Build succeeds
- [ ] `npx tsc --noEmit` - No TypeScript errors
- [ ] `npm run lint` - No linting errors

### Code Review Checklist
- [ ] No imports of deprecated components in active code
- [ ] Deprecated folder has README.md
- [ ] Git history shows clear move operations
- [ ] No dead code left in active codebase

---

## 📊 SUCCESS METRICS

- **Files Moved:** 8 components
- **Files Deleted:** 1 backup file
- **Broken Imports:** 0
- **Test Failures:** 0
- **Build Errors:** 0
- **Time Saved:** Cleaner codebase for future development

---

## 🚨 ROLLBACK PLAN

If issues arise:

```bash
# Restore from git
git checkout HEAD -- src/components/chat/Sidebar.tsx
git checkout HEAD -- src/components/common/PluginMarketplace.tsx
git checkout HEAD -- src/components/common/PluginCard.tsx
git checkout HEAD -- src/components/gnani/avatar/

# Remove deprecated folder
rm -rf src/deprecated/
```

---

## 📚 REFERENCES

- Analysis Report: `GNANI_UI_UPGRADE_ANALYSIS.md` - Section 2
- ConversationSidebar: `src/components/conversation/ConversationSidebar.tsx`
- ChatLayout: `src/layouts/ChatLayout.tsx` (line 82-87)

---

## 💡 NOTES

- **DO NOT DELETE** - Move to deprecated/ for potential future reference
- **Git History** - Use `git mv` to preserve file history
- **Documentation** - Update README.md if it references deprecated components
- **Future Cleanup** - After 6 months, can permanently delete deprecated/ folder

---

**End of Stage 1 Prompt**
