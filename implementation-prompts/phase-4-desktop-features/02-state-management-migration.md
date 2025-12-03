# Stage 2: State Management Migration

## Objective
Migrate the application's state management from multiple React Contexts to **Zustand**. This will improve performance (less re-rendering), simplify debugging, and make the codebase more maintainable.

## Context
Currently, the app uses several contexts:
- `GnaniStateContext` (StateMachine)
- `ConversationContext` (Messages)
- `UserContext` (User profile)
- `AuthContext` (Authentication)
- `ToastContext` (Notifications)

These are nested in `App.tsx`, leading to a "provider hell" and potential performance issues.

## Implementation Steps

### 1. Setup
- Install Zustand: `npm install zustand`

### 2. Create Stores

#### [NEW] `src/store/useGnaniStore.ts`
- Migrate `GnaniStateContext`.
- Store `state` (idle, listening, etc.) and `transition` logic.

#### [NEW] `src/store/useConversationStore.ts`
- Migrate `ConversationContext`.
- Store `messages`, `sessionId`, `threading` logic.
- Implement actions: `addMessage`, `regenerateResponse`, `editMessage`, `navigateToBranch`.

#### [NEW] `src/store/useUserStore.ts`
- Migrate `UserContext` and `AuthContext`.
- Store `user`, `isAuthenticated`, `accessToken`.
- Implement actions: `login`, `logout`, `updateSettings`.

### 3. Refactor Components

#### [MODIFY] `src/components/gnani/GnaniCore.tsx`
- Replace `useGnaniStateContext`, `useConversation`, etc., with `useGnaniStore`, `useConversationStore`.

#### [MODIFY] `src/App.tsx`
- Remove the Context Providers (`GnaniStateProvider`, `ConversationProvider`, etc.).
- Ensure the app still loads correctly.

### 4. Cleanup
- Delete the old Context files in `src/context/` once fully migrated.

## Verification
1. Verify that the app builds without errors.
2. Test the full conversation flow (Wake Word -> STT -> LLM -> TTS).
3. Test Authentication (Login/Logout).
4. Test Conversation Threading features.
5. Verify that no functionality is lost during the migration.
