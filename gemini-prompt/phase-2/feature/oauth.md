You are an expert senior engineer specializing in:
• OAuth 2.0 + OAuth 2.1 + OpenID Connect flows
• Electron + React authentication architecture
• Secure auth flows in desktop apps (PKCE, device auth, web auth redirect)
• OAuth provider linking (Google, GitHub, Apple, Microsoft, etc.)
• User Account settings UI (Linked Accounts section)
• Jarvis-style animated UI/UX using React + Tailwind + Framer Motion

Your task:
Implement the FULL **OAuth login + linked accounts** flow in the Gnani frontend (Electron + React).  
The backend already supports OAuth providers via `oauthProviders[]` in the User schema.  
Frontend currently has **no OAuth implementation**.

Do NOT break any existing login, profile, or settings UI.

----------------------------------------------------------------------------------------------------------------
GOALS
----------------------------------------------------------------------------------------------------------------

You must implement BOTH:
1. **OAuth login/sign-in** (used during onboarding or login)
2. **OAuth linking/unlinking inside Settings > Linked Accounts**  

All must integrate with:
• Existing React state management (Context/Zustand/Recoil — auto-detect)
• Existing user session storage
• Jarvis-themed HUD animations and transitions
• Electron security practices (no external script injection)

----------------------------------------------------------------------------------------------------------------
BACKEND (reference)
----------------------------------------------------------------------------------------------------------------

IUser.oauthProviders[] contains:
{
    provider: string   // “google”, “github”, “apple”, etc.
    providerUserId: string
    linkedAt: Date
}

Backend endpoints (assume these EXIST, do not modify backend):
• GET /auth/oauth/:provider/start         → returns OAuth URL
• GET /auth/oauth/callback                → returns JWT + user object
• POST /auth/oauth/link/:provider         → links a provider
• DELETE /auth/oauth/unlink/:provider     → unlinks a provider
• GET /user/me                            → fetch session user

----------------------------------------------------------------------------------------------------------------
FRONTEND REQUIREMENTS
----------------------------------------------------------------------------------------------------------------

Implement the following:

========================================
1. OAuth Login Flow (PKCE + Redirect)
========================================

• Build a reusable function `startOAuth(provider)`  
  → Calls backend `/auth/oauth/:provider/start`  
  → Opens a secure external browser window  
  → Handles callback URL (via deep link or custom Electron handler)  
  → Completes login, stores token, loads user profile  

• Ensure secure redirect handling in Electron:
  - Use `BrowserWindow` with `nodeIntegration: false`
  - Use deep linking (electron-protocol) OR fallback local redirect server

• After callback:
  - Store tokens securely
  - Refresh user state
  - Redirect user to dashboard

========================================
2. Linked Accounts UI (Settings)
========================================

Create a section similar to Google Account → “Security → Linked Accounts”.

Each provider shows:
• Icon (Google/GitHub/Apple/Microsoft)
• Connected status
• Linked timestamp (from backend)
• “Link Account” button (if not linked)
• “Unlink” button (if linked)
• Smooth Framer Motion animations
• Error + success toast notifications

========================================
3. State Management
========================================

Implement:
• `useOAuth()` hook  
• `useUser()` integration for reloading user profile after linking  
• Global state update when provider link/unlink changes  

========================================
4. Electron Compatibility
========================================

Handle:
• OAuth popup via `BrowserWindow`
• Deep link registration  
• Callback token extraction  
• Auto-close popup on success  
• Prevent insecure redirects  

========================================
5. UX & Jarvis-theme Requirements
========================================

• Futuristic animations for linking/unlinking
• Hover magnetic button effects
• Loader animation when OAuth popup is active
• Clean dark/blue Jarvis palette
• Subtle hologram glow around active providers

========================================
6. Deliverables
========================================

Gemini should output:

1. **Analysis**
   - Where to integrate OAuth in the current project
   - Best place to put hooks + services
   - Required changes to Electron main process for OAuth

2. **Implementation**
   - `startOAuth(provider)` function
   - `useOAuth` hook
   - New UI components:
     - `<LinkedAccountsPanel />`
     - `<OAuthProviderCard />`
   - Full TypeScript code for:
     • OAuth popup window  
     • Callback parsing  
     • Login + linking flows  

3. **Integration**
   - Add Linked Accounts tab into the existing Settings UI
   - Bind it to backend APIs
   - Update global user state after linking/unlinking

4. **Testing Plan**
   - Manual + automated test steps for OAuth flows
   - How to test Electron deep linking
   - Expected success + error cases

----------------------------------------------------------------------------------------------------------------
INSTRUCTIONS
----------------------------------------------------------------------------------------------------------------
Perform all changes in a non-destructive way:
• Do NOT remove or break any existing code
• Do NOT replace existing login logic without extending it
• Only add OAuth features on top of the current system
• Preserve all styling + animations + architecture
• Use clean modular code, TypeScript, and reusable components
