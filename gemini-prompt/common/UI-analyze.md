You are a senior UI/UX architect, frontend code auditor, and human-centered design expert.  
Your task: fully analyze my entire frontend project and produce a complete UI/UX review report.

Frontend Tech:
• React + Vite
• Tailwind / custom CSS
• Electron integration
• Component-driven design

You must thoroughly inspect **every page, component, screen layout, UI state, and interaction**.

--------------------
WHAT YOU MUST ANALYZE
--------------------

1. **UI Layout & Visual Structure**
   — Are elements placed correctly?
   — Are spacing, margins, hierarchy, alignment consistent?
   — Do we follow visual design best practices (proper typography scale, spacing, grids)?
   — Identify ugly, inconsistent, or broken UI layouts.

2. **User Experience Quality**
   — Is the UI intuitive?
   — Are interactions predictable?
   — Is the flow simple and easy to understand?
   — Does the app reduce cognitive load?
   — Are there confusing screens, unnecessary clicks?

3. **Loading States & User Feedback**
   You must validate:
   — Every API call has a proper loader.
   — Buttons get disabled during processing.
   — No double-click, repeated submissions, or flickering states.
   — Retry + error handling UX is correct.
   — Transitions are smooth and not abrupt.

   If missing, you must:
   — Identify all components that need loaders.
   — Suggest ideal loading UI (skeletons, spinners, shimmer).
   — Provide improved code.

4. **Component Architecture**
   — Are components too large?
   — Missing reusables?
   — Bad props usage?
   — State management anti-patterns?
   — Incorrect effect dependencies?
   — Any hard-coded UI that should be configurable?

5. **Accessibility**
   — Missing alt text?
   — Low contrast colors?
   — Buttons that don't look clickable?
   — Bad keyboard navigation?
   — Missing ARIA attributes?

6. **Responsiveness**
   — Are screens responsive?
   — Do layouts break on smaller/larger screens?
   — Identify any fixed width / overflow issues.

7. **Error Handling**
   — Clear user-friendly messages?
   — Proper empty states?
   — Proper network failure states?
   — Proper timeouts / slow network handling?

8. **UI Consistency**
   — Are colors consistent?
   — Button styles consistent?
   — Repeated patterns implemented in a single component?
   — Icons and fonts consistent?

---------------------
FINAL OUTPUT FORMAT
---------------------

Your final answer **must include all of the following sections**:

1. **Complete UI Issues Report**  
   A list of every issue found in the project — layout, UI bugs, UX problems, logic issues, missing loaders, responsiveness issues, accessibility issues.

2. **Severity Rating**  
   For each issue:  
   — Critical (breaks flow)  
   — Major (bad UX)  
   — Minor (improvement)

3. **Screen-by-Screen Review**  
   Evaluate each page/screen individually.

4. **Component-by-Component Review**

5. **Loading State Audit**  
   Identify all missing loaders + provide fixes.

6. **Architecture Improvements**  
   How to restructure components to make UI cleaner + scalable.

7. **UX Recommendations**  
   Complete suggestions to improve:
   — usability  
   — navigation  
   — clarity  
   — speed of understanding

8. **Fixed Example Code**  
   For any broken or suboptimal component, produce corrected, cleaner code.

9. **Design System Suggestions**  
   Recommend:
   — spacing scale  
   — typography scale  
   — color palette fixes  
   — reusable component patterns  

10. **Action Plan**  
    A practical checklist of all tasks needed to fix the UI.

--------------------

Now analyze my entire frontend project directory deeply.  
Be brutally honest.  
Find everything that is wrong or missing.  
Never skip any issue.
