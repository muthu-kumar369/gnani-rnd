You are upgrading the Settings page implementation in my project.

Project folders:
- gnani-rnd  (Electron + React frontend)
- gnani-rnd-backend (Node.js backend)

The Settings page and its tabs were generated previously by Gemini.  
Now we need to improve it.

IMPORTANT:  
The API documentation for all user/profile/settings endpoints is located at:
D:\AI Project\Gnani\software\gnani-rnd\gemini-prompt\phase-2\api\user-profile-settings.md  
Read and use these API details.

DO NOT ask me for filenames.  
You must detect the correct files automatically.

────────────────────────────────────────
### STRICT RULES — READ CAREFULLY

1. **Do NOT break or remove any existing working flow.**
2. **Do NOT rewrite the UI of SettingsSidebar or other components.**
3. **Only add missing logic or fix broken logic.**
4. **Reuse existing components, hooks, services, API helpers, and auth utilities.**
5. **Only edit the files that require changes.**
6. **Respect the existing architecture:**
     - React UI (frontend)
     - next-like API call layer or fetch wrappers already implemented
     - backend Node API routes

────────────────────────────────────────
### FEATURES TO IMPLEMENT / FIX:

### 1. Add proper API integration for all Settings tabs
- Profile  
- Assistant  
- Devices  
- Security  
- Accounts  
- History  
- Preferences  
- About

Use the endpoint specs from **user-profile-settings.md**.

Gemini must:
- Read the API documentation file.
- Implement the correct API calls inside React components or hooks.
- Use the existing API utility functions (don’t create new ones unless necessary).
- Populate Settings pages with the fetched data.

### 2. Fix the issue where NO API call is firing
Analyze the existing Settings tab components and determine:
- Why the API functions are not running
- Whether useEffect/useQuery/useSWR is misconfigured
- Whether incorrect paths or missing providers exist

Fix the root cause.

### 3. Add authentication protection
Settings pages MUST be accessible ONLY when a valid session token exists.

Implement:
- Auth guard wrapper (reuse existing auth utils)
- Redirect or block access if token is missing
- Prevent API calls from triggering when user is not authenticated

### 4. Implement profile avatar fallback logic
If the profile API returns:

- no image URL  
- null or empty string  
- invalid URL  

Then show:
- existing default-avatar component if available  
- otherwise generate a fallback using initials (e.g., “MK” for Muthu Kumar)

Do NOT break existing UI styling.

### 5. Add a clean loader behavior
Each Settings tab should have:
- Right now it shows a small plain text “loading…” at the top-left.
- Replace it with a **centered animated loader** inside the main content area.
- Use a modern circular spinner or pulse animation that matches the design.
- Ensure the loader does not block other events like mic hotword detection.
- no UI flicker
- loading → success → error states

Must use existing loading components if present.

### 6. Improve tab-switch behavior
When switching tabs:
- loaders must appear immediately
- API calls must re-run only when required
- reuse cached data where appropriate (React Query / SWR / your own fetch cache)

### 7. Ensure complete Settings experience works end-to-end
Gemini must:
- Integrate all API calls
- Handle errors with toasts or alerts (reuse existing components)
- Ensure stable React states
- Do not break layout or animations

────────────────────────────────────────
### DELIVERABLES IN YOUR RESPONSE:

1. Explanation of:
   - why API calls were not firing
   - what was missing or broken
   - how authentication is now enforced

2. List of ALL modified files.

3. Provide COMPLETE updated code for:
   • settings sidebar  
   • each tab component  
   • API integration fixes  
   • auth guard implementation  
   • avatar fallback logic  
   • loader improvements  

4. Ensure ALL existing functionality remains intact.

Start now and provide the updated code.
