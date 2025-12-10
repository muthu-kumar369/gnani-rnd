# Stage 2.2: Monitoring & Observability

**Duration:** Week 7-8 (10 working days)  
**Priority:** 🟡 High  
**Dependencies:** Stage 2.1 (Error Handling)

---

## Overview

Implement comprehensive monitoring and observability using OpenTelemetry, Prometheus, and Grafana to track system health, performance, and identify issues before they impact users.

## Goals

1. Set up OpenTelemetry for distributed tracing
2. Create Prometheus metrics for all critical paths
3. Build Grafana dashboards for visualization
4. Implement alerting for critical issues

---

## Setup Scripts

### Task 1: Install Monitoring Stack

**File:** `gnani-rnd-backend/scripts/setup-monitoring.sh`

```bash
#!/bin/bash

echo "========================================="
echo "Setting up Monitoring Stack"
echo "========================================="

# Install dependencies
npm install --save @opentelemetry/api @opentelemetry/sdk-node
npm install --save @opentelemetry/auto-instrumentations-node
npm install --save @opentelemetry/exporter-prometheus
npm install --save @opentelemetry/exporter-jaeger

# Create monitoring directory
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana

# Create Prometheus config
cat > monitoring/prometheus/prometheus.yml <<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'gnani-backend'
    static_configs:
      - targets: ['localhost:9464']
    
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
EOF

# Create docker-compose for monitoring stack
cat > monitoring/docker-compose.yml <<EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: gnani-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    container_name: gnani-grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false

  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: gnani-jaeger
    ports:
      - "16686:16686"  # Jaeger UI
      - "14268:14268"  # Jaeger collector

volumes:
  prometheus-data:
  grafana-data:
EOF

echo "Starting monitoring stack..."
cd monitoring
docker-compose up -d

echo "========================================="
echo "Monitoring stack started!"
echo "Prometheus: http://localhost:9090"
echo "Grafana: http://localhost:3001 (admin/admin)"
echo "Jaeger: http://localhost:16686"
echo "========================================="
```

---

## OpenTelemetry Integration

### Task 2: Tracing Setup

**File:** `gnani-rnd-backend/src/core/monitoring/tracing.ts`

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const prometheusExporter = new PrometheusExporter(
  {
    port: 9464,
    endpoint: '/metrics'
  },
  () => {
    console.log('Prometheus scrape endpoint: http://localhost:9464/metrics');
  }
);

const jaegerExporter = new JaegerExporter({
  endpoint: 'http://localhost:14268/api/traces'
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'gnani-backend',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0'
  }),
  traceExporter: jaegerExporter,
  metricReader: prometheusExporter,
  instrumentations: [getNodeAutoInstrumentations()]
});

export function startTracing() {
  sdk.start();
  console.log('OpenTelemetry tracing started');
}

export function stopTracing() {
  sdk.shutdown();
}
```

### Task 3: Custom Spans for Critical Paths

**File:** `gnani-rnd-backend/src/modules/session/session.coordinator.ts`

```typescript
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('gnani-session');

export class SessionCoordinator {
  private async handleFinalTranscript(sessionId: string, transcript: string): Promise<void> {
    const span = tracer.startSpan('process-transcript', {
      attributes: {
        'session.id': sessionId,
        'transcript.length': transcript.length
      }
    });

    try {
      // Step 1: Build context
      const contextSpan = tracer.startSpan('build-context', {}, context.active());
      const ctx = await this.contextBuilder.build(sessionId, session.userId, transcript);
      contextSpan.end();

      // Step 2: Generate LLM response
      const llmSpan = tracer.startSpan('llm-generate', {}, context.active());
      const response = await this.llmExecutor.generate(ctx, session.onLlmChunkCallback);
      llmSpan.setAttribute('response.length', response.text.length);
      llmSpan.end();

      // Step 3: Execute tools
      if (response.toolCalls?.length > 0) {
        const toolSpan = tracer.startSpan('execute-tools', {}, context.active());
        toolSpan.setAttribute('tools.count', response.toolCalls.length);
        await this.toolExecutor.executeTools(sessionId, response.toolCalls, session.onToolStatusCallback);
        toolSpan.end();
      }

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error: any) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }
}
```

---

## Prometheus Metrics

### Task 4: Custom Metrics

**File:** `gnani-rnd-backend/src/core/monitoring/metrics.ts`

```typescript
import { createContextualLogger } from '../logger/logger.js';
import { Counter, Histogram, Gauge, register } from 'prom-client';

const logger = createContextualLogger({ module: 'Metrics' });

class Metrics {
  // Counters
  private requestsTotal: Counter;
  private errorsTotal: Counter;
  private sessionsTotal: Counter;

  // Histograms
  private sttLatency: Histogram;
  private llmLatency: Histogram;
  private llmTokensPerSecond: Histogram;
  private toolExecutionDuration: Histogram;

  // Gauges
  private activeSessions: Gauge;
  private audioBufferSize: Gauge;
  private memoryUsage: Gauge;

  constructor() {
    // Initialize counters
    this.requestsTotal = new Counter({
      name: 'gnani_requests_total',
      help: 'Total number of requests',
      labelNames: ['method', 'endpoint', 'status']
    });

    this.errorsTotal = new Counter({
      name: 'gnani_errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'context']
    });

    this.sessionsTotal = new Counter({
      name: 'gnani_sessions_total',
      help: 'Total number of sessions created',
      labelNames: ['status']
    });

    // Initialize histograms
    this.sttLatency = new Histogram({
      name: 'gnani_stt_latency_ms',
      help: 'STT processing latency in milliseconds',
      buckets: [50, 100, 200, 500, 1000, 2000, 5000]
    });

    this.llmLatency = new Histogram({
      name: 'gnani_llm_latency_ms',
      help: 'LLM response latency in milliseconds',
      buckets: [100, 200, 500, 1000, 2000, 5000, 10000]
    });

    this.llmTokensPerSecond = new Histogram({
      name: 'gnani_llm_tokens_per_second',
      help: 'LLM tokens generated per second',
      buckets: [10, 20, 50, 100, 200, 500]
    });

    this.toolExecutionDuration = new Histogram({
      name: 'gnani_tool_execution_duration_ms',
      help: 'Tool execution duration in milliseconds',
      labelNames: ['tool_name', 'status'],
      buckets: [100, 500, 1000, 5000, 10000, 30000]
    });

    // Initialize gauges
    this.activeSessions = new Gauge({
      name: 'gnani_active_sessions',
      help: 'Number of currently active sessions'
    });

    this.audioBufferSize = new Gauge({
      name: 'gnani_audio_buffer_size_bytes',
      help: 'Current audio buffer size in bytes',
      labelNames: ['session_id']
    });

    this.memoryUsage = new Gauge({
      name: 'gnani_memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type']
    });

    logger.info('Metrics initialized');
  }

  // Counter methods
  incrementRequests(method: string, endpoint: string, status: number) {
    this.requestsTotal.inc({ method, endpoint, status: status.toString() });
  }

  incrementErrors(type: string, context: string) {
    this.errorsTotal.inc({ type, context });
  }

  incrementSessions(status: 'started' | 'ended') {
    this.sessionsTotal.inc({ status });
  }

  // Histogram methods
  recordSTTLatency(duration: number) {
    this.sttLatency.observe(duration);
  }

  recordLLMLatency(duration: number) {
    this.llmLatency.observe(duration);
  }

  recordLLMTokensPerSecond(tokensPerSecond: number) {
    this.llmTokensPerSecond.observe(tokensPerSecond);
  }

  recordToolExecution(toolName: string, duration: number, status: 'success' | 'failure') {
    this.toolExecutionDuration.observe({ tool_name: toolName, status }, duration);
  }

  // Gauge methods
  setActiveSessions(count: number) {
    this.activeSessions.set(count);
  }

  setAudioBufferSize(sessionId: string, size: number) {
    this.audioBufferSize.set({ session_id: sessionId }, size);
  }

  updateMemoryUsage() {
    const usage = process.memoryUsage();
    this.memoryUsage.set({ type: 'rss' }, usage.rss);
    this.memoryUsage.set({ type: 'heapTotal' }, usage.heapTotal);
    this.memoryUsage.set({ type: 'heapUsed' }, usage.heapUsed);
    this.memoryUsage.set({ type: 'external' }, usage.external);
  }

  getRegistry() {
    return register;
  }
}

export default new Metrics();

// Update memory metrics every 10 seconds
setInterval(() => {
  metrics.updateMemoryUsage();
}, 10000);
```

### Task 5: Integrate Metrics into Services

**File:** `gnani-rnd-backend/src/modules/session/transcript.processor.ts`

```typescript
import metrics from '../../core/monitoring/metrics.js';

export class TranscriptProcessor {
  async processAudio(sessionId: string, audioBuffer: Buffer, sampleRate: number): Promise<string> {
    const startTime = Date.now();
    
    try {
      const transcript = await whisperService.transcribe(sessionId, audioBuffer, sampleRate);
      
      const duration = Date.now() - startTime;
      metrics.recordSTTLatency(duration);
      
      this.logger.info('Transcript generated', { sessionId, duration });
      
      return transcript;
    } catch (error: any) {
      metrics.incrementErrors('STTError', 'TranscriptProcessor');
      throw error;
    }
  }
}
```

---

## Grafana Dashboards

### Task 6: Create Dashboard JSON

**File:** `gnani-rnd-backend/monitoring/grafana/gnani-dashboard.json`

```json
{
  "dashboard": {
    "title": "GNANI System Overview",
    "panels": [
      {
        "title": "Active Sessions",
        "targets": [
          {
            "expr": "gnani_active_sessions"
          }
        ],
        "type": "graph"
      },
      {
        "title": "STT Latency (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, gnani_stt_latency_ms_bucket)"
          }
        ],
        "type": "graph"
      },
      {
        "title": "LLM Latency (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, gnani_llm_latency_ms_bucket)"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(gnani_errors_total[5m])"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Memory Usage",
        "targets": [
          {
            "expr": "gnani_memory_usage_bytes{type='heapUsed'}"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

---

## Alerting

### Task 7: Prometheus Alert Rules

**File:** `gnani-rnd-backend/monitoring/prometheus/alerts.yml`

```yaml
groups:
  - name: gnani_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(gnani_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      - alert: HighSTTLatency
        expr: histogram_quantile(0.95, gnani_stt_latency_ms_bucket) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High STT latency"
          description: "P95 STT latency is {{ $value }}ms"

      - alert: HighLLMLatency
        expr: histogram_quantile(0.95, gnani_llm_latency_ms_bucket) > 5000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High LLM latency"
          description: "P95 LLM latency is {{ $value }}ms"

      - alert: HighMemoryUsage
        expr: gnani_memory_usage_bytes{type="heapUsed"} > 1073741824
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage"
          description: "Heap usage is {{ $value }} bytes (>1GB)"
```

---

## Success Metrics

- ✅ OpenTelemetry tracing operational
- ✅ All critical paths instrumented
- ✅ Prometheus metrics exposed
- ✅ Grafana dashboards created
- ✅ Alerts configured and tested
- ✅ <1% overhead from monitoring

---

## Next Stage

**Stage 2.3: Health Checks & Graceful Shutdown**
