# Stage 3.1: Horizontal Scaling

**Duration:** 2 weeks  
**Goal:** Enable horizontal scaling with multiple backend instances behind load balancer

---

## Context

Currently, Gnani runs a single backend instance. For production, we need to support multiple instances for:
- High availability
- Load distribution
- Zero-downtime deployments

---

## Objectives

1. Make backend stateless (move sessions to Redis)
2. Set up Nginx load balancer
3. Configure sticky sessions for gRPC
4. Add health checks
5. Test with 4 instances

---

## Implementation Tasks

### Task 1: Make Backend Stateless

**File:** `gnani-rnd-backend/src/modules/session/session.manager.ts`

Remove in-memory session storage:

```typescript
class SessionManager {
  // REMOVE: private sessions: Map<string, Session> = new Map();
  
  async createSession(userId: string): Promise<Session> {
    const session = {
      sessionId: uuidv4(),
      userId,
      createdAt: Date.now()
    };
    
    // Store in Redis instead of memory
    await redis.setex(
      `session:${session.sessionId}`,
      3600, // 1 hour TTL
      JSON.stringify(session)
    );
    
    return session;
  }
  
  async getSession(sessionId: string): Promise<Session | null> {
    const data = await redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }
}
```

---

### Task 2: Configure Nginx Load Balancer

**File:** `gnani-rnd-backend/nginx/nginx.conf`

```nginx
upstream gnani_backend {
  # Sticky sessions based on IP
  ip_hash;
  
  server localhost:3001;
  server localhost:3002;
  server localhost:3003;
  server localhost:3004;
}

upstream gnani_grpc {
  # gRPC load balancing
  server localhost:50051;
  server localhost:50052;
  server localhost:50053;
  server localhost:50054;
}

server {
  listen 80;
  server_name localhost;
  
  # HTTP API
  location /api {
    proxy_pass http://gnani_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
  
  # Health check
  location /health {
    proxy_pass http://gnani_backend;
  }
}

server {
  listen 50050 http2;
  
  # gRPC
  location / {
    grpc_pass grpc://gnani_grpc;
    grpc_set_header X-Real-IP $remote_addr;
  }
}
```

---

### Task 3: Add Health Checks

**File:** `gnani-rnd-backend/src/routes/health.routes.ts`

```typescript
import express from 'express';
import { llmManager } from '../core/llm/llm.manager.js';
import redis from '../database/redis.js';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: Date.now(),
    checks: {
      llm: false,
      redis: false,
      mongodb: false
    }
  };
  
  try {
    // Check LLM
    health.checks.llm = await llmManager.currentProvider.isAvailable();
    
    // Check Redis
    await redis.ping();
    health.checks.redis = true;
    
    // Check MongoDB
    health.checks.mongodb = mongoose.connection.readyState === 1;
    
    // Overall status
    const allHealthy = Object.values(health.checks).every(v => v);
    health.status = allHealthy ? 'healthy' : 'degraded';
    
    res.status(allHealthy ? 200 : 503).json(health);
  } catch (error) {
    health.status = 'unhealthy';
    res.status(503).json(health);
  }
});

export default router;
```

---

### Task 4: Multi-Instance Startup Script

**File:** `gnani-rnd-backend/scripts/start-multi-instance.sh`

```bash
#!/bin/bash

echo "Starting multiple backend instances..."

# Start 4 instances on different ports
PORT=3001 GRPC_PORT=50051 npm run dev &
PORT=3002 GRPC_PORT=50052 npm run dev &
PORT=3003 GRPC_PORT=50053 npm run dev &
PORT=3004 GRPC_PORT=50054 npm run dev &

# Start Nginx
nginx -c $(pwd)/nginx/nginx.conf

echo "✅ 4 backend instances started"
echo "Load balancer running on:"
echo "  HTTP: http://localhost:80"
echo "  gRPC: localhost:50050"
```

---

## Setup Scripts

**File:** `gnani-rnd-backend/scripts/setup-horizontal-scaling.sh`

```bash
#!/bin/bash

echo "Setting up Horizontal Scaling..."

# Install Nginx
if ! command -v nginx &> /dev/null; then
  echo "Installing Nginx..."
  sudo apt-get install -y nginx  # Ubuntu/Debian
  # Or: brew install nginx  # macOS
fi

# Create Nginx config directory
mkdir -p nginx

# Test configuration
nginx -t -c $(pwd)/nginx/nginx.conf

echo "✅ Horizontal scaling setup complete!"
```

---

## Verification Steps

1. **Run setup:**
   ```bash
   ./scripts/setup-horizontal-scaling.sh
   ```

2. **Start multi-instance:**
   ```bash
   ./scripts/start-multi-instance.sh
   ```

3. **Test load balancing:**
   ```bash
   # Make multiple requests
   for i in {1..10}; do
     curl http://localhost/health
   done
   
   # Check which instances handled requests
   ```

4. **Test failover:**
   ```bash
   # Kill one instance
   # Verify requests still work
   ```

---

## Success Criteria

- [ ] Backend is stateless
- [ ] Nginx configured
- [ ] 4 instances running
- [ ] Load balancing working
- [ ] Health checks passing
- [ ] Sticky sessions for gRPC
- [ ] Failover tested

---

## Next Stage

Proceed to [Stage 3.2 - Memory Management & Cleanup](./stage-3.2-memory-cleanup.md)
