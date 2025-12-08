# Stage 6: Metrics & Dashboards

**Priority:** P0 (Blocking Production)  
**Estimated Time:** 1 week  
**Dependencies:** Stage 5 (Logging & Tracing)

---

## Objective

Implement comprehensive Prometheus metrics and Grafana dashboards to provide full observability into system performance, LLM operations, audio processing, and user experience.

---

## Current State Analysis

### Existing Metrics
- **Location:** `src/core/monitoring/metrics.ts`
- **Current Coverage:**
  - Basic LLM call counters
  - Active sessions gauge
  - Some error counters

### Issues
1. ❌ Incomplete metric coverage (missing audio, database, cache metrics)
2. ❌ No Prometheus endpoint configured
3. ❌ No Grafana dashboards
4. ❌ No alerting rules
5. ❌ Metrics not labeled consistently
6. ❌ No SLI/SLO tracking

---

## Implementation Requirements

### 1. Enhanced Metrics Collection

**File:** `src/core/monitoring/metrics.ts`

```typescript
import { Registry, Counter, Histogram, Gauge, Summary } from 'prom-client';
import { createContextualLogger } from '../logger/logger.js';

const logger = createContextualLogger({ module: 'Metrics' });

// Create a Registry
export const register = new Registry();

// Add default metrics (CPU, memory, etc.)
import { collectDefaultMetrics } from 'prom-client';
collectDefaultMetrics({ register });

// ============================================
// HTTP/API Metrics
// ============================================

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const httpRequestSize = new Histogram({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10000, 100000, 1000000],
  registers: [register]
});

export const httpResponseSize = new Histogram({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10000, 100000, 1000000],
  registers: [register]
});

// ============================================
// LLM Metrics
// ============================================

export const llmRequestDuration = new Histogram({
  name: 'llm_request_duration_seconds',
  help: 'Duration of LLM requests in seconds',
  labelNames: ['model', 'operation', 'status'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30, 60],
  registers: [register]
});

export const llmTimeToFirstToken = new Histogram({
  name: 'llm_time_to_first_token_seconds',
  help: 'Time to first token from LLM',
  labelNames: ['model'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register]
});

export const llmTokensTotal = new Counter({
  name: 'llm_tokens_total',
  help: 'Total number of tokens processed',
  labelNames: ['model', 'type'], // type: prompt, completion
  registers: [register]
});

export const llmCacheHits = new Counter({
  name: 'llm_cache_hits_total',
  help: 'Total number of LLM cache hits',
  labelNames: ['hit'], // hit: true, false
  registers: [register]
});

export const llmRequestsTotal = new Counter({
  name: 'llm_requests_total',
  help: 'Total number of LLM requests',
  labelNames: ['model', 'operation', 'status'],
  registers: [register]
});

export const llmStreamingChunks = new Counter({
  name: 'llm_streaming_chunks_total',
  help: 'Total number of streaming chunks sent',
  labelNames: ['model'],
  registers: [register]
});

// ============================================
// Audio Processing Metrics
// ============================================

export const audioProcessingDuration = new Histogram({
  name: 'audio_processing_duration_seconds',
  help: 'Duration of audio processing operations',
  labelNames: ['operation'], // operation: vad, stt, preprocessing
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2],
  registers: [register]
});

export const audioChunksProcessed = new Counter({
  name: 'audio_chunks_processed_total',
  help: 'Total number of audio chunks processed',
  labelNames: ['operation'],
  registers: [register]
});

export const audioQualityScore = new Gauge({
  name: 'audio_quality_score',
  help: 'Audio quality score (SNR)',
  labelNames: ['session_id'],
  registers: [register]
});

export const vadDetections = new Counter({
  name: 'vad_detections_total',
  help: 'Total number of VAD detections',
  labelNames: ['type'], // type: speech_start, speech_end
  registers: [register]
});

export const sttLatency = new Histogram({
  name: 'stt_latency_seconds',
  help: 'Speech-to-text latency',
  labelNames: ['provider'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

export const audioBufferSize = new Gauge({
  name: 'audio_buffer_size_bytes',
  help: 'Current audio buffer size',
  labelNames: ['session_id'],
  registers: [register]
});

// ============================================
// Session Metrics
// ============================================

export const activeSessionsGauge = new Gauge({
  name: 'active_sessions',
  help: 'Number of currently active sessions',
  registers: [register]
});

export const sessionDuration = new Histogram({
  name: 'session_duration_seconds',
  help: 'Duration of sessions',
  buckets: [60, 300, 600, 1800, 3600, 7200],
  registers: [register]
});

export const sessionMessagesTotal = new Counter({
  name: 'session_messages_total',
  help: 'Total number of messages per session',
  labelNames: ['role'], // role: user, assistant
  registers: [register]
});

export const sessionRecoveries = new Counter({
  name: 'session_recoveries_total',
  help: 'Total number of session recoveries',
  labelNames: ['source'], // source: mongodb, redis
  registers: [register]
});

// ============================================
// Database Metrics
// ============================================

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register]
});

export const dbConnectionPoolSize = new Gauge({
  name: 'db_connection_pool_size',
  help: 'Current database connection pool size',
  labelNames: ['state'], // state: active, idle
  registers: [register]
});

export const dbOperationsTotal = new Counter({
  name: 'db_operations_total',
  help: 'Total number of database operations',
  labelNames: ['operation', 'collection', 'status'],
  registers: [register]
});

// ============================================
// Cache Metrics
// ============================================

export const cacheOperations = new Counter({
  name: 'cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'result'], // operation: get, set, del; result: hit, miss, success, error
  registers: [register]
});

export const cacheSize = new Gauge({
  name: 'cache_size_bytes',
  help: 'Current cache size in bytes',
  labelNames: ['cache_type'],
  registers: [register]
});

export const cacheLatency = new Histogram({
  name: 'cache_latency_seconds',
  help: 'Cache operation latency',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
  registers: [register]
});

// ============================================
// Circuit Breaker Metrics
// ============================================

export const circuitBreakerState = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=CLOSED, 1=HALF_OPEN, 2=OPEN)',
  labelNames: ['circuit', 'state'],
  registers: [register]
});

export const circuitBreakerFailures = new Gauge({
  name: 'circuit_breaker_failures',
  help: 'Number of failures in circuit breaker',
  labelNames: ['circuit'],
  registers: [register]
});

export const circuitBreakerTrips = new Counter({
  name: 'circuit_breaker_trips_total',
  help: 'Total number of times circuit breaker opened',
  labelNames: ['circuit'],
  registers: [register]
});

// ============================================
// Error Metrics
// ============================================

export const errorCounter = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['code', 'category', 'severity'],
  registers: [register]
});

export const errorRate = new Gauge({
  name: 'error_rate',
  help: 'Current error rate (errors per minute)',
  labelNames: ['category'],
  registers: [register]
});

// ============================================
// Tool Execution Metrics
// ============================================

export const toolExecutionDuration = new Histogram({
  name: 'tool_execution_duration_seconds',
  help: 'Duration of tool executions',
  labelNames: ['tool_name', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

export const toolExecutionsTotal = new Counter({
  name: 'tool_executions_total',
  help: 'Total number of tool executions',
  labelNames: ['tool_name', 'status'],
  registers: [register]
});

// ============================================
// Business Metrics
// ============================================

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
  labelNames: ['timeframe'], // timeframe: 1m, 5m, 1h, 1d
  registers: [register]
});

export const conversationsCreated = new Counter({
  name: 'conversations_created_total',
  help: 'Total number of conversations created',
  registers: [register]
});

export const messagesPerConversation = new Summary({
  name: 'messages_per_conversation',
  help: 'Number of messages per conversation',
  percentiles: [0.5, 0.9, 0.95, 0.99],
  registers: [register]
});

// ============================================
// Helper Functions
// ============================================

export function incrementLLMCacheHit() {
  llmCacheHits.inc({ hit: 'true' });
}

export function incrementLLMCacheMiss() {
  llmCacheHits.inc({ hit: 'false' });
}

export function incLlmCall(sessionId: string, intent: string, status: string) {
  llmRequestsTotal.inc({ model: 'default', operation: intent, status });
}

export function observeLLMDuration(model: string, duration: number, status: string) {
  llmRequestDuration.observe({ model, operation: 'generate', status }, duration);
}

export function observeHTTPDuration(method: string, route: string, statusCode: number, duration: number) {
  httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
  httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
}

// Export registry for Prometheus endpoint
export default register;
```

### 2. Metrics Middleware

**File:** `src/middleware/metrics.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal, httpRequestSize, httpResponseSize } from '../core/monitoring/metrics.js';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Track request size
  const requestSize = parseInt(req.headers['content-length'] || '0', 10);
  httpRequestSize.observe({ method: req.method, route: req.route?.path || req.path }, requestSize);

  // Capture response
  const originalSend = res.send;
  res.send = function(data: any) {
    const responseSize = Buffer.byteLength(JSON.stringify(data));
    httpResponseSize.observe({ method: req.method, route: req.route?.path || req.path }, responseSize);
    return originalSend.call(this, data);
  };

  // On response finish
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode.toString() },
      duration
    );
    
    httpRequestTotal.inc(
      { method: req.method, route, status_code: res.statusCode.toString() }
    );
  });

  next();
}
```

### 3. Prometheus Endpoint

**File:** `src/routes/metrics.routes.ts`

```typescript
import express from 'express';
import register from '../core/monitoring/metrics.js';

const router = express.Router();

/**
 * GET /metrics
 * Prometheus metrics endpoint
 */
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error: any) {
    res.status(500).end(error.message);
  }
});

export default router;
```

**Register in `src/app.ts`:**

```typescript
import metricsRoutes from './routes/metrics.routes.js';
import { metricsMiddleware } from './middleware/metrics.middleware.js';

// Add metrics middleware (before routes)
app.use(metricsMiddleware);

// Add metrics endpoint
app.use('/', metricsRoutes);
```

### 4. Grafana Dashboards

**File:** `monitoring/grafana/dashboards/system-health.json`

Create 4 comprehensive dashboards:

#### Dashboard 1: System Health

```json
{
  "dashboard": {
    "title": "Gnani - System Health",
    "panels": [
      {
        "title": "CPU Usage",
        "targets": [{
          "expr": "rate(process_cpu_user_seconds_total[5m]) * 100"
        }]
      },
      {
        "title": "Memory Usage",
        "targets": [{
          "expr": "process_resident_memory_bytes / 1024 / 1024"
        }]
      },
      {
        "title": "Active Sessions",
        "targets": [{
          "expr": "active_sessions"
        }]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(errors_total[5m])"
        }]
      }
    ]
  }
}
```

#### Dashboard 2: API Performance

```json
{
  "dashboard": {
    "title": "Gnani - API Performance",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(http_requests_total[5m])"
        }]
      },
      {
        "title": "Request Latency (p95)",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
        }]
      },
      {
        "title": "Requests by Status Code",
        "targets": [{
          "expr": "sum by (status_code) (rate(http_requests_total[5m]))"
        }]
      },
      {
        "title": "Request Size Distribution",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(http_request_size_bytes_bucket[5m]))"
        }]
      }
    ]
  }
}
```

#### Dashboard 3: LLM Performance

```json
{
  "dashboard": {
    "title": "Gnani - LLM Performance",
    "panels": [
      {
        "title": "LLM Request Rate",
        "targets": [{
          "expr": "rate(llm_requests_total[5m])"
        }]
      },
      {
        "title": "LLM Latency (p95)",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(llm_request_duration_seconds_bucket[5m]))"
        }]
      },
      {
        "title": "Time to First Token",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(llm_time_to_first_token_seconds_bucket[5m]))"
        }]
      },
      {
        "title": "Token Usage",
        "targets": [{
          "expr": "rate(llm_tokens_total[5m])"
        }]
      },
      {
        "title": "Cache Hit Rate",
        "targets": [{
          "expr": "rate(llm_cache_hits_total{hit=\"true\"}[5m]) / rate(llm_cache_hits_total[5m])"
        }]
      }
    ]
  }
}
```

#### Dashboard 4: User Experience

```json
{
  "dashboard": {
    "title": "Gnani - User Experience",
    "panels": [
      {
        "title": "Active Users (1h)",
        "targets": [{
          "expr": "active_users{timeframe=\"1h\"}"
        }]
      },
      {
        "title": "Session Duration (avg)",
        "targets": [{
          "expr": "rate(session_duration_seconds_sum[5m]) / rate(session_duration_seconds_count[5m])"
        }]
      },
      {
        "title": "Messages per Conversation",
        "targets": [{
          "expr": "messages_per_conversation"
        }]
      },
      {
        "title": "Audio Quality (SNR)",
        "targets": [{
          "expr": "avg(audio_quality_score)"
        }]
      }
    ]
  }
}
```

### 5. Alerting Rules

**File:** `monitoring/prometheus/alerts.yml`

```yaml
groups:
  - name: gnani_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(errors_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      # LLM latency too high
      - alert: HighLLMLatency
        expr: histogram_quantile(0.95, rate(llm_request_duration_seconds_bucket[5m])) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "LLM latency is high"
          description: "p95 latency is {{ $value }}s"

      # Circuit breaker open
      - alert: CircuitBreakerOpen
        expr: circuit_breaker_state{state="OPEN"} == 2
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Circuit breaker {{ $labels.circuit }} is OPEN"

      # Low cache hit rate
      - alert: LowCacheHitRate
        expr: rate(llm_cache_hits_total{hit="true"}[5m]) / rate(llm_cache_hits_total[5m]) < 0.3
        for: 10m
        labels:
          severity: info
        annotations:
          summary: "LLM cache hit rate is low"
          description: "Hit rate is {{ $value | humanizePercentage }}"

      # High memory usage
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 / 1024 > 4
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Memory usage is high"
          description: "Using {{ $value }}GB of memory"
```

### 6. Docker Compose for Monitoring Stack

**File:** `monitoring/docker-compose.yml`

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/alerts.yml:/etc/prometheus/alerts.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
      - grafana-data:/var/lib/grafana
    depends_on:
      - prometheus

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/config.yml:/etc/alertmanager/config.yml
    command:
      - '--config.file=/etc/alertmanager/config.yml'

volumes:
  prometheus-data:
  grafana-data:
```

**File:** `monitoring/prometheus/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - 'alerts.yml'

scrape_configs:
  - job_name: 'gnani-backend'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/metrics'
```

---

## Testing Requirements

### Manual Testing

```bash
# Start monitoring stack
cd monitoring
docker-compose up -d

# Check Prometheus targets
open http://localhost:9090/targets

# Check Grafana dashboards
open http://localhost:3001
# Login: admin/admin

# Generate some load
for i in {1..100}; do
  curl http://localhost:3000/api/health
done

# Check metrics endpoint
curl http://localhost:3000/metrics
```

### Verification Queries

```promql
# Check if metrics are being collected
up{job="gnani-backend"}

# Check request rate
rate(http_requests_total[5m])

# Check LLM latency
histogram_quantile(0.95, rate(llm_request_duration_seconds_bucket[5m]))

# Check error rate
rate(errors_total[5m])

# Check cache hit rate
rate(llm_cache_hits_total{hit="true"}[5m]) / rate(llm_cache_hits_total[5m])
```

---

## Verification Checklist

- [ ] All metrics exported to Prometheus
- [ ] Prometheus scraping `/metrics` endpoint successfully
- [ ] Grafana connected to Prometheus
- [ ] All 4 dashboards created and displaying data
- [ ] Alerting rules configured
- [ ] Test alerts firing correctly
- [ ] Metrics middleware tracking all HTTP requests
- [ ] LLM metrics tracking token usage and latency
- [ ] Audio metrics tracking processing time
- [ ] Circuit breaker states visible in metrics
- [ ] Database query metrics collected
- [ ] Cache hit/miss rates tracked

---

## Success Criteria

1. ✅ **Full Observability:** All system components instrumented
2. ✅ **Real-time Monitoring:** Dashboards updating every 15s
3. ✅ **Proactive Alerting:** Alerts fire before user impact
4. ✅ **Performance Tracking:** p50, p95, p99 latencies visible
5. ✅ **Business Metrics:** User activity and engagement tracked
6. ✅ **<1% Overhead:** Metrics collection adds <1% latency

---

## Next Steps

After completing this stage:
- **Stage 7:** Database Optimization
- **Stage 8:** Caching & Performance

---

## Notes

- Prometheus retention: 15 days (configurable)
- Grafana dashboards auto-refresh every 30s
- Alert evaluation interval: 30s
- Metrics endpoint should be protected in production (add auth)
- Consider using Prometheus Pushgateway for batch jobs
