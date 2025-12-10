# Stage 2.7: Light Mode Theme

## Summary
Add light theme option while maintaining Jarvis aesthetic structure, providing better accessibility for users who prefer light interfaces.

## Goals
- Create light theme color palette
- Add theme toggle in settings
- Persist theme preference
- Smooth theme transition animation
- Ensure all components support both themes

## Files to Modify / Create

### Frontend
- `/src/styles/themes/light-theme.css` → **[NEW]** Light theme variables
- `/src/stores/themeStore.ts` → **[NEW]** State for theme preference
- `/src/components/Settings/ThemeToggle.tsx` → **[NEW]** UI toggle

## Detailed Implementation Instructions

### Frontend Implementation

#### Step 1: Define Light Theme Variables
In `/src/styles/themes/light-theme.css`:

- Backgrounds: White/Light Gray
- Text: Dark Gray/Black
- Accents: Darker Cyan or Blue
- Borders: Light Gray

#### Step 2: Create Theme Store
In `/src/stores/themeStore.ts`:

- `theme: 'dark' | 'light'`
- `toggleTheme()`
- Persist to local storage

#### Step 3: Update Components
Ensure all components use CSS variables for colors instead of hardcoded values.

## Acceptance Criteria
- [ ] Users can toggle between dark and light modes
- [ ] Theme preference is saved
- [ ] All UI elements are visible and readable in light mode
- [ ] Transitions between themes are smooth
