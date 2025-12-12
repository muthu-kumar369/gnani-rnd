You are an expert full-stack auditor, architect, and UI/UX system designer.  
Your task is to perform a full deep analysis of the entire **Gnani project**, including both frontend and backend.

## 🎯 Primary Objective
Analyze the whole codebase and identify:
1. **Unused components, unused files, unused hooks, duplicated code, old logic, and dead endpoints**  
2. **Broken or missing wiring** (UI that is built but not connected, backend logic created but never used)  
3. **Flow and state problems** in conversation handling, streaming, sockets, VAD, message regeneration, etc.  
4. **Missing integrations** where code is implemented but not triggered anywhere.  
5. **Architecture gaps** such as unclear boundaries, repeated logic, or inconsistent folder structures.  
6. **Current UI issues** like weak layout, poor design structure, inconsistent spacing, missing animations, UX blockers, etc.

After identifying, you must:
- Create a **new `deprecated/` folder**.  
- List all files/modules/components that should be moved there with reasons.  
- Provide a refactoring plan to completely remove or rewrite them later.

## 🎯 Secondary Objective: Rewrite the Full UI Plan
Analyze the current UI and generate a **top-grade, industry-level UI/UX plan**, inspired by:
- ChatGPT  
- Gemini 2  
- Perplexity  
- Claude 3.5  

Include:
- New layout structure  
- Component hierarchy  
- Navigation system  
- Message terminal design  
- Voice mode experience  
- VAD + mic behavior animations  
- Agent/Tool/Settings UI  
- Conversation list interactions  
- Desktop + mobile responsive design  
- State machine for all voice + AI interactions  

## 🎯 What I Expect in the Output
Provide a **comprehensive Markdown report** with the following sections:

### 1. 📌 Executive Summary
What the project currently looks like & major issues.

### 2. 📁 Architecture Breakdown
A detailed understanding of both frontend and backend:
- Tech stack  
- Folder structure  
- Data flow  
- API flow  
- Voice streaming flow  
- Conversation creation and update logic  

### 3. 🗂 Deprecated Items List
- List all unused components  
- List unused functions  
- Old experimental files  
- Duplicated implementations  
- Non-reachable backend logic  
- Move-to-deprecated advisories

### 4. 🐞 Functional Issues
Identify all functional issues such as:
- Conversation not refreshing  
- Streaming issues  
- VAD false triggers  
- Gnani detecting itself as user voice  
- Missing UI bind of implemented features  

### 5. 🎨 UI/UX Weakness Analysis
Identify every visual/UI issue including:
- Bad spacing  
- Poor visual hierarchy  
- Unfriendly layouts  
- Hard-to-read styling  
- Inconsistent patterns  

### 6. 🆕 The New UI/UX Blueprint (Top Grade)
Present a complete UI redesign plan with:
- High-level layout design  
- Component-level design  
- Interaction flow  
- Animation plan  
- Voice mode system  
- Multi-agent or tool mode  
- Conversation panel behavior  
- Response formatting strategies  
- Regenerate/Edit/Delete/Copy behaviors like ChatGPT

### 7. 🧠 Implementation Roadmap (Multi-Stage)
A full plan to upgrade Gnani in clean phases:
- Phase 1 → cleanup  
- Phase 2 → wiring fix  
- Phase 3 → architecture redesign  
- Phase 4 → new UI  
- Phase 5 → next-gen features (memory layer, tool layer, reasoning layer, neuromodulation layer)

Make sure the output is:
- **Extremely detailed**
- **Logical**
- **Actionable**
- **Broken down into steps**
- **Delivered 100% in Markdown**
