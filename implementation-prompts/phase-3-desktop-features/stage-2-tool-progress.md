# Stage 2: Tool Execution Progress Indicators

## Objective

Implement real-time progress indicators for tool execution so users know which tool is running, how long it's taking, and if it's stuck. This improves transparency without breaking the existing async tool execution flow.

---

## Context

**Current State**:
- Tools execute asynchronously with circuit breaker
- User sees "PROCESSING..." status
- No indication of which tool is running
- No progress feedback

**Desired State**:
- User sees "🔍 Searching web..." when search tool runs
- Progress indicator shows tool execution status
- Terminal shows tool actions (e.g., "Searched for 'weather Paris'")
- Timeout warnings if tool takes too long

**Constraints**:
- Must not break existing tool execution flow
- Must not block LLM streaming
- Must handle tool failures gracefully

---

## Implementation Prompt

### Part 1: Backend - Tool Status Events

**Task**: Add tool execution progress events to gRPC stream.

**Requirements**:

1. **Extend Proto Definition** (`src/proto/gnani.proto`):
   ```protobuf
   message SendAudioStreamResponse {
     string partial_text = 1;
     string llm_chunk = 2;
     string final_text = 3;
     ToolStatus tool_status = 4; // NEW
   }
   
   message ToolStatus {
     string tool_name = 1;
     string status = 2; // 'starting', 'running', 'completed', 'failed'
     int32 progress = 3; // 0-100
     string message = 4; // Human-readable status
     int64 elapsed_ms = 5; // Time elapsed
   }
   ```

2. **Update Tool Registry** (`src/modules/tools/tool.registry.ts`):
   ```typescript
   async executeTool(
     name: string, 
     params: any,
     onProgress?: (status: ToolStatus) => void
   ): Promise<ToolExecutionResult> {
     const startTime = Date.now();
     
     // Emit starting status
     onProgress?.({
       tool_name: name,
       status: 'starting',
       progress: 0,
       message: `Starting ${name}...`,
       elapsed_ms: 0
     });
     
     try {
       // Execute with circuit breaker
       const data = await this.circuitBreaker.execute(async () => {
         // Emit running status
         onProgress?.({
           tool_name: name,
           status: 'running',
           progress: 50,
           message: `Executing ${name}...`,
           elapsed_ms: Date.now() - startTime
         });
         
         return await tool.execute(params);
       });
       
       // Emit completed status
       onProgress?.({
         tool_name: name,
         status: 'completed',
         progress: 100,
         message: `Completed ${name}`,
         elapsed_ms: Date.now() - startTime
       });
       
       return { toolName: name, data };
     } catch (error) {
       // Emit failed status
       onProgress?.({
         tool_name: name,
         status: 'failed',
         progress: 0,
         message: `Failed: ${error.message}`,
         elapsed_ms: Date.now() - startTime
       });
       
       throw error;
     }
   }
   ```

3. **Update Session Manager** (`src/modules/session/session.manager.ts`):
   - Pass `onProgress` callback to tool execution
   - Send tool status via gRPC stream:
   ```typescript
   const onToolProgress = (status: ToolStatus) => {
     const session = this.sessions.get(sessionId);
     if (session?.metadata?.grpcCall) {
       session.metadata.grpcCall.write({
         tool_status: status
       });
     }
   };
   
   await toolRegistry.executeTool(toolName, params, onToolProgress);
   ```

**Implementation Steps**:

1. **Regenerate Proto Files**:
   ```bash
   npm run proto:generate
   ```

2. **Update Tool Registry**:
   - Add `onProgress` callback parameter
   - Emit status at key points (start, running, complete, fail)
   - Track elapsed time

3. **Update Session Manager**:
   - Pass progress callback to tool execution
   - Write tool status to gRPC stream

4. **Add Timeout Warnings**:
   - If tool takes >5s, emit warning status
   - If tool takes >30s, emit timeout status

**Files to Create/Modify**:
- `src/proto/gnani.proto` (MODIFY - add ToolStatus)
- `src/modules/tools/tool.registry.ts` (MODIFY - add progress)
- `src/modules/session/session.manager.ts` (MODIFY - wire up progress)
- `src/modules/tools/tool.interface.ts` (MODIFY - add ToolStatus type)

---

### Part 2: Frontend - Progress Indicators

**Task**: Display tool execution progress in UI.

**Requirements**:

1. **Tool Status Display Component**:
   ```tsx
   const ToolStatusIndicator: React.FC<{ status: ToolStatus }> = ({ status }) => {
     const getIcon = () => {
       switch (status.tool_name) {
         case 'search_web': return <Search className="animate-spin" />;
         case 'get_weather': return <Cloud className="animate-pulse" />;
         case 'calculator': return <Calculator className="animate-bounce" />;
         default: return <Loader className="animate-spin" />;
       }
     };
     
     return (
       <motion.div
         initial={{ opacity: 0, y: -10 }}
         animate={{ opacity: 1, y: 0 }}
         className="flex items-center gap-2 px-4 py-2 bg-cyan-900/20 rounded-lg"
       >
         {getIcon()}
         <span className="text-sm text-cyan-300">{status.message}</span>
         {status.progress > 0 && (
           <div className="w-24 h-1 bg-cyan-900/50 rounded-full overflow-hidden">
             <motion.div
               className="h-full bg-cyan-400"
               initial={{ width: 0 }}
               animate={{ width: `${status.progress}%` }}
               transition={{ duration: 0.3 }}
             />
           </div>
         )}
         <span className="text-xs text-cyan-500/60">{status.elapsed_ms}ms</span>
       </motion.div>
     );
   };
   ```

2. **Integrate with GnaniCore**:
   - Listen for `tool_status` events from IPC
   - Show indicator above spoken text display
   - Auto-hide when tool completes (after 2s fade)

3. **Terminal Action Indicator**:
   - Add tool action messages to terminal:
   ```tsx
   <ActionIndicator>
     <Icon>🔍</Icon>
     <Message>Searched web for "weather in Paris"</Message>
     <Timestamp>2.3s</Timestamp>
   </ActionIndicator>
   ```

**Implementation Steps**:

1. **Create Tool Status Hook** (`useToolStatus.ts`):
   ```typescript
   const useToolStatus = () => {
     const [currentTool, setCurrentTool] = useState<ToolStatus | null>(null);
     
     useEffect(() => {
       const handleToolStatus = (event: any) => {
         const status = event.payload;
         setCurrentTool(status);
         
         // Auto-hide after completion
         if (status.status === 'completed') {
           setTimeout(() => setCurrentTool(null), 2000);
         }
       };
       
       window.gnani?.on('tool:status', handleToolStatus);
       return () => window.gnani?.off('tool:status', handleToolStatus);
     }, []);
     
     return currentTool;
   };
   ```

2. **Update IPC Handler** (`electron/ipc/stream.js`):
   - Listen for `tool_status` from gRPC
   - Forward to renderer via IPC:
   ```javascript
   if (response.tool_status) {
     mainWindow.webContents.send('tool:status', response.tool_status);
   }
   ```

3. **Add to GnaniCore**:
   ```tsx
   const toolStatus = useToolStatus();
   
   return (
     <div>
       {/* Existing components */}
       <AnimatePresence>
         {toolStatus && <ToolStatusIndicator status={toolStatus} />}
       </AnimatePresence>
     </div>
   );
   ```

**Files to Create/Modify**:
- `src/components/gnani/ToolStatusIndicator.tsx` (NEW)
- `src/hooks/useToolStatus.ts` (NEW)
- `src/components/gnani/GnaniCore.tsx` (MODIFY - add indicator)
- `electron/ipc/stream.js` (MODIFY - forward tool status)
- `src/components/terminal/ActionIndicator.tsx` (MODIFY - add tool actions)

---

### Part 3: Tool-Specific Progress

**Task**: Add detailed progress for long-running tools.

**Requirements**:

1. **Web Search Tool**:
   ```typescript
   async execute(params: { query: string }, onProgress?: ProgressCallback) {
     onProgress?.({ progress: 25, message: 'Fetching search results...' });
     const results = await searchAPI.search(params.query);
     
     onProgress?.({ progress: 75, message: 'Processing results...' });
     const processed = await this.processResults(results);
     
     return processed;
   }
   ```

2. **Weather Tool**:
   ```typescript
   async execute(params: { location: string }, onProgress?: ProgressCallback) {
     onProgress?.({ progress: 50, message: `Getting weather for ${params.location}...` });
     const weather = await weatherAPI.get(params.location);
     return weather;
   }
   ```

3. **Calculator Tool**:
   - Instant execution, no progress needed

**Implementation Steps**:

1. **Update Tool Interface**:
   ```typescript
   interface ITool {
     name: string;
     description: string;
     parameters: any;
     execute: (params: any, onProgress?: ProgressCallback) => Promise<any>;
   }
   
   type ProgressCallback = (update: { progress: number; message: string }) => void;
   ```

2. **Update Each Tool Plugin**:
   - Add `onProgress` parameter
   - Emit progress at logical points
   - Keep progress updates minimal (2-3 per tool max)

**Files to Modify**:
- `src/modules/tools/tool.interface.ts` (MODIFY - add ProgressCallback)
- `src/modules/tools/plugins/*` (MODIFY - add progress to each tool)

---

## Testing Checklist

### Backend
- [ ] Tool status events are emitted correctly
- [ ] Progress values are accurate (0-100)
- [ ] Elapsed time is tracked
- [ ] Failed tools emit error status

### Frontend
- [ ] Tool indicator appears when tool starts
- [ ] Progress bar animates smoothly
- [ ] Indicator auto-hides after completion
- [ ] Terminal shows tool actions

### Integration
- [ ] End-to-end: Ask question → Tool runs → Progress shown → Result displayed
- [ ] Multiple tools: Sequential tools show separate indicators
- [ ] Timeout: Long-running tools show warning

---

## Rollback Plan

If issues arise:
1. **Disable progress**: Set feature flag `ENABLE_TOOL_PROGRESS=false`
2. **Fallback**: Show generic "PROCESSING..." without tool details
3. **Proto**: Old clients ignore `tool_status` field (backward compatible)

---

## Success Criteria

- [ ] Users see which tool is running
- [ ] Progress indicator shows execution status
- [ ] Terminal logs tool actions
- [ ] No breaking changes to tool execution
- [ ] Performance: Progress updates add <10ms overhead

---

## Notes

- **Icons**: Use Lucide icons for each tool type
- **Animations**: Keep subtle (no distracting spinners)
- **Timeout**: Show warning if tool takes >5s, error if >30s
- **Future**: Add tool execution history/timeline
