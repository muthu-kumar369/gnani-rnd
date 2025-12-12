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
