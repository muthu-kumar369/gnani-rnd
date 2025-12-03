You are an expert senior frontend engineer specializing in:
• Electron + React desktop applications
• TypeScript + React hooks + context/state management
• Modern UX for voice assistants (Google Assistant, Siri, Alexa)
• Modular frontend architecture, API integration, and real-time updates
• Jarvis-style HUD and immersive UI

Your task:
Analyze the **existing Gnani frontend project** (User Profile & Settings UI).  
Focus ONLY on **binding frontend components to the backend APIs** that we have already implemented.  
Do NOT break any existing functionality or UI.

----------------------------------------------------------------------  
CURRENT FRONTEND CONTEXT
----------------------------------------------------------------------

• We have a modular settings UI with sections:
  1. Profile
  2. Assistant Settings
  3. Connected Devices
  4. Security
  5. Linked Accounts (OAuth)
  6. Activity History
  7. Preferences & Metadata
  8. About / System Info

• Components are built with React + TypeScript + TailwindCSS + Framer Motion.  
• State management is via Context/Zustand/Recoil (detect which is used).  
• Backend schemas and endpoints already exist for:
  - IUser, IProfile, ISettings, IDevice, ISecurity, IHistoryItem, IOAuthProvider
  - Feature-based modular APIs (Profile, Settings, Devices, Security, OAuth, Preferences, History)

----------------------------------------------------------------------  
GOALS
----------------------------------------------------------------------

1. **API Binding Analysis**
   - Scan all frontend components in `/react/src/components/settings` (and related hooks/context)
   - Identify where API calls exist or are missing
   - Check for full CRUD coverage per feature (fetch, update, delete where applicable)
   - Detect missing optimistic UI handling, error handling, loading states

2. **Implement Missing API Calls**
   - Bind frontend components to existing backend endpoints
   - Include all necessary request/response handling
   - Implement frontend data validation before API calls
   - Include loading, error, and success states
   - Use modular hooks (`useUserSettings`, `useProfile`, `useDevices`, etc.) wherever possible

3. **Maintain UI/UX Integrity**
   - Preserve Jarvis HUD theme
   - Ensure smooth animations and transitions during API fetches/updates
   - Maintain autosave or save buttons per section
   - Ensure all sections properly reflect backend data

4. **State Management**
   - Ensure state reflects backend changes immediately (optimistic updates)
   - Keep components synced with context/global state
   - Use event-driven or subscription patterns if needed for real-time updates

5. **Error Handling & Validation**
   - Show meaningful UI feedback for failed API calls
   - Validate user input before sending to backend
   - Retry or fallback logic if backend is unreachable

6. **Testing & Verification**
   - Include a plan for verifying API bindings
   - Ensure no regressions in existing frontend behavior
   - Provide example tests for critical API-bound components

----------------------------------------------------------------------  
OUTPUT FORMAT
----------------------------------------------------------------------

1. **Analysis Report**
   - Existing API bindings per component/section
   - Missing bindings or incomplete implementations
   - Recommendations for optimization

2. **Hook & Service Implementation**
   - Modular TypeScript hooks for each feature:
     • `useProfile`, `useSettings`, `useDevices`, `useSecurity`, `useOAuth`, `useHistory`, `usePreferences`
   - Include request/response types, error handling, and caching if applicable

3. **Component Updates**
   - Apply API calls to existing components
   - Add loading/error UI where missing
   - Ensure all CRUD operations are functional

4. **State Synchronization**
   - Update global or context state with fetched/updated data
   - Ensure components auto-refresh upon backend changes

5. **Testing Plan**
   - Describe test cases for each API-bound section
   - Include expected UI behavior, API response handling, error states

----------------------------------------------------------------------  
STRICT RULES
----------------------------------------------------------------------

• DO NOT break any existing frontend functionality  
• Use TypeScript for all hooks, services, and components  
• Maintain Jarvis HUD theme and UI animations  
• Only implement missing or incomplete API bindings  
• Keep all changes modular, readable, and maintainable  
• Align fully with backend endpoints/schema already implemented
