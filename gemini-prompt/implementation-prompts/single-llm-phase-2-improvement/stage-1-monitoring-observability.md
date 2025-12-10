# Stage 1: Production Monitoring & Observability

**Priority:** P0 (Blocking Production)  
**Duration:** 5 days  
**Dependencies:** None  
**Current Completion:** 60%

---

## Context & Background

### Current State Analysis

Gnani currently has foundational monitoring infrastructure in place but lacks the production-grade observability required for reliable operation:

**✅ What Exists:**
- `src/core/monitoring/metrics.ts` - Prometheus metrics collection
- `src/core/monitoring/tracing.ts` - OpenTelemetry tracing setup
- `src/core/monitoring/latency.monitor.ts` - Latency tracking
- `src/core/logger/logger.ts` - Winston structured logging
- `src/core/logger/audit.service.ts` - Audit logging

**❌ What's Missing:**
- Grafana dashboards for visualization
- Complete distributed tracing integration
- Alerting system (Slack/email/PagerDuty)
- Log aggregation (ELK stack or Loki)
- Real-time monitoring dashboard
- Performance analytics and insights

### Why This Matters

Without comprehensive monitoring:
- **No visibility** into system health and performance
- **Cannot detect** issues before they impact users
- **Cannot diagnose** production problems efficiently
- **Cannot measure** SLA compliance (99.9% uptime target)
- **Cannot optimize** based on real usage patterns

---

## Objectives

### Primary Goals

1. **Real-time Visibility** - See system health at a glance
2. **Proactive Alerting** - Detect issues before users notice
3. **Debugging Support** - Trace requests end-to-end
4. **Performance Insights** - Understand bottlenecks and optimization opportunities
5. **Compliance** - Track and prove SLA adherence

### Success Criteria

- [ ] Grafana dashboards showing all key metrics
- [ ] Distributed tracing working for all critical paths
- [ ] Alert rules configured with appropriate thresholds
- [ ] Alerts delivered to Slack/email within 30 seconds
- [ ] Log aggregation capturing all application logs
- [ ] Monitoring runbook documented
- [ ] Team can diagnose issues using monitoring tools

---

## Technical Requirements

### 1. Grafana Dashboard Setup

#### Infrastructure Setup

**Option A: Docker Compose (Recommended for Development)**
```yaml
# Add to docker-compose.yml
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    depends_on:
      - prometheus

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

volumes:
  grafana-data:
  prometheus-data:
```

**Option B: Kubernetes (Production)**
- Use Helm charts for Grafana and Prometheus
- Configure persistent volumes
- Set up ingress for external access

#### Dashboard Requirements

Create the following dashboards:

**Dashboard 1: System Overview**
- CPU usage (per service)
- Memory usage (per service)
- Disk I/O
- Network traffic
- Active connections
- Request rate (requests/sec)
- Error rate (errors/sec)
- p50, p95, p99 latency

**Dashboard 2: LLM Performance**
- LLM request rate
- LLM response time (p50, p95, p99)
- Token usage (input/output)
- Cache hit rate
- Circuit breaker status
- Model selection distribution
- Streaming vs non-streaming ratio
- LLM errors by type

**Dashboard 3: Session Metrics**
- Active sessions
- Session creation rate
- Session duration distribution
- Session recovery rate
- Session checkpoint frequency
- Audio buffer size
- Transcript processing time
- Context building time

**Dashboard 4: Audio Pipeline**
- Audio input level (dBFS)
- VAD trigger frequency
- Whisper transcription time
- Audio quality score (SNR)
- TTS generation time
- TTS playback latency
- Audio preprocessing time (when implemented)

**Dashboard 5: Memory & RAG**
- Vector search latency
- Embedding generation time
- Memory retrieval count
- Summarization frequency
- ChromaDB query performance
- Memory decay operations
- Cache hit rate (memory)

**Dashboard 6: Tool Execution**
- Tool execution count (by tool)
- Tool execution time (by tool)
- Tool success/failure rate
- Tool cache hit rate
- Concurrent tool executions

**Dashboard 7: Database & Cache**
- MongoDB query time
- MongoDB connection pool
- Redis latency
- Redis memory usage
- Cache hit/miss ratio
- Database errors

**Dashboard 8: gRPC & API**
- gRPC request rate
- gRPC error rate
- HTTP API request rate
- HTTP API error rate
- WebSocket connections
- Rate limit hits

#### Implementation Steps

1. **Create Prometheus Configuration**
   - File: `monitoring/prometheus/prometheus.yml`
   - Configure scrape targets for all services
   - Set scrape interval (15s recommended)
   - Configure retention period (15 days minimum)

2. **Create Grafana Datasource Configuration**
   - File: `monitoring/grafana/datasources/prometheus.yml`
   - Configure Prometheus as datasource
   - Set default dashboard refresh interval

3. **Create Dashboard JSON Files**
   - Create one JSON file per dashboard
   - Use Grafana dashboard provisioning
   - Include variables for service filtering
   - Add annotations for deployments

4. **Enhance Existing Metrics**
   - Review `src/core/monitoring/metrics.ts`
   - Add missing metrics (see list below)
   - Ensure all metrics have labels
   - Add metric documentation

**Required Metrics (add if missing):**

```typescript
// LLM Metrics
llm_request_total (counter) - labels: model, status
llm_request_duration_seconds (histogram) - labels: model
llm_tokens_total (counter) - labels: model, type (input/output)
llm_cache_hit_total (counter) - labels: model
llm_circuit_breaker_state (gauge) - labels: model

// Session Metrics
session_active_total (gauge)
session_created_total (counter)
session_duration_seconds (histogram)
session_checkpoint_total (counter)
session_recovery_total (counter) - labels: status

// Audio Metrics
audio_input_level_dbfs (gauge)
vad_trigger_total (counter)
whisper_transcription_duration_seconds (histogram)
audio_quality_snr_db (gauge)
tts_generation_duration_seconds (histogram)

// Memory Metrics
vector_search_duration_seconds (histogram)
embedding_generation_duration_seconds (histogram)
memory_retrieval_total (counter)
summarization_total (counter)

// Tool Metrics
tool_execution_total (counter) - labels: tool_name, status
tool_execution_duration_seconds (histogram) - labels: tool_name
tool_cache_hit_total (counter) - labels: tool_name

// Database Metrics
db_query_duration_seconds (histogram) - labels: operation, collection
db_connection_pool_size (gauge)
redis_operation_duration_seconds (histogram) - labels: operation
redis_memory_bytes (gauge)

// API Metrics
grpc_request_total (counter) - labels: method, status
grpc_request_duration_seconds (histogram) - labels: method
http_request_total (counter) - labels: method, path, status
http_request_duration_seconds (histogram) - labels: method, path
websocket_connections_active (gauge)
rate_limit_exceeded_total (counter) - labels: endpoint
```

---

### 2. Distributed Tracing Integration

#### Current State
- OpenTelemetry SDK initialized in `src/core/monitoring/tracing.ts`
- Basic tracing setup exists
- **Missing:** Full integration across all services

#### Requirements

**Tracing Backend Options:**
1. **Jaeger** (Recommended for development)
   - Easy to set up with Docker
   - Good UI for trace visualization
   - Low resource requirements

2. **Tempo** (Recommended for production)
   - Integrates well with Grafana
   - Cost-effective storage
   - Scales well

**Implementation Steps:**

1. **Set Up Tracing Backend**

```yaml
# Add to docker-compose.yml
jaeger:
  image: jaegertracing/all-in-one:latest
  ports:
    - "16686:16686"  # Jaeger UI
    - "4318:4318"    # OTLP HTTP receiver
  environment:
    - COLLECTOR_OTLP_ENABLED=true
```

2. **Complete Tracing Integration**

Update `src/core/monitoring/tracing.ts`:

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { GrpcInstrumentation } from '@opentelemetry/instrumentation-grpc';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis-4';

export function initializeTracing() {
  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'gnani-backend',
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
    }),
    spanProcessor: new BatchSpanProcessor(traceExporter),
    instrumentations: [
      new HttpInstrumentation(),
      new GrpcInstrumentation(),
      new MongoDBInstrumentation(),
      new RedisInstrumentation(),
    ],
  });

  sdk.start();
  
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.error('Error terminating tracing', error));
  });
}
```

3. **Add Custom Spans for Critical Paths**

Create `src/core/monitoring/tracing.helper.ts`:

```typescript
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('gnani-backend');

export async function traceAsyncOperation<T>(
  spanName: string,
  operation: () => Promise<T>,
  attributes?: Record<string, any>
): Promise<T> {
  return tracer.startActiveSpan(spanName, async (span) => {
    try {
      if (attributes) {
        span.setAttributes(attributes);
      }
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
```

4. **Instrument Critical Services**

Add tracing to:
- `src/modules/session/session.coordinator.ts` - Session lifecycle
- `src/modules/llm/llm.service.ts` - LLM requests
- `src/modules/memory/memory.manager.ts` - Memory operations
- `src/modules/vector/vector.manager.ts` - Vector search
- `src/modules/tool/tool.service.ts` - Tool execution
- `src/modules/session/context.builder.ts` - Context building

Example for LLM service:

```typescript
import { traceAsyncOperation } from '@/core/monitoring/tracing.helper';

async generateResponse(request: LLMRequest): Promise<LLMResponse> {
  return traceAsyncOperation(
    'llm.generateResponse',
    async () => {
      // existing implementation
    },
    {
      'llm.model': request.model,
      'llm.temperature': request.temperature,
      'llm.max_tokens': request.maxTokens,
    }
  );
}
```

5. **Link Traces Across Services**

- Propagate trace context in gRPC metadata
- Add trace ID to logs for correlation
- Include trace ID in API responses (header)

---

### 3. Alerting System

#### Alert Channels

**Primary Channel: Slack**
- Create dedicated #gnani-alerts channel
- Use Slack webhook integration
- Include runbook links in alerts

**Secondary Channel: Email**
- For critical alerts only
- Escalation after 5 minutes

**Optional: PagerDuty**
- For production incidents
- On-call rotation support

#### Alert Rules

Create `monitoring/prometheus/alerts.yml`:

```yaml
groups:
  - name: system_health
    interval: 30s
    rules:
      # High Error Rate
      - alert: HighErrorRate
        expr: rate(http_request_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"
          runbook: "https://docs.gnani.ai/runbooks/high-error-rate"

      # High Latency
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1.0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "p95 latency is {{ $value }}s (threshold: 1s)"

      # LLM Circuit Breaker Open
      - alert: LLMCircuitBreakerOpen
        expr: llm_circuit_breaker_state == 1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "LLM circuit breaker is open"
          description: "Circuit breaker for {{ $labels.model }} is open"
          runbook: "https://docs.gnani.ai/runbooks/llm-circuit-breaker"

      # Low Cache Hit Rate
      - alert: LowCacheHitRate
        expr: rate(llm_cache_hit_total[10m]) / rate(llm_request_total[10m]) < 0.3
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low cache hit rate"
          description: "Cache hit rate is {{ $value | humanizePercentage }} (threshold: 30%)"

      # High Memory Usage
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 / 1024 > 8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}GB (threshold: 8GB)"

      # Database Connection Pool Exhausted
      - alert: DatabaseConnectionPoolExhausted
        expr: db_connection_pool_size >= db_connection_pool_max * 0.9
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "{{ $value }} connections in use"

      # Session Recovery Failures
      - alert: HighSessionRecoveryFailures
        expr: rate(session_recovery_total{status="failed"}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High session recovery failure rate"
          description: "{{ $value }} session recoveries failing per second"

      # Whisper Transcription Slow
      - alert: SlowWhisperTranscription
        expr: histogram_quantile(0.95, rate(whisper_transcription_duration_seconds_bucket[5m])) > 2.0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Whisper transcription is slow"
          description: "p95 transcription time is {{ $value }}s (threshold: 2s)"

      # Rate Limiting Triggered Frequently
      - alert: FrequentRateLimiting
        expr: rate(rate_limit_exceeded_total[5m]) > 10
        for: 5m
        labels:
          severity: info
        annotations:
          summary: "Frequent rate limiting"
          description: "{{ $value }} rate limit hits per second on {{ $labels.endpoint }}"
```

#### Alertmanager Configuration

Create `monitoring/prometheus/alertmanager.yml`:

```yaml
global:
  slack_api_url: '${SLACK_WEBHOOK_URL}'

route:
  receiver: 'slack-notifications'
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - match:
        severity: critical
      receiver: 'slack-critical'
      continue: true
    - match:
        severity: critical
      receiver: 'email-critical'
      repeat_interval: 30m

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - channel: '#gnani-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
        send_resolved: true

  - name: 'slack-critical'
    slack_configs:
      - channel: '#gnani-alerts'
        title: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}\nRunbook: {{ .Annotations.runbook }}{{ end }}'
        send_resolved: true
        color: 'danger'

  - name: 'email-critical'
    email_configs:
      - to: 'oncall@gnani.ai'
        from: 'alerts@gnani.ai'
        smarthost: 'smtp.gmail.com:587'
        auth_username: '${SMTP_USERNAME}'
        auth_password: '${SMTP_PASSWORD}'
        headers:
          Subject: 'CRITICAL: {{ .GroupLabels.alertname }}'
```

---

### 4. Log Aggregation

#### Option A: Loki + Promtail (Recommended)

**Advantages:**
- Lightweight and cost-effective
- Integrates seamlessly with Grafana
- Label-based indexing (like Prometheus)
- Easy to set up

**Setup:**

```yaml
# Add to docker-compose.yml
loki:
  image: grafana/loki:latest
  ports:
    - "3100:3100"
  volumes:
    - ./monitoring/loki/loki-config.yml:/etc/loki/local-config.yaml
    - loki-data:/loki
  command: -config.file=/etc/loki/local-config.yaml

promtail:
  image: grafana/promtail:latest
  volumes:
    - ./monitoring/promtail/promtail-config.yml:/etc/promtail/config.yml
    - /var/log:/var/log
    - ./logs:/app/logs
  command: -config.file=/etc/promtail/config.yml
```

Create `monitoring/loki/loki-config.yml`:

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2024-01-01
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb:
    directory: /loki/index
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: true
  retention_period: 336h  # 14 days
```

Create `monitoring/promtail/promtail-config.yml`:

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: gnani-backend
    static_configs:
      - targets:
          - localhost
        labels:
          job: gnani-backend
          __path__: /app/logs/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            message: message
            timestamp: timestamp
            service: service
            trace_id: trace_id
      - labels:
          level:
          service:
      - timestamp:
          source: timestamp
          format: RFC3339
```

#### Option B: ELK Stack (Elasticsearch, Logstash, Kibana)

**Use if:** You need advanced search capabilities or already have ELK infrastructure.

**Note:** More resource-intensive than Loki.

#### Log Format Standardization

Ensure all logs follow this JSON format:

```json
{
  "timestamp": "2025-12-09T12:00:00.000Z",
  "level": "info",
  "service": "session-coordinator",
  "message": "Session created successfully",
  "trace_id": "abc123",
  "span_id": "def456",
  "user_id": "user_789",
  "session_id": "session_123",
  "metadata": {
    "duration_ms": 150,
    "model": "llama3.1"
  }
}
```

Update `src/core/logger/logger.ts` to ensure compliance.

---

### 5. Monitoring Runbook

Create `docs/runbooks/monitoring.md`:

```markdown
# Monitoring Runbook

## Dashboard Access

- **Grafana:** http://localhost:3000 (admin/admin)
- **Prometheus:** http://localhost:9090
- **Jaeger:** http://localhost:16686
- **Loki:** http://localhost:3100

## Key Metrics to Watch

### System Health
- Error rate < 0.1%
- p95 latency < 200ms (text), < 500ms (audio)
- CPU usage < 80%
- Memory usage < 8GB

### LLM Performance
- Cache hit rate > 30%
- Circuit breaker closed
- Response time p95 < 3s

### Session Management
- Session recovery success rate > 99%
- Active sessions < 1000 (per instance)

## Alert Response Procedures

### High Error Rate
1. Check Grafana "System Overview" dashboard
2. Identify failing service in traces
3. Check logs for error details
4. Review recent deployments
5. Rollback if necessary

### LLM Circuit Breaker Open
1. Check Ollama service health
2. Verify network connectivity
3. Check Ollama logs
4. Restart Ollama if needed
5. Circuit breaker will auto-close after recovery

### High Latency
1. Check "LLM Performance" dashboard
2. Identify slow operations in traces
3. Check database query performance
4. Review cache hit rates
5. Consider scaling if sustained

### Database Connection Pool Exhausted
1. Check active connections in MongoDB
2. Look for long-running queries
3. Check for connection leaks
4. Restart service if needed
5. Increase pool size if sustained

## Common Issues

### Grafana Dashboard Not Loading
- Check Prometheus is running: `curl http://localhost:9090/-/healthy`
- Verify datasource configuration
- Check Grafana logs: `docker logs gnani-grafana`

### Missing Metrics
- Verify Prometheus scrape targets: http://localhost:9090/targets
- Check service is exposing /metrics endpoint
- Verify firewall rules

### Traces Not Appearing
- Check Jaeger is running: `curl http://localhost:16686`
- Verify OTEL_EXPORTER_OTLP_ENDPOINT environment variable
- Check application logs for tracing errors

## Performance Baselines

| Metric | Baseline | Warning | Critical |
|--------|----------|---------|----------|
| Error Rate | < 0.01% | > 0.1% | > 1% |
| p95 Latency (text) | 150ms | 200ms | 500ms |
| p95 Latency (audio) | 400ms | 500ms | 1000ms |
| LLM Cache Hit Rate | 40% | 30% | 20% |
| Memory Usage | 4GB | 8GB | 12GB |
| CPU Usage | 40% | 80% | 95% |
```

---

## Implementation Checklist

### Day 1: Infrastructure Setup
- [ ] Add Grafana, Prometheus, Jaeger, Loki to docker-compose.yml
- [ ] Create configuration files for all services
- [ ] Start services and verify connectivity
- [ ] Configure Grafana datasources

### Day 2: Metrics Enhancement
- [ ] Review existing metrics in `src/core/monitoring/metrics.ts`
- [ ] Add missing metrics (see list above)
- [ ] Add labels to all metrics
- [ ] Test metric collection in Prometheus

### Day 3: Dashboard Creation
- [ ] Create 8 Grafana dashboards (see requirements)
- [ ] Add dashboard provisioning configuration
- [ ] Test dashboard refresh and queries
- [ ] Add variables for filtering

### Day 4: Tracing Integration
- [ ] Complete OpenTelemetry integration
- [ ] Add custom spans to critical services
- [ ] Test trace propagation across services
- [ ] Link traces to logs (trace_id)

### Day 5: Alerting & Documentation
- [ ] Create alert rules in Prometheus
- [ ] Configure Alertmanager
- [ ] Set up Slack webhook
- [ ] Test alert delivery
- [ ] Write monitoring runbook
- [ ] Document dashboard usage

---

## Testing & Validation

### Metrics Testing
```bash
# Test Prometheus scraping
curl http://localhost:9090/api/v1/targets

# Test metric endpoint
curl http://localhost:3001/metrics

# Query specific metric
curl 'http://localhost:9090/api/v1/query?query=llm_request_total'
```

### Tracing Testing
```bash
# Generate test traces
curl -X POST http://localhost:3001/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{"userId": "test"}'

# View traces in Jaeger
open http://localhost:16686
```

### Alerting Testing
```bash
# Trigger test alert
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{
    "labels": {"alertname": "TestAlert", "severity": "warning"},
    "annotations": {"summary": "Test alert"}
  }]'
```

### Log Aggregation Testing
```bash
# Check Loki is receiving logs
curl 'http://localhost:3100/loki/api/v1/query?query={job="gnani-backend"}'

# View logs in Grafana Explore
open http://localhost:3000/explore
```

---

## Success Metrics

After implementation, verify:

- [ ] All 8 dashboards are functional and showing data
- [ ] Traces appear in Jaeger for all critical paths
- [ ] Alerts are delivered to Slack within 30 seconds
- [ ] Logs are searchable in Loki/Grafana
- [ ] Team can diagnose a simulated issue using monitoring tools
- [ ] Monitoring runbook is complete and accurate
- [ ] All metrics have appropriate labels and documentation

---

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [OpenTelemetry Node.js](https://opentelemetry.io/docs/instrumentation/js/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Alertmanager Configuration](https://prometheus.io/docs/alerting/latest/configuration/)

---

## Notes for Implementation

1. **Start with Docker Compose** - Easier for development, migrate to K8s later
2. **Incremental Approach** - Get basic dashboards working first, then enhance
3. **Test Alerts Early** - Don't wait until production to test alerting
4. **Document Everything** - Future you will thank present you
5. **Monitor the Monitors** - Ensure monitoring infrastructure is also monitored

---

**Estimated Effort:** 5 days  
**Complexity:** Moderate  
**Risk:** Low (monitoring is additive, doesn't affect core functionality)
