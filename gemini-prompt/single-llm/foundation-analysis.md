You are an AI architecture auditor specializing in LLM systems, tool-execution frameworks, real-time assistants, and multi-model platforms.

I will provide you two folders:
1. `gnani-rnd` (Frontend)
2. `gnani-rnd-backend` (Backend)

Your task is to fully analyze the entire project and produce a complete **Single-LLM Foundation Readiness Report** based on the following blueprint (Part A):

--- SINGLE-LLM FOUNDATION BLUEPRINT (REFERENCE) ---
1. Model Serving Layer
2. Prompt & Context Manager
3. Memory & Retrieval (RAG)
4. Tool / Executor Layer
5. Planner + Action Schema
6. Session & Short-Term Memory
7. Observability & Audit
8. Safety & Gating
9. Local Testing Harness
-----------------------------------------------------

### WHAT YOU MUST DO:

### 1. Analyze the entire codebase
Study every file in both folders:
- architecture
- API design
- websocket/gRPC/audio pipelines
- state management
- routing layer
- LLM request layer
- conversation flow
- prompt design
- embeddings
- vector DB usage (if any)
- tool layer (if any)
- session management
- logging, monitoring
- error handling
- security
- filesystem usage
- environment configuration
- packaging and deployment structure

### 2. For EACH of the 9 foundation components:
Produce:
- **Status**: (Implemented / Partially Implemented / Missing)
- **Current Evidence**: cite exact files and code sections
- **Gaps**: what is missing, unclear, or incorrect
- **Required Improvements**: precise steps to reach production standard
- **Risk Level**: High / Medium / Low
- **Implementation Complexity**: Easy / Moderate / Hard

### 3. Then produce a full **Comprehensive Architecture Report (Markdown)**:
This MUST include:
- Executive Summary
- System Diagram (mermaid)
- Full architecture breakdown
- Flow diagrams:
  - Query → LLM → Response flow
  - Audio → VAD → Speech → LLM flow
  - Memory & context flow
  - Backend processing pipeline
- Code-level breakdown: modules, responsibilities, weaknesses
- Missing components & risk analysis
- Recommended folder restructuring (if needed)

### 4. Produce a **Master Development Plan** for Single-LLM foundation:
This must include:
- 3-phase plan: Foundation → Stabilization → Optimization
- Clear, actionable tasks with exact filenames to create/edit
- Required schemas, interfaces, and contracts
- Best-practice architecture patterns
- Testing strategy
- Observability strategy
- Security & gating strategy

### 5. Accuracy requirements
- Be extremely technical
- No generic advice
- All recommendations must point to files/modules or missing components
- Report must be production-oriented for a real LLM platform
- Include code snippets where necessary
- Everything must be in clean, beautiful Markdown

### 6. Output format
Produce a **single Markdown (.md)** report with the following structure:

# Gnani — Single-LLM Foundation Architecture Audit Report
## 1. Executive Summary
## 2. High-Level Architecture Overview
## 3. System Diagram
## 4. Detailed Analysis by Component (1–9)
  - Status
  - Evidence
  - Gaps
  - Risks
  - Improvements
## 5. Cross-Cutting Weaknesses
## 6. Master Development Plan
## 7. Final Recommendations
## 8. Appendix (file mappings, code references)

Make the report extremely complete and ready for engineering leadership.
