# Stage 3.5: Code Execution Sandbox

## Summary
Enable LLM to write and execute Python/JavaScript code in isolated sandbox for data analysis, math, and visualization.

## Goals
- Execute Python/JS code safely
- Return stdout/stderr to LLM
- Support file generation (charts, csv)
- Resource limits (CPU, RAM, Time)

## Files to Modify / Create

### Backend
- `/src/modules/sandbox/sandbox.service.ts` → **[NEW]** Service to manage sandboxes
- `/src/modules/sandbox/docker.manager.ts` → **[NEW]** Docker container management

### Frontend
- `/src/components/Terminal/CodeOutput.tsx` → **[NEW]** Display execution results

## Detailed Implementation Instructions

### Backend Implementation

#### Step 1: Create Sandbox Service
Use Docker or gVisor to isolate execution.

```typescript
async executeCode(language: string, code: string): Promise<ExecutionResult> {
  // Spin up container
  // Run code
  // Capture output
  // Destroy container
}
```

## Acceptance Criteria
- [ ] LLM can execute Python code
- [ ] Code runs in isolated environment
- [ ] Output is returned to conversation
- [ ] Generated files (plots) are displayed
