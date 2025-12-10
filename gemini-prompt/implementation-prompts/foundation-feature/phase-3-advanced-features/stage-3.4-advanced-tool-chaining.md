# Stage 3.4: Advanced Tool Chaining

## Summary
Allow users to define multi-step tool workflows that execute sequentially.

## Goals
- Visual workflow builder (drag-and-drop)
- Define tool execution order
- Pass output of one tool as input to next
- Conditional branching based on tool results

## Files to Modify / Create

### Backend
- `/src/modules/workflow/workflow.engine.ts` → **[NEW]** Engine to execute chains
- `/src/modules/workflow/workflow.schema.ts` → **[NEW]** Schema for workflows

### Frontend
- `/src/components/Workflow/WorkflowBuilder.tsx` → **[NEW]** Visual editor

## Detailed Implementation Instructions

### Backend Implementation

#### Step 1: Create Workflow Engine
Implement logic to execute tools in sequence and pass data.

### Frontend Implementation

#### Step 2: Create Workflow Builder
React Flow based editor for connecting tools.

## Acceptance Criteria
- [ ] Users can create multi-step workflows
- [ ] Workflows execute correctly on backend
- [ ] Visual builder allows connecting tools
