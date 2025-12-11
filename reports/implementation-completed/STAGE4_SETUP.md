# Stage 4 Setup Guide

## Quick Start

### 1. Restore Original Store (Temporary)

The refactored store has TypeScript errors that need fixing. Restore the original:

```powershell
Copy-Item "D:\learning\hey\gnani-rnd\react\src\store\useConversationStore.ts.backup" "D:\learning\hey\gnani-rnd\react\src\store\useConversationStore.ts" -Force
```

### 2. Install Dependencies

```powershell
cd D:\learning\hey\gnani-rnd\react
npm install xstate @xstate/react
```

### 3. Build & Test

```powershell
npm run build
npm run dev
```

---

## Monitoring Setup (Optional)

### Install Prometheus

**Windows**:
1. Download from https://prometheus.io/download/
2. Extract to `C:\prometheus`
3. Copy config: `Copy-Item "D:\learning\hey\gnani-rnd-backend\monitoring\prometheus.yml" "C:\prometheus\prometheus.yml"`
4. Run: `.\prometheus.exe`

**Docker**:
```bash
docker run -d -p 9090:9090 \
  -v D:\learning\hey\gnani-rnd-backend\monitoring\prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### Install Grafana

**Windows**:
1. Download from https://grafana.com/grafana/download
2. Install and run
3. Open http://localhost:3001
4. Add Prometheus datasource (http://localhost:9090)
5. Import dashboards from `D:\learning\hey\gnani-rnd-backend\monitoring\grafana\dashboards\`

**Docker**:
```bash
docker run -d -p 3001:3000 grafana/grafana
```

---

## Files Created (23 total)

### Services (7)
- `services/conversation/ConversationService.ts`
- `services/conversation/MessageTreeService.ts`
- `services/conversation/BranchingService.ts`
- `services/message/MessageService.ts`
- `services/message/MessageValidation.ts`
- `services/conversation/index.ts`
- `services/message/index.ts`

### Store Modules (6)
- `store/conversation/state.ts`
- `store/conversation/types.ts`
- `store/conversation/actions.ts`
- `store/conversation/selectors.ts`
- `store/conversation/persistence.ts`
- `store/conversation/index.ts`

### Utilities (5)
- `utils/cleanupTracker.ts`
- `utils/resourceTracker.ts`
- `utils/logger.ts`
- `utils/circuitBreaker.ts`
- `utils/featureFlags.ts`

### Monitoring (5)
- `monitoring/prometheus.yml`
- `monitoring/alerts.yml`
- `monitoring/grafana/dashboards/system-health.json`
- `monitoring/grafana/dashboards/api-performance.json`
- `monitoring/grafana/dashboards/llm-metrics.json`

---

## Next Steps

1. Fix TypeScript errors in refactored store
2. Test all functionality
3. Set up monitoring (optional)
4. Deploy to production

---

## Rollback if Needed

```powershell
# Restore original store
Copy-Item "D:\learning\hey\gnani-rnd\react\src\store\useConversationStore.ts.backup" "D:\learning\hey\gnani-rnd\react\src\store\useConversationStore.ts" -Force

# Rebuild
npm run build
```
