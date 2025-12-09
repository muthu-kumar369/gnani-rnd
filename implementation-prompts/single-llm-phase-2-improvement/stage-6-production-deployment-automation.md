# Stage 6: Production Deployment Automation

**Priority:** P0/P2 (Mixed - some critical, some nice-to-have)  
**Duration:** 8 days  
**Dependencies:** Stages 1-2 (monitoring and security must be in place)  
**Current Completion:** 40%

---

## Context & Background

### Current State Analysis

**✅ What Exists:**
- Docker setup for services
- Docker Compose configuration
- Basic deployment guide
- Environment variable configuration

**❌ What's Missing:**
- **Kubernetes manifests** (P2)
- **CI/CD pipeline** (P2)
- **Health check probes** (P0)
- **Deployment automation scripts** (P1)
- **Rollback procedures** (P0)
- **Blue-green deployment** (P2)
- **Production deployment documentation** (P0)

### Why This Matters

Without deployment automation:
- **Manual deployments** are error-prone
- **Downtime** during updates
- **Difficult rollbacks** when issues occur
- **No deployment history** or audit trail
- **Inconsistent environments** (dev vs prod)

---

## Objectives

### Primary Goals

1. **Kubernetes Deployment** - Production-ready K8s manifests
2. **CI/CD Pipeline** - Automated testing and deployment
3. **Health Checks** - Proper readiness and liveness probes
4. **Deployment Automation** - One-command deployments
5. **Rollback Strategy** - Quick recovery from bad deployments

### Success Criteria

- [ ] Kubernetes manifests complete and tested
- [ ] CI/CD pipeline deploying automatically
- [ ] Health checks preventing bad deployments
- [ ] Zero-downtime deployments working
- [ ] Rollback completing in <5 minutes
- [ ] Deployment documentation complete
- [ ] All secrets managed securely

---

## Technical Requirements

### 1. Kubernetes Manifests (Days 1-3)

#### Directory Structure

```
k8s/
├── base/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   └── services/
│       ├── backend-deployment.yaml
│       ├── backend-service.yaml
│       ├── mongodb-statefulset.yaml
│       ├── mongodb-service.yaml
│       ├── redis-deployment.yaml
│       ├── redis-service.yaml
│       ├── ollama-deployment.yaml
│       ├── ollama-service.yaml
│       ├── chromadb-deployment.yaml
│       └── chromadb-service.yaml
├── overlays/
│   ├── development/
│   │   └── kustomization.yaml
│   ├── staging/
│   │   └── kustomization.yaml
│   └── production/
│       └── kustomization.yaml
└── monitoring/
    ├── prometheus.yaml
    ├── grafana.yaml
    └── jaeger.yaml
```

#### Backend Deployment

Create `k8s/base/services/backend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gnani-backend
  labels:
    app: gnani-backend
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Zero-downtime deployments
  selector:
    matchLabels:
      app: gnani-backend
  template:
    metadata:
      labels:
        app: gnani-backend
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3001"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: backend
        image: gnani/backend:latest
        imagePullPolicy: Always
        ports:
        - name: http
          containerPort: 3001
          protocol: TCP
        - name: grpc
          containerPort: 50051
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: gnani-secrets
              key: mongodb-uri
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: gnani-secrets
              key: redis-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: gnani-secrets
              key: jwt-secret
        - name: OLLAMA_BASE_URL
          value: "http://ollama:11434"
        - name: CHROMADB_URL
          value: "http://chromadb:8000"
        
        # Resource limits
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        
        # Health checks
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        
        # Graceful shutdown
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]
      
      # Graceful termination
      terminationGracePeriodSeconds: 30
      
      # Pod anti-affinity (spread across nodes)
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - gnani-backend
              topologyKey: kubernetes.io/hostname
```

#### Backend Service

Create `k8s/base/services/backend-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: gnani-backend
  labels:
    app: gnani-backend
spec:
  type: ClusterIP
  ports:
  - name: http
    port: 3001
    targetPort: 3001
    protocol: TCP
  - name: grpc
    port: 50051
    targetPort: 50051
    protocol: TCP
  selector:
    app: gnani-backend
---
apiVersion: v1
kind: Service
metadata:
  name: gnani-backend-headless
  labels:
    app: gnani-backend
spec:
  type: ClusterIP
  clusterIP: None
  ports:
  - name: http
    port: 3001
    targetPort: 3001
  - name: grpc
    port: 50051
    targetPort: 50051
  selector:
    app: gnani-backend
```

#### MongoDB StatefulSet

Create `k8s/base/services/mongodb-statefulset.yaml`:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongodb
spec:
  serviceName: mongodb
  replicas: 1  # Single instance for development, 3 for production
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:7.0
        ports:
        - containerPort: 27017
          name: mongodb
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          valueFrom:
            secretKeyRef:
              name: mongodb-secrets
              key: username
        - name: MONGO_INITDB_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mongodb-secrets
              key: password
        volumeMounts:
        - name: mongodb-data
          mountPath: /data/db
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
  volumeClaimTemplates:
  - metadata:
      name: mongodb-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 50Gi
```

#### Ingress

Create `k8s/base/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: gnani-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.gnani.ai
    secretName: gnani-tls
  rules:
  - host: api.gnani.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: gnani-backend
            port:
              number: 3001
```

---

### 2. Health Check Endpoints (Day 4)

Create `src/routes/health.routes.ts`:

```typescript
import { Router } from 'express';
import { HealthController } from '@/controllers/health.controller';

const router = Router();
const healthController = new HealthController();

// Liveness probe - is the app running?
router.get('/health/live', healthController.liveness);

// Readiness probe - is the app ready to serve traffic?
router.get('/health/ready', healthController.readiness);

// Startup probe - has the app finished starting?
router.get('/health/startup', healthController.startup);

export default router;
```

Create `src/controllers/health.controller.ts`:

```typescript
import { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import { RedisService } from '@/core/cache/redis.service';
import { Logger } from '@/core/logger/logger';

export class HealthController {
  private readonly logger = new Logger('HealthController');
  private isReady = false;
  private startupComplete = false;

  constructor(
    private readonly mongoClient: MongoClient,
    private readonly redis: RedisService
  ) {}

  /**
   * Liveness probe - basic health check
   * Returns 200 if app is running, 500 if not
   */
  async liveness(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Readiness probe - check if app can serve traffic
   * Returns 200 if ready, 503 if not
   */
  async readiness(req: Request, res: Response): Promise<void> {
    const checks = await Promise.all([
      this.checkMongoDB(),
      this.checkRedis(),
      this.checkOllama(),
    ]);

    const allHealthy = checks.every(check => check.healthy);

    if (allHealthy) {
      this.isReady = true;
      res.status(200).json({
        status: 'ready',
        checks: checks.map(c => ({ name: c.name, status: 'healthy' })),
        timestamp: new Date().toISOString(),
      });
    } else {
      this.isReady = false;
      res.status(503).json({
        status: 'not ready',
        checks: checks.map(c => ({
          name: c.name,
          status: c.healthy ? 'healthy' : 'unhealthy',
          error: c.error,
        })),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Startup probe - check if app has finished starting
   */
  async startup(req: Request, res: Response): Promise<void> {
    if (this.startupComplete) {
      res.status(200).json({
        status: 'started',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'starting',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Mark startup as complete
   */
  markStartupComplete(): void {
    this.startupComplete = true;
    this.logger.info('Startup complete');
  }

  /**
   * Check MongoDB connection
   */
  private async checkMongoDB(): Promise<{ name: string; healthy: boolean; error?: string }> {
    try {
      await this.mongoClient.db().admin().ping();
      return { name: 'mongodb', healthy: true };
    } catch (error) {
      this.logger.error('MongoDB health check failed', error);
      return { name: 'mongodb', healthy: false, error: error.message };
    }
  }

  /**
   * Check Redis connection
   */
  private async checkRedis(): Promise<{ name: string; healthy: boolean; error?: string }> {
    try {
      await this.redis.ping();
      return { name: 'redis', healthy: true };
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return { name: 'redis', healthy: false, error: error.message };
    }
  }

  /**
   * Check Ollama connection
   */
  private async checkOllama(): Promise<{ name: string; healthy: boolean; error?: string }> {
    try {
      const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/tags`);
      if (response.ok) {
        return { name: 'ollama', healthy: true };
      } else {
        return { name: 'ollama', healthy: false, error: `Status ${response.status}` };
      }
    } catch (error) {
      this.logger.error('Ollama health check failed', error);
      return { name: 'ollama', healthy: false, error: error.message };
    }
  }
}
```

---

### 3. CI/CD Pipeline (Days 5-6)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'latest'
      
      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > kubeconfig
          export KUBECONFIG=kubeconfig
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/gnani-backend \
            backend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }} \
            -n production
      
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/gnani-backend -n production --timeout=5m
      
      - name: Verify deployment
        run: |
          kubectl get pods -n production -l app=gnani-backend
          kubectl get deployment gnani-backend -n production

  notify:
    needs: [test, build, deploy]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to production: ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

### 4. Deployment Scripts (Day 7)

Create `scripts/deploy.sh`:

```bash
#!/bin/bash

set -e

# Configuration
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}

echo "Deploying Gnani to ${ENVIRONMENT} (version: ${VERSION})"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
  echo "Error: Invalid environment. Must be development, staging, or production."
  exit 1
fi

# Build Docker image
echo "Building Docker image..."
docker build -t gnani/backend:${VERSION} .

# Tag image
docker tag gnani/backend:${VERSION} gnani/backend:latest

# Push to registry
echo "Pushing to registry..."
docker push gnani/backend:${VERSION}
docker push gnani/backend:latest

# Deploy to Kubernetes
echo "Deploying to Kubernetes..."
kubectl apply -k k8s/overlays/${ENVIRONMENT}

# Update deployment image
kubectl set image deployment/gnani-backend \
  backend=gnani/backend:${VERSION} \
  -n ${ENVIRONMENT}

# Wait for rollout
echo "Waiting for rollout to complete..."
kubectl rollout status deployment/gnani-backend -n ${ENVIRONMENT} --timeout=10m

# Verify deployment
echo "Verifying deployment..."
kubectl get pods -n ${ENVIRONMENT} -l app=gnani-backend

echo "Deployment complete!"
```

Create `scripts/rollback.sh`:

```bash
#!/bin/bash

set -e

ENVIRONMENT=${1:-production}

echo "Rolling back Gnani in ${ENVIRONMENT}..."

# Rollback deployment
kubectl rollout undo deployment/gnani-backend -n ${ENVIRONMENT}

# Wait for rollback
kubectl rollout status deployment/gnani-backend -n ${ENVIRONMENT} --timeout=5m

# Verify rollback
kubectl get pods -n ${ENVIRONMENT} -l app=gnani-backend

echo "Rollback complete!"
```

---

### 5. Deployment Documentation (Day 8)

Create `docs/deployment/README.md`:

```markdown
# Gnani Deployment Guide

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- Docker registry access
- Secrets configured in Vault

## Quick Start

### Deploy to Development

```bash
./scripts/deploy.sh development
```

### Deploy to Production

```bash
./scripts/deploy.sh production v1.2.3
```

### Rollback

```bash
./scripts/rollback.sh production
```

## Manual Deployment

### 1. Build and Push Image

```bash
docker build -t gnani/backend:v1.2.3 .
docker push gnani/backend:v1.2.3
```

### 2. Apply Kubernetes Manifests

```bash
kubectl apply -k k8s/overlays/production
```

### 3. Update Deployment

```bash
kubectl set image deployment/gnani-backend \
  backend=gnani/backend:v1.2.3 \
  -n production
```

### 4. Monitor Rollout

```bash
kubectl rollout status deployment/gnani-backend -n production
```

## Health Checks

- Liveness: `GET /health/live`
- Readiness: `GET /health/ready`
- Startup: `GET /health/startup`

## Troubleshooting

### Pods not starting

```bash
kubectl describe pod <pod-name> -n production
kubectl logs <pod-name> -n production
```

### Deployment stuck

```bash
kubectl rollout status deployment/gnani-backend -n production
kubectl get events -n production
```

### Rollback

```bash
kubectl rollout undo deployment/gnani-backend -n production
```

## Monitoring

- Grafana: https://grafana.gnani.ai
- Prometheus: https://prometheus.gnani.ai
- Jaeger: https://jaeger.gnani.ai
```

---

## Implementation Checklist

### Days 1-3: Kubernetes Manifests
- [ ] Create namespace and configmaps
- [ ] Create backend deployment
- [ ] Create MongoDB StatefulSet
- [ ] Create Redis deployment
- [ ] Create Ollama deployment
- [ ] Create services and ingress
- [ ] Test in development cluster

### Day 4: Health Checks
- [ ] Implement liveness probe endpoint
- [ ] Implement readiness probe endpoint
- [ ] Implement startup probe endpoint
- [ ] Test health checks
- [ ] Document health check behavior

### Days 5-6: CI/CD Pipeline
- [ ] Create GitHub Actions workflow
- [ ] Configure Docker registry
- [ ] Set up Kubernetes credentials
- [ ] Test automated deployment
- [ ] Add Slack notifications

### Day 7: Deployment Scripts
- [ ] Create deploy.sh script
- [ ] Create rollback.sh script
- [ ] Test deployment automation
- [ ] Test rollback procedure
- [ ] Document scripts

### Day 8: Documentation
- [ ] Write deployment guide
- [ ] Document troubleshooting steps
- [ ] Create runbooks
- [ ] Document rollback procedures
- [ ] Final testing

---

## Success Metrics

- [ ] Kubernetes manifests working
- [ ] CI/CD pipeline deploying automatically
- [ ] Health checks preventing bad deployments
- [ ] Zero-downtime deployments
- [ ] Rollback completing in <5 minutes
- [ ] Documentation complete
- [ ] Secrets managed securely

---

**Estimated Effort:** 8 days  
**Complexity:** Moderate-High  
**Risk:** Medium (deployment changes can cause downtime)
