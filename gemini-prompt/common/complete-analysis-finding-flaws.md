You are an expert full-stack architect, senior code auditor, and system designer. 
Your job is to deeply analyse the entire Gnani project repository (frontend + backend). 
This analysis must be extremely detailed, file-by-file, code-by-code, with a focus on 
implementation quality, missing integrations, unused code, weak logic, and advanced 
architecture improvements.

### 🎯 Primary Objective
Perform a *full deep audit* of the entire codebase and produce a complete Markdown (.md) report.

---

## 🔍 WHAT YOU MUST ANALYZE  
Scan every file in the repository and produce findings for the following areas:

### 1. **Tech Stack Detection**
- Detect all languages, frameworks, libraries, tools, dependencies.
- Detect unused dependencies.
- Identify outdated or deprecated libraries.
- List build tools, architecture patterns, environment configurations, package scripts.

### 2. **Frontend Analysis (React + Electron)**
For *every file* in src/:
- Identify components, hooks, contexts, services, UI modules, utilities.
- Detect UI features implemented but **not integrated** into the final user interface.
- Detect logic implemented but never used (dead code).
- Detect incomplete UI flows (e.g., UI built but not connected to API).
- Detect basic-level implementations that need advanced behaviour (e.g. VAD logic, history panel, chat actions).
- Identify repeated logic that should be centralized.
- Identify missing state management or incorrect state flow.
- Identify inconsistent UI patterns or missing animation integration.

### 3. **Backend Analysis (Node.js, Express, Socket, Audio, AI pipelines)**
For *every file* in backend/:
- Identify APIs, services, utilities, socket events, stream handlers.
- Detect functions or modules created but **never used anywhere**.
- Detect missing integrations between services (e.g. STT → NLU → LLM → TTS pipeline).
- Detect gaps between frontend usage and backend implementation.
- Detect basic implementations that should be advanced (caching, concurrency control, error handling).
- Identify missing response formats or inconsistent structures.
- Identify duplicated or overly complex logic.

### 4. **Pipeline / AI Layer Analysis**
- Identify how STT, VAD, LLM, TTS, and conversation memory are connected.
- Detect missing states (idle/listening/processing/speaking) or unreliable state transitions.
- Identify places where real-time audio pipeline is broken.
- Identify missing retry / fallback logic.
- Detect performance issues or blocking code inside streaming pipelines.

### 5. **System Integration Check**
- Check if all frontend API calls match backend endpoints.
- Check if all socket events triggered on frontend exist on backend.
- Check if message actions (edit/delete/regenerate) are correctly implemented end-to-end.
- Identify integration gaps between UI → logic → backend → UI.

### 6. **Quality & Architecture Gaps**
- Incorrect folder structure
- No separation of concerns
- No abstraction layers
- Missing modularity
- Hard-coded values
- Race conditions
- Unhandled Promises
- Missing cleanup logic
- Orphaned files

### 7. **Advanced Level Expectations**
Identify which features are currently **basic** but should be **advanced**, e.g.:
- Basic VAD instead of advanced speech onset/offset detection
- Basic chat UI instead of ChatGPT-level UX
- Basic memory logic instead of neuromodulation/meta-layer
- Basic state machine instead of event-driven pipeline

### 8. **Final Required Output**
Generate a single **comprehensive Markdown report** containing:

#### ✔ Project Tech Stack Summary  
#### ✔ Frontend File-by-File Report  
#### ✔ Backend File-by-File Report  
#### ✔ Feature Implementation Map  
#### ✔ Detected Unused Code & Missing Integrations  
#### ✔ Basic-Level → Advanced-Level Upgrade Recommendations  
#### ✔ Architecture Gaps & Fix Plan  
#### ✔ Missing Features / Broken Flows  
#### ✔ High-priority Issues  
#### ✔ Medium-priority Issues  
#### ✔ Low-priority Issues  
#### ✔ Final Migration / Upgrade Plan

---

## 📄 OUTPUT FORMAT
Provide the final result strictly as a **Markdown (.md) file** with sections, tables, and bullet points.

---

## 🧠 SYSTEM BEHAVIOR
- Be extremely detailed.
- Never skip any file.
- Never generalize.
- Provide code references when possible.
- Provide actionable suggestions only.
- Make the report fully ready for engineering implementation.

Begin the full project analysis now.
