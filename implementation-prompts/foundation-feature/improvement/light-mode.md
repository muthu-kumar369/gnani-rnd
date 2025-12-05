You are analyzing my Electron + React app named “Gnani”. I want you to deeply inspect the entire frontend project directory and fix our Light Mode implementation. Right now Light Mode is incorrect and inconsistent. Your task is to discover all problems automatically and redesign Light Mode completely.

### 🔥 Problems Gemini must identify and fix
1. Light mode applies the light color globally but:
   - History menu does NOT change to light mode
   - Text colors are not updated/contrasted properly
   - HUD background stays in dark theme
   - Buttons/hovers are incorrect
   - Conversation panel background inconsistent
   - Sidebar and submenus remain dark
   - Border colors, shadows, and icons not adapted
   - Some components override theme manually

2. Our theme implementation itself is not systematic — Gemini must analyze:
   - How theme switching is stored/applied
   - Any custom theme provider we use
   - Whether we rely on CSS variables, contexts, static styles, class toggles, or inline styling
   - How components override theme colors incorrectly
   - Missing global variables for UI tokens

### 🎯 What I want Gemini to deliver
Gemini must:

---

## 1. **Analyze the entire project**
- Read all components, CSS/Tailwind configs, contexts, theme providers, utils.
- Understand EXACTLY how dark/light mode is currently applied.
- Detect inconsistent theme usage across components.

---

## 2. **Identify all theme issues**
Gemini must list every issue, including:

- Incorrect color tokens  
- Components not using theme variables  
- Static colors hardcoded (e.g., `#fff`, `#000`, etc.)  
- Sections missing theme classes  
- Icons not adapting to theme  
- Text contrast issues  
- Menu/HUD/history/sidebar not switching  
- Mixed Tailwind + custom CSS color conflicts  
- Wrong theme persistence logic  

---

## 3. **Propose a modern, scalable theme architecture**
Gemini must design a full theming system:

- Root-level CSS variables for both light/dark  
- Semantic tokens (background-primary, background-secondary, surface, border, text-primary, text-secondary, etc.)  
- Tailwind config with theme tokens  
- A clean theme provider using context or Zustand  
- Correct system to apply theme class on `<html>` or `<body>`  
- Smooth transition animations  
- Full app-wide consistency  

---

## 4. **Provide exact implementation steps**
Gemini must give full instructions:

- What files to modify  
- How to define global theme variables  
- How to refactor each component  
- How to remove hardcoded colors  
- How to update Tailwind config  
- How to fix icons for theme switching  
- How to rewrite global.css / index.css  
- How to handle persistence of theme with electron-store or localStorage  

---

## 5. **Generate complete code**
Gemini must output:

### A. New theme token structure
- CSS variables for dark and light  
- Tailwind `extend.theme` config  
- Example usage in components  

### B. Refactored component code
- Sidebar (dark+light)  
- History menu  
- HUD background  
- Chat list  
- Message input bar  
- Settings modal  
- Conversation background  
- Buttons, dropdowns, text, icons  

### C. Theme provider code
- Context/Zustand implementation  
- Logic to toggle theme  
- Persistence on restart  
- Auto-apply theme on app load  

### D. Theme QA checklist
- Contrast validation  
- WCAG guidelines  
- Component consistency check  

---

## 6. **Ensure both Light and Dark Mode Look Premium**
Gemini must redesign the UI to match the quality of:

- ChatGPT  
- Gemini  
- Claude  
- Perplexity  

with polished:

- spacing  
- border-radius  
- shadow tokens  
- surface layers  
- blended backgrounds  
- text contrast  
- icon tinting  

---

### ❗ Important
- You MUST reason deeply and inspect the entire project before proposing solutions.
- You MUST detect all theme inconsistencies automatically.
- You MUST rewrite the UI theming in a scalable, maintainable way.
- You MUST apply modern standards (design tokens, semantic color layers).
- Make sure the final theme implementation is production-ready.

Now analyze the entire frontend project and produce the full theme redesign, fixes, refactoring, and implementation in detail.
