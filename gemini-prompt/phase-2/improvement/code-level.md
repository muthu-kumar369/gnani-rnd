You are an expert full-stack AI engineer. Analyze the entire codebase of the frontend project:  
`gnani-rnd`

Your goal is to *deeply understand the current architecture and improve it* to match top AI assistants like ChatGPT and Google Gemini — but **without** breaking any existing working features.

===========================================================
🎯 PRIMARY OBJECTIVES
===========================================================

1. **Perform a complete architectural and code-level analysis** of the entire frontend.  
   - Identify bottlenecks, legacy patterns, unnecessary re-renders, bad component structure, and missing abstractions.
   - Understand all critical flows:  
     - Audio → Recognition → Conversation updates  
     - Text input → Streaming response  
     - Tools panel → Conversation panel  
     - Settings, profile, OAuth, theme, device awareness  
     - System prompt builder, UI state machine, context memory usage (via backend APIs)

2. **Do NOT break the existing audio/mic UI flow.**  
   - The mic animation & state machine (Idle → Listening → Thinking → Speaking) is ALREADY well implemented.  
   - Unless absolutely required, **do not rewrite or break this component**.  
   - If optimization is needed, ensure:  
     - identical behavior  
     - identical animations  
     - identical user experience  
     - backward compatible function signatures

3. **Upgrade everything ELSE that needs improvement** to match top-tier AI assistants:
   - Improve the conversation panel logic  
   - Improve the streaming renderer  
   - Improve UI reactivity and performance  
   - Improve internal state management  
   - Make the system adaptive, dynamic, scalable  
   - Make AI capabilities more natural and human-like on the frontend side

4. **Analyze for missing or weak flow integrations**, including:  
   - OAuth after backend upgrade  
   - Settings / Preferences sync with backend  
   - Device awareness (battery, active app, mic device info)  
   - Dynamic conversation builder (no hardcoded values)  
   - Better handling of model response states  
   - Dynamic tool trigger visualization  
   - Memory-aware UI interactions

5. **Perform a comparison with top AI assistant UX flows**, like:
   - ChatGPT  
   - Google Gemini  
   - Claude  
   - Perplexity  
   - Copilot  
   
   And find opportunities to implement:
   - dynamic message grouping  
   - message retry and edit-and-resubmit  
   - smart conversation navigation  
   - subtle AI motion design  
   - cleaner layout architecture  
   - contextual hints  
   - input field auto-expansion + prediction slots  
   - UI-level ranking/hallucination indicators  

6. **Ensure full backward compatibility**  
   Everything must work exactly as before *unless the improvement is safe and clearly beneficial*.

===========================================================
🎯 OUTPUT REQUIREMENTS
===========================================================

Your output must include:

### 1. **Full Analysis Report**
- Current architecture summary  
- Weak points  
- Strong points  
- Missing features  
- Anti-patterns  
- Performance issues  
- Areas causing model confusion or context mismatch  
- Render cycle or re-renders impacting speed  

### 2. **Upgraded Architecture Proposal**
- New enhanced architecture  
- New folder structures (if needed)  
- Suggested state management improvements  
- Removing static logic → replacing with dynamic logic  
- Adopting best practices from top AI assistants  

### 3. **Upgrade Plan (Step-by-step)**  
A migration plan that:  
- **NEVER breaks existing functionality**  
- Keeps mic + animation system intact  
- Ensures compatibility with the backend’s upgraded AI flow  
- Minimizes refactoring risks  

### 4. **Code Generation for Missing Components**
Where needed, generate code for:
- New state managers  
- New hooks  
- Improved streaming components  
- Improved tool visualizers  
- Memory-based UI helpers  
- Dynamic conversation builder  
- Dynamic settings integration  

### 5. **Before vs After Comparison**
For every improvement category:
- Show **what currently exists**  
- Show **what should be done**  
- Explain *why* it improves performance and AI response relevance  

===========================================================
🎯 FINAL EXPECTATION
===========================================================

Provide the complete set of improvements and modify only those parts of the frontend that must change. Preserve working audio/mic flow entirely unless absolutely necessary.

Your final result should transform the frontend into a **modern, dynamic, intelligent, highly-performant interface** equivalent to ChatGPT or Google Gemini — without breaking any existing working flow.

Begin your analysis now.
