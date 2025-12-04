You are an advanced AI engineering system. I will give you a full project analysis report. 
All required information for planning, staging, fixing, and redesigning the project is already inside that report.

Your task is to:

====================================================
## 1. Fully Analyze the Report
- Read the entire report end-to-end.
- Understand all architecture details, flows, gaps, bugs, improvements, missing pieces, and constraints.
- Extract all problem statements, recommendations, and implementation requirements.
- Build a complete mental model of the system: backend, API, WebSocket, gRPC, VAD, tool layer, session state, embeddings, real-time features, and all mentioned architecture.

====================================================
## 2. Convert the Report into a Multi-Stage Plan
Create a structured execution plan with:

### Stage → Task Groups → Subtasks

Each stage must include:
- Stage name
- Description
- Goals
- Impact
- Dependencies
- List of files involved
- Clear, technical steps to implement
- if any setup needed for the backend then we need to create the script file and place that with exisitng script and sync to the main setup script file

Stages should be ordered from foundational → advanced → final stabilization.

====================================================
## 3. Generate Prompt Files for Each Stage
For each stage, generate one Markdown document following this exact structure:

# <Stage Name>

## Summary
Explain what this stage achieves.

## Goals
- Goal 1
- Goal 2
- ...

## Files to Modify / Create
List all paths mentioned in the report or required for the fix.  
Example:
- /src/websocket/assistant.socket.ts → implement complete real-time WebSocket layer
- /src/services/toolLayer.ts → fix invocation logic
(Use real paths from the report.)

## Detailed Implementation Instructions
Provide step-by-step actionable instructions that another AI can execute.
Describe:
- What to add
- What to modify
- What to remove
- What logic to refactor
- Expected behaviors

## Acceptance Criteria
Define clear expected output or behavior to verify completion.

This markdown must act as a self-contained “work-order prompt” that AI can follow to implement the code.

====================================================
## 4. Directory and Output Format

When generating final output:

1. Get the folder:  
   **“Get the directory path where prompt files should be placed from my information.”**

2. Then generate a new folder which i have metioned, if don't get then ask me
3. Inside it, create sub folder (if needed) and file
   ...

4. Provide:
   - The newly created list of generated files  
   - The full content of each `.md` file  
   

====================================================
## 5. Output Rules
- Do not summarize the report.
- Do not skip any issue mentioned in the report.
- Ensure the plan covers all missing pieces even if subtly mentioned.
- Ensure prompts are specific enough for an AI to generate code without guessing.

