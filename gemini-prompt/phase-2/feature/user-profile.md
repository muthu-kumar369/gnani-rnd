You are an expert senior engineer specializing in:
• UX design for personal assistants (Google Assistant, Siri, Alexa)
• Electron + React desktop applications
• User settings panels, dashboards, preference management
• Device management and login history UIs
• User profile & security center design
• Internationalization (locale, language, profile preferences)
• Modern theme systems and Jarvis-style HUD interfaces

Your task:
Design and implement a complete **high-level User Profile & Settings UI** for the Gnani assistant frontend.  
We already have backend schemas for user, profile, settings, devices, security, oauth providers, etc.  
Use ONLY frontend logic — do not modify backend or schema.

Focus on:
• UX architecture
• UI design structure
• Component hierarchy
• State flows
• Settings storage (frontend → backend APIs)
• Maintaining the Jarvis theme and styling

----------------------------------------------------------------------
GOALS
----------------------------------------------------------------------

We want a **top-tier Settings & Profile UI** similar to:
• Google Account (Profile, Security, Devices, Preferences)
• Siri Voice Settings (Voice, Language, Wake Word)
• Alexa App (Devices, Preferences, Activity)
• Jarvis-themed HUD UI with subtle animations

This UI will live inside Electron → React.

The user must be able to:
• View and edit their profile
• Adjust assistant settings (wake word, voice, shortcuts, volume)
• Manage connected devices
• Manage linked OAuth accounts
• View conversation history
• Manage theme & UI personalization
• Review security & login settings
• Review assistant memory / notes (basic frontend view)

----------------------------------------------------------------------
BACKEND SCHEMA (REFERENCE INPUT)
----------------------------------------------------------------------

Use the schemas exactly as the backend defines:

ISettings {
    wakeWord: string
    preferredVoice: string
    volume: number
    theme: string
    shortcuts: Map<string, string>
}

IProfile {
    firstName
    lastName
    dob
    locale
    language
    profilePhoto
}

IDevice {
    deviceId
    deviceName
    deviceType
    lastActive
}

IHistoryItem {
    query
    response
    timestamp
}

ISecurity {
    failedLoginAttempts
    lastFailedLogin
    mfaEnabled
    recoveryEmail
}

IOAuthProvider {
    provider
    providerUserId
    linkedAt
}

User object also includes:
• notes[]
• roles, permissions
• preferences (generic)
• metadata
• isOnboarded
• isActive
• lastLoginAt
• createdAt, updatedAt
• oauthProviders[]
• devices[]
• history[]

----------------------------------------------------------------------
FRONTEND REQUIREMENTS
----------------------------------------------------------------------

You must design and produce:
1. **Complete Settings UX architecture**
2. **Modular component-based layout**
3. **React component tree**
4. **State management structure (Context/Zustand/Recoil — whichever is best)**
5. **Data models mapped to backend schema**
6. **UI flows for editing and saving settings**
7. **Modern and clean Jarvis/HUD-themed UI/UX**
8. **Responsiveness for different device sizes**
9. **Security & Privacy UX best practices**

----------------------------------------------------------------------
SETTINGS SECTIONS (YOU MUST IMPLEMENT)
----------------------------------------------------------------------

### 1. Profile
• First/Last name
• DOB
• Profile photo upload
• Locale & language
• Timezone (deduce from locale)
• Voice input/output language

### 2. Assistant Settings
• Wake Word (“Hey Gnani” editable but validated)
• Preferred Voice (dropdown)
• Volume control slider
• Theme selector (dark/light/system/Jarvis-HUD mode)
• Shortcut commands editor (Map<string,string>)
• Speech speed (frontend only)
• Onboarding reset

### 3. Connected Devices
• Show all devices (from devices[])
• Device types (desktop / mobile / web / speaker)
• Last active time
• Mark a device as “trusted”
• Remove device

### 4. Security
• MFA toggle
• Recovery email
• Login attempts
• Last failed login
• Active sessions
• Option to terminate other sessions

### 5. Linked Accounts (OAuth)
• Show connected providers (Google, Apple, GitHub etc.)
• Add/Remove provider
• Linked timestamps

### 6. Activity History
• Past queries
• Past responses
• Filters: date range, device
• Option to delete items

### 7. Preferences & Metadata
• Generic user preferences (json editor or structured fields)
• Notes[] viewer/editor
• Assistant memory viewer (read-only)

### 8. About / System Info
• App version
• Build number
• License & privacy

----------------------------------------------------------------------
UI/UX STYLE REQUIREMENTS
----------------------------------------------------------------------

• Keep the **Jarvis HUD theme**
• Glassmorphism + neon highlights
• Smooth transitions (Framer Motion)
• Section-based navigation (sidebar or tab layout)
• Every setting should autosave or have a save button per section
• Avoid clutter — group things logically
• Use icons + labels (Lucide / Material)

----------------------------------------------------------------------
OUTPUT FORMAT
----------------------------------------------------------------------

You must return:

1. **Full Settings Architecture Blueprint**
   - Pages
   - Routes
   - Component hierarchy
   - State flows

2. **Detailed UI wireframe descriptions** (text-based)

3. **Recommended React structure**
   - /settings
   - /components/settings
   - /hooks/useUserSettings
   - /context/UserContext
   - etc.

4. **API Integration Plan**
   - Fetch user data
   - Patch updates
   - Optimistic UI updates
   - Error handling

5. **Optional (Bonus): Sample component code**, e.g.:
   - SettingsSidebar.jsx
   - WakeWordEditor.jsx
   - DeviceItem.jsx
   - ProfileEditor.jsx

Ensure the design:
• does NOT break current working functionality  
• is future-proof  
• matches world-class product UX  
• maintains Jarvis theme  
