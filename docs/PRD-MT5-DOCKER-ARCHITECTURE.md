# Product Requirements Document (PRD)
# MT5 Integration Service - Multi-Account Docker Architecture

**Version:** 2.0  
**Date:** November 13, 2025  
**Status:** Architecture Design  
**Author:** Technical Architecture Team

---

## Executive Summary

Design and implement a **highly scalable, fault-tolerant MetaTrader 5 integration service** using Docker containerization to support **200-300 concurrent users** with real-time WebSocket data streaming and REST API access. The architecture leverages **Docker Swarm** orchestration and the **gmag11/metatrader5_vnc** image to run isolated MT5 instances on a **64GB dedicated Linux server**.

---

## 1. Business Objectives

### 1.1 Primary Goals
- **Scalability:** Support 200-300 concurrent users with sub-second response times
- **Real-Time Data:** WebSocket streaming for 50+ accounts with < 500ms latency
- **High Availability:** 99.9% uptime with automatic failover
- **Cost Efficiency:** Utilize existing 64GB dedicated server (zero additional infrastructure cost)
- **Security:** Isolated MT5 environments, encrypted credentials, secure API access

### 1.2 Success Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time | < 200ms (p95) | Prometheus monitoring |
| WebSocket Latency | < 500ms | Real-time polling cycle |
| Concurrent WebSocket Connections | 50 accounts | Active connections gauge |
| API Request Throughput | 100+ req/sec | Request counter |
| System Uptime | 99.9% | Grafana dashboard |
| Container Recovery Time | < 30 seconds | Docker health checks |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Edge Functions                   │
│              (Authentication & Authorization)                │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS + API Key
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  Nginx Load Balancer (1GB RAM)              │
│        - SSL Termination                                     │
│        - Sticky WebSocket Routing (by account_id)           │
│        - Round-robin API Load Balancing                     │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌───────────────┐  ┌──────────────────┐
│ WebSocket Pool│  │   API Pool       │
│ 10 Containers │  │  20 Containers   │
│ (5GB RAM)     │  │  (20GB RAM)      │
└───────┬───────┘  └────────┬─────────┘
        │                   │
        └─────────┬─────────┘
                  ▼
        ┌─────────────────────┐
        │  Infrastructure     │
        ├─────────────────────┤
        │ Redis Cluster (4GB) │
        │ PostgreSQL (8GB)    │
        │ Prometheus (2GB)    │
        │ Grafana (2GB)       │
        └─────────────────────┘

Total RAM Allocation: 52GB / 64GB available (using v2.x with Python)
Reserved for System: 12GB
```

### 2.2 Container Architecture

#### WebSocket Pool (10 Containers)
```yaml
Image: gmag11/metatrader5_vnc:2.1  # Version 2.x includes Python environment
Resources:
  - Memory: 1GB per container (larger due to Python)
  - CPU: 0.5 cores per container
  - Total: 10GB RAM, 5 CPU cores

Configuration:
  - 5 accounts per container (50 accounts total)
  - Poll interval: 500ms (real-time)
  - VNC port: 3000 (for debugging)
  - RPyC port: 8001 (Python MT5 access)
  - Python 3.10+ with MetaTrader5 library

Environment:
  - INSTANCE_TYPE=websocket
  - POLL_INTERVAL=0.5
  - REDIS_URL=redis://redis:6379
  - DB_URL=postgresql://postgres:5432/mt5_metadata
```

#### API Pool (20 Containers)
```yaml
Image: gmag11/metatrader5_vnc:2.1  # Version 2.x includes Python environment
Resources:
  - Memory: 1.5GB per container (larger due to Python)
  - CPU: 0.5 cores per container
  - Total: 30GB RAM, 10 CPU cores

Configuration:
  - 20 session pool per container (400 total capacity)
  - On-demand account switching
  - VNC port: 3000 (for debugging)
  - RPyC port: 8001 (Python MT5 access)
  - Python 3.10+ with MetaTrader5 library

Environment:
  - INSTANCE_TYPE=api
  - MT5_CONNECTION_POOL_SIZE=20
  - REDIS_URL=redis://redis:6379
  - DB_URL=postgresql://postgres:5432/mt5_metadata
```

---

## 3. Technical Implementation

### 3.1 Docker Stack Configuration

**File:** `docker-stack.yml`

```yaml
version: '3.8'

services:
  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    deploy:
      replicas: 1
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - frontend
    configs:
      - source: nginx_config
        target: /etc/nginx/nginx.conf

  # Redis for routing/caching
  redis:
    image: redis:7-alpine
    deploy:
      replicas: 1
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G
    command: redis-server --maxmemory 3gb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - backend
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # PostgreSQL for account metadata
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mt5_metadata
      POSTGRES_USER: mt5_user
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    deploy:
      replicas: 1
      resources:
        limits:
          memory: 8G
        reservations:
          memory: 4G
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - backend
    secrets:
      - db_password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mt5_user"]
      interval: 10s
      timeout: 5s
      retries: 3

  # WebSocket Pool (10 replicas)
  websocket-service:
    image: gmag11/metatrader5_vnc:2.1  # Version 2.x with Python support
    environment:
      - INSTANCE_TYPE=websocket
      - POLL_INTERVAL=0.5
      - REDIS_URL=redis://redis:6379
      - DB_URL=postgresql://mt5_user@postgres:5432/mt5_metadata
      - CUSTOM_USER=admin
      - PASSWORD_FILE=/run/secrets/vnc_password
    deploy:
      replicas: 10
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
      update_config:
        parallelism: 2
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
      placement:
        max_replicas_per_node: 5
    networks:
      - frontend
      - backend
    secrets:
      - vnc_password
      - db_password
    volumes:
      - websocket-config:/config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # API Pool (20 replicas)
  api-service:
    image: gmag11/metatrader5_vnc:2.1  # Version 2.x with Python support
    environment:
      - INSTANCE_TYPE=api
      - MT5_CONNECTION_POOL_SIZE=20
      - REDIS_URL=redis://redis:6379
      - DB_URL=postgresql://mt5_user@postgres:5432/mt5_metadata
      - CUSTOM_USER=admin
      - PASSWORD_FILE=/run/secrets/vnc_password
    deploy:
      replicas: 20
      resources:
        limits:
          memory: 1.5G
          cpus: '0.5'
        reservations:
          memory: 768M
          cpus: '0.25'
      update_config:
        parallelism: 5
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
      placement:
        max_replicas_per_node: 10
    networks:
      - frontend
      - backend
    secrets:
      - vnc_password
      - db_password
    volumes:
      - api-config:/config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # Prometheus Monitoring
  prometheus:
    image: prom/prometheus:latest
    deploy:
      replicas: 1
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    networks:
      - backend
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'

  # Grafana Dashboards
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    deploy:
      replicas: 1
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
    environment:
      - GF_SECURITY_ADMIN_PASSWORD_FILE=/run/secrets/grafana_password
      - GF_INSTALL_PLUGINS=redis-datasource
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana-dashboards:/etc/grafana/provisioning/dashboards:ro
    networks:
      - backend
    secrets:
      - grafana_password

volumes:
  redis-data:
    driver: local
  postgres-data:
    driver: local
  prometheus-data:
    driver: local
  grafana-data:
    driver: local
  websocket-config:
    driver: local
  api-config:
    driver: local

networks:
  frontend:
    driver: overlay
    attachable: true
  backend:
    driver: overlay
    attachable: true

secrets:
  db_password:
    external: true
  vnc_password:
    external: true
  grafana_password:
    external: true

configs:
  nginx_config:
    file: ./nginx.conf
```

### 3.2 Nginx Configuration

**File:** `nginx.conf`

```nginx
events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Connection pooling
    upstream websocket_pool {
        least_conn;
        hash $arg_account_id consistent;  # Sticky routing by account
        
        # Docker Swarm service discovery
        server websocket-service:8000 max_fails=3 fail_timeout=30s;
    }

    upstream api_pool {
        least_conn;
        
        # Docker Swarm service discovery
        server api-service:8000 max_fails=3 fail_timeout=30s;
    }

    # Performance tuning
    keepalive_timeout 65;
    keepalive_requests 1000;
    tcp_nopush on;
    tcp_nodelay on;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types application/json text/plain text/css application/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;

        # WebSocket endpoint (sticky routing)
        location /ws/ {
            limit_req zone=api_limit burst=20 nodelay;
            limit_conn conn_limit 10;

            proxy_pass http://websocket_pool;
            proxy_http_version 1.1;
            
            # WebSocket upgrade
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            
            # Keep WebSocket alive
            proxy_read_timeout 7d;
            proxy_send_timeout 7d;
            proxy_connect_timeout 10s;
            
            # Headers
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Disable buffering
            proxy_buffering off;
        }

        # API endpoints (load balanced)
        location /api/ {
            limit_req zone=api_limit burst=50 nodelay;
            limit_conn conn_limit 20;

            proxy_pass http://api_pool;
            proxy_http_version 1.1;
            
            # Timeouts
            proxy_connect_timeout 5s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
            
            # Connection pooling
            proxy_set_header Connection "";
            
            # Headers
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Buffering
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }

        # Metrics endpoint (internal only)
        location /metrics {
            allow 172.16.0.0/12;  # Docker network
            deny all;
            proxy_pass http://api_pool;
        }
    }
}
```

### 3.3 Database Schema

**File:** `init.sql`

```sql
-- PostgreSQL schema for MT5 account management

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Accounts table
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    login INTEGER NOT NULL UNIQUE,
    server VARCHAR(100) NOT NULL,
    encrypted_password TEXT NOT NULL,
    encryption_key_id VARCHAR(50) NOT NULL,
    websocket_enabled BOOLEAN DEFAULT FALSE,
    api_enabled BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    last_poll TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- WebSocket subscriptions
CREATE TABLE websocket_subscriptions (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    instance_id VARCHAR(100),
    connected_at TIMESTAMP DEFAULT NOW(),
    last_heartbeat TIMESTAMP DEFAULT NOW(),
    disconnected_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Instance registry
CREATE TABLE instance_registry (
    id SERIAL PRIMARY KEY,
    instance_id VARCHAR(100) UNIQUE NOT NULL,
    instance_type VARCHAR(20) NOT NULL CHECK (instance_type IN ('websocket', 'api', 'hybrid')),
    hostname VARCHAR(255),
    ip_address INET,
    assigned_accounts INTEGER[],
    cpu_usage FLOAT,
    memory_usage FLOAT,
    active_connections INTEGER DEFAULT 0,
    health_status VARCHAR(20) DEFAULT 'healthy',
    last_heartbeat TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP DEFAULT NOW()
);

-- API request logs (for monitoring)
CREATE TABLE api_request_logs (
    id BIGSERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id),
    user_id UUID,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    instance_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create partitions for last 7 days
CREATE TABLE api_request_logs_default PARTITION OF api_request_logs DEFAULT;

-- Indexes
CREATE INDEX idx_accounts_websocket ON accounts(websocket_enabled) WHERE websocket_enabled = TRUE;
CREATE INDEX idx_accounts_active ON accounts(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ws_subscriptions_active ON websocket_subscriptions(account_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ws_subscriptions_instance ON websocket_subscriptions(instance_id);
CREATE INDEX idx_instance_registry_type ON instance_registry(instance_type);
CREATE INDEX idx_instance_registry_health ON instance_registry(health_status);
CREATE INDEX idx_api_logs_created ON api_request_logs(created_at DESC);
CREATE INDEX idx_api_logs_account ON api_request_logs(account_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get available instance for account
CREATE OR REPLACE FUNCTION get_instance_for_account(
    p_account_id INTEGER,
    p_instance_type VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
    v_instance_id VARCHAR;
BEGIN
    -- Try to get existing instance assignment
    SELECT instance_id INTO v_instance_id
    FROM instance_registry
    WHERE p_account_id = ANY(assigned_accounts)
      AND instance_type = p_instance_type
      AND health_status = 'healthy'
      AND last_heartbeat > NOW() - INTERVAL '5 minutes'
    LIMIT 1;
    
    -- If no assignment, find least loaded instance
    IF v_instance_id IS NULL THEN
        SELECT instance_id INTO v_instance_id
        FROM instance_registry
        WHERE instance_type = p_instance_type
          AND health_status = 'healthy'
          AND last_heartbeat > NOW() - INTERVAL '5 minutes'
        ORDER BY active_connections ASC, memory_usage ASC
        LIMIT 1;
    END IF;
    
    RETURN v_instance_id;
END;
$$ LANGUAGE plpgsql;

-- View for monitoring dashboard
CREATE OR REPLACE VIEW monitoring_dashboard AS
SELECT 
    i.instance_type,
    COUNT(i.instance_id) as instance_count,
    SUM(i.active_connections) as total_connections,
    AVG(i.cpu_usage) as avg_cpu_usage,
    AVG(i.memory_usage) as avg_memory_usage,
    COUNT(CASE WHEN i.health_status = 'healthy' THEN 1 END) as healthy_instances,
    COUNT(a.id) as active_accounts
FROM instance_registry i
LEFT JOIN accounts a ON a.is_active = TRUE
WHERE i.last_heartbeat > NOW() - INTERVAL '5 minutes'
GROUP BY i.instance_type;
```

### 3.4 Python Service Implementation

**Key changes to leverage gmag11/metatrader5_vnc:**

```python
# app/core/mt5_connector.py

"""
MT5 Connector for gmag11/metatrader5_vnc:2.1 containers.

Version 2.x includes Python 3.10+ with MetaTrader5 library pre-installed.
Uses RPyC protocol (port 8001) to communicate with Wine-based MT5 terminal.

Key difference from v1.0:
- Python environment built-in (no custom Dockerfile needed)
- mt5linux library already installed
- Can run Python scripts directly inside container
- RPyC server auto-starts on container launch
"""

from mt5linux import MetaTrader5
import os
import logging

logger = logging.getLogger(__name__)

class MT5Connector:
    """
    Wrapper for mt5linux library to connect to MT5 running in Docker container.
    Uses RPyC protocol to communicate with Wine-based MT5 terminal.
    
    Note: gmag11/metatrader5_vnc:2.1 includes Python environment, so we can
    either run Python code inside container OR connect remotely via RPyC.
    This class uses remote RPyC connection for flexibility.
    """
    
    def __init__(self):
        self.host = os.getenv("MT5_HOST", "localhost")
        self.port = int(os.getenv("MT5_PORT", "8001"))
        self.mt5: MetaTrader5 = None
        self._initialized = False
    
    async def initialize(self) -> bool:
        """Initialize connection to MT5 container."""
        try:
            self.mt5 = MetaTrader5(host=self.host, port=self.port)
            result = self.mt5.initialize()
            
            if result:
                version = self.mt5.version()
                logger.info(f"MT5 initialized: version {version}")
                self._initialized = True
                return True
            else:
                error = self.mt5.last_error()
                logger.error(f"MT5 initialization failed: {error}")
                return False
                
        except Exception as e:
            logger.error(f"Error initializing MT5: {e}")
            return False
    
    async def login(self, login: int, password: str, server: str) -> bool:
        """Login to trading account."""
        if not self._initialized:
            await self.initialize()
        
        try:
            result = self.mt5.login(login=login, password=password, server=server)
            if result:
                logger.info(f"Logged in to account {login}")
                return True
            else:
                error = self.mt5.last_error()
                logger.error(f"Login failed for {login}: {error}")
                return False
                
        except Exception as e:
            logger.error(f"Error logging in: {e}")
            return False
    
    async def get_account_info(self) -> dict:
        """Get account information."""
        try:
            info = self.mt5.account_info()
            if info is None:
                return {}
            
            return {
                "login": info.login,
                "balance": info.balance,
                "equity": info.equity,
                "margin": info.margin,
                "margin_free": info.margin_free,
                "margin_level": info.margin_level,
                "profit": info.profit,
                "currency": info.currency,
                "leverage": info.leverage,
            }
        except Exception as e:
            logger.error(f"Error getting account info: {e}")
            return {}
    
    async def get_positions(self) -> list:
        """Get open positions."""
        try:
            positions = self.mt5.positions_get()
            if positions is None:
                return []
            
            return [
                {
                    "ticket": pos.ticket,
                    "time": pos.time,
                    "symbol": pos.symbol,
                    "type": pos.type,
                    "volume": pos.volume,
                    "price_open": pos.price_open,
                    "price_current": pos.price_current,
                    "profit": pos.profit,
                    "swap": pos.swap,
                    "comment": pos.comment,
                }
                for pos in positions
            ]
        except Exception as e:
            logger.error(f"Error getting positions: {e}")
            return []
    
    async def shutdown(self):
        """Shutdown MT5 connection."""
        if self.mt5:
            self.mt5.shutdown()
            self._initialized = False
            logger.info("MT5 connection closed")
```

---

## 4. Dynamic Container Management & Data Flow

### 4.1 On-Demand Container Scaling Strategy

**Problem:** Running 30 containers (10 WS + 20 API) 24/7 wastes resources when load is low.

**Solution:** Dynamic scaling based on actual demand.

```yaml
# Minimum configuration (always running)
Nginx: 1 replica (always on)
Redis: 1 replica (always on)
PostgreSQL: 1 replica (always on)
WebSocket containers: 2 replicas (minimum)
API containers: 3 replicas (minimum)

# Total minimum: 7 containers using ~8GB RAM
```

**Scaling Rules:**
```python
# Auto-scaling logic (runs every 30 seconds)

# Scale UP WebSocket containers
if active_websocket_accounts > (current_ws_containers * 4):
    scale_up(websocket_service, by=2)

# Scale DOWN WebSocket containers  
if active_websocket_accounts < (current_ws_containers * 2):
    scale_down(websocket_service, by=1, min=2)

# Scale UP API containers
if avg_api_response_time > 300ms OR api_pool_utilization > 80%:
    scale_up(api_service, by=3)

# Scale DOWN API containers
if avg_api_response_time < 100ms AND api_pool_utilization < 30%:
    scale_down(api_service, by=2, min=3)
```

### 4.2 Frontend ↔ Supabase ↔ Docker Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                            │
│  - Zustand state management                                  │
│  - WebSocket client                                          │
│  - Never talks to Docker directly                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTPS (authenticated requests)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Edge Functions                         │
│                                                               │
│  1. User Authentication (RLS + JWT)                          │
│  2. Account Management                                       │
│  3. Request Routing to Docker Swarm                         │
│  4. Data Aggregation from containers                        │
│  5. Real-time subscriptions (Supabase Realtime)            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Internal HTTP + API Key
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  Nginx (Docker Swarm)                        │
│  - Routes to appropriate container pool                      │
│  - Sticky WebSocket routing                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│ WS Container │   │ API Container│
│ (Dynamic)    │   │ (Dynamic)    │
└──────┬───────┘   └──────┬───────┘
       │                  │
       └────────┬─────────┘
                ▼
        ┌──────────────┐
        │  PostgreSQL  │
        │  (Metadata)  │
        └──────────────┘
```

### 4.3 Supabase Edge Function: Container Orchestrator

**File:** `supabase/functions/mt5-orchestrator/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MT5_SERVICE_URL = Deno.env.get("MT5_SERVICE_URL")!; // Nginx endpoint
const MT5_API_KEY = Deno.env.get("MT5_SERVICE_API_KEY")!;
const DOCKER_SWARM_API = Deno.env.get("DOCKER_SWARM_API")!; // http://host:2376

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Authenticate user
  const authHeader = req.headers.get("Authorization")!;
  const { data: { user }, error } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  
  if (error || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { action, accountId, data } = await req.json();

  switch (action) {
    case "connect_account":
      return await connectAccount(user.id, accountId, data);
    
    case "get_positions":
      return await getPositions(user.id, accountId);
    
    case "subscribe_websocket":
      return await subscribeWebSocket(user.id, accountId);
    
    case "scale_containers":
      return await scaleContainers(data.service, data.replicas);
    
    default:
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
      });
  }
});

/**
 * Connect MT5 account - triggers container allocation
 */
async function connectAccount(userId: string, accountId: string, credentials: any) {
  // 1. Check current container capacity
  const capacity = await checkContainerCapacity();
  
  // 2. Scale up if needed
  if (capacity.api_pool_utilization > 80) {
    await scaleContainers("api-service", capacity.current_replicas + 3);
  }
  
  // 3. Call MT5 service to login
  const response = await fetch(`${MT5_SERVICE_URL}/api/mt5/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": MT5_API_KEY,
    },
    body: JSON.stringify({
      user_id: userId,
      account_id: accountId,
      login: credentials.login,
      password: credentials.password,
      server: credentials.server,
    }),
  });

  const result = await response.json();
  
  // 4. Store session info in Supabase
  if (result.success) {
    await supabase.from("mt5_sessions").insert({
      user_id: userId,
      account_id: accountId,
      container_instance: result.instance_id,
      connected_at: new Date().toISOString(),
    });
  }

  return new Response(JSON.stringify(result), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Get positions from MT5 container
 */
async function getPositions(userId: string, accountId: string) {
  // 1. Lookup which container has this account
  const session = await supabase
    .from("mt5_sessions")
    .select("container_instance")
    .eq("user_id", userId)
    .eq("account_id", accountId)
    .single();

  // 2. Call specific container (Nginx routes automatically)
  const response = await fetch(`${MT5_SERVICE_URL}/api/mt5/positions`, {
    method: "GET",
    headers: {
      "X-API-Key": MT5_API_KEY,
      "X-Account-ID": accountId,
      "X-User-ID": userId,
    },
  });

  const positions = await response.json();

  // 3. Cache in Supabase for offline access
  await supabase.from("mt5_positions_cache").upsert({
    user_id: userId,
    account_id: accountId,
    positions: positions,
    cached_at: new Date().toISOString(),
  });

  return new Response(JSON.stringify(positions), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Subscribe to WebSocket updates
 */
async function subscribeWebSocket(userId: string, accountId: string) {
  // 1. Check if account already has WebSocket container
  const existing = await supabase
    .from("websocket_subscriptions")
    .select("instance_id")
    .eq("account_id", accountId)
    .eq("is_active", true)
    .single();

  if (!existing.data) {
    // 2. Check WebSocket container capacity
    const capacity = await checkContainerCapacity();
    
    // 3. Scale up if needed
    if (capacity.ws_accounts >= capacity.ws_max_accounts) {
      await scaleContainers("websocket-service", capacity.ws_replicas + 2);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for scale up
    }

    // 4. Assign account to WebSocket container
    const assignResponse = await fetch(`${MT5_SERVICE_URL}/api/ws/assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": MT5_API_KEY,
      },
      body: JSON.stringify({
        account_id: accountId,
        user_id: userId,
      }),
    });

    const assignment = await assignResponse.json();

    // 5. Store subscription in Supabase
    await supabase.from("websocket_subscriptions").insert({
      account_id: accountId,
      user_id: userId,
      instance_id: assignment.instance_id,
    });
  }

  // 6. Return WebSocket URL for frontend
  return new Response(JSON.stringify({
    websocket_url: `wss://your-domain.com/ws/account/${accountId}`,
    instance_id: existing?.data?.instance_id,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Scale Docker Swarm services dynamically
 */
async function scaleContainers(service: string, replicas: number) {
  const response = await fetch(
    `${DOCKER_SWARM_API}/services/${service}/scale`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ replicas }),
    }
  );

  return response.json();
}

/**
 * Check current container capacity
 */
async function checkContainerCapacity() {
  const response = await fetch(`${MT5_SERVICE_URL}/api/metrics/capacity`, {
    headers: { "X-API-Key": MT5_API_KEY },
  });

  return await response.json();
  // Returns:
  // {
  //   api_pool_utilization: 75,  // percentage
  //   current_replicas: 5,
  //   ws_accounts: 18,
  //   ws_max_accounts: 25,
  //   ws_replicas: 5
  // }
}
```

### 4.4 Frontend: WebSocket Connection Manager

**File:** `src/hooks/useWebSocket.ts`

```typescript
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';

export function useWebSocket(accountId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnect();
    };
  }, [accountId]);

  const connectWebSocket = async () => {
    try {
      // 1. Call Supabase Edge Function to get WebSocket URL
      const { data: wsInfo, error } = await supabase.functions.invoke(
        'mt5-orchestrator',
        {
          body: {
            action: 'subscribe_websocket',
            accountId,
          },
        }
      );

      if (error) throw error;

      // 2. Connect to WebSocket (routed through Nginx to correct container)
      const ws = new WebSocket(wsInfo.websocket_url);

      ws.onopen = () => {
        console.log(`WebSocket connected for account ${accountId}`);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        // 3. Update local state
        setData(message);

        // 4. Update Zustand store
        useStore.getState().updateAccountData(accountId, message);

        // 5. Optionally sync to Supabase for persistence
        if (message.type === 'position_update') {
          supabase.from('mt5_positions_cache').upsert({
            account_id: accountId,
            positions: message.data.positions,
            cached_at: new Date().toISOString(),
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket closed, reconnecting...');
        setIsConnected(false);
        
        // Reconnect after 5 seconds
        reconnectTimeout.current = setTimeout(connectWebSocket, 5000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      // Retry after 10 seconds
      reconnectTimeout.current = setTimeout(connectWebSocket, 10000);
    }
  };

  const disconnect = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  return { isConnected, data, disconnect };
}
```

### 4.5 Data Aggregation: Multiple Containers → Supabase

**Background Worker in Docker (runs inside API containers):**

```python
# app/workers/supabase_sync.py

"""
Background worker that syncs MT5 data to Supabase.
Runs in each API container, syncs only its assigned accounts.
"""

import asyncio
import os
from datetime import datetime, timezone
from supabase import create_client, Client

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

async def sync_account_data(account_id: str, data: dict):
    """Sync account data to Supabase."""
    try:
        # Upsert account info
        supabase.table("mt5_accounts_data").upsert({
            "account_id": account_id,
            "balance": data["balance"],
            "equity": data["equity"],
            "margin": data["margin"],
            "profit": data["profit"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "source_container": os.getenv("HOSTNAME"),  # Track which container
        }).execute()

        # Insert positions (append-only log)
        if data.get("positions"):
            positions_records = [
                {
                    "account_id": account_id,
                    "ticket": pos["ticket"],
                    "symbol": pos["symbol"],
                    "type": pos["type"],
                    "volume": pos["volume"],
                    "profit": pos["profit"],
                    "captured_at": datetime.now(timezone.utc).isoformat(),
                    "source_container": os.getenv("HOSTNAME"),
                }
                for pos in data["positions"]
            ]
            supabase.table("mt5_positions_history").insert(positions_records).execute()

    except Exception as e:
        print(f"Error syncing to Supabase: {e}")

async def sync_loop():
    """Main sync loop - runs every 10 seconds."""
    while True:
        try:
            # Get all active sessions in this container
            sessions = mt5_manager.get_active_sessions()
            
            for account_id in sessions:
                # Fetch data from MT5
                account_info = await mt5_manager.get_account_info(account_id)
                positions = await mt5_manager.get_positions(account_id)
                
                # Sync to Supabase
                await sync_account_data(account_id, {
                    **account_info,
                    "positions": positions,
                })
            
            await asyncio.sleep(10)  # Sync every 10 seconds
            
        except Exception as e:
            print(f"Error in sync loop: {e}")
            await asyncio.sleep(30)  # Back off on error
```

### 4.6 Supabase Realtime: Aggregate Data from All Containers

**Supabase Database Trigger:**

```sql
-- Trigger to broadcast updates to frontend
CREATE OR REPLACE FUNCTION notify_account_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Broadcast to Supabase Realtime channel
    PERFORM pg_notify(
        'account_updates',
        json_build_object(
            'account_id', NEW.account_id,
            'balance', NEW.balance,
            'equity', NEW.equity,
            'profit', NEW.profit,
            'source_container', NEW.source_container
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER account_data_updated
    AFTER INSERT OR UPDATE ON mt5_accounts_data
    FOR EACH ROW
    EXECUTE FUNCTION notify_account_update();
```

**Frontend: Subscribe to Realtime Updates**

```typescript
// src/hooks/useSupabaseRealtime.ts

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

export function useSupabaseRealtime(accountId: string) {
  useEffect(() => {
    // Subscribe to account updates from ALL containers
    const channel = supabase
      .channel(`account:${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mt5_accounts_data',
          filter: `account_id=eq.${accountId}`,
        },
        (payload) => {
          console.log('Account updated:', payload);
          
          // Update Zustand store
          useStore.getState().updateAccountData(accountId, payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId]);
}
```

### 4.7 Container Lifecycle Management

**Auto-scaling Service (runs on Docker host):**

```python
# auto-scaler.py

"""
Monitors container metrics and scales services automatically.
Runs as systemd service on Docker host.
"""

import docker
import time
import requests

client = docker.from_env()
PROMETHEUS_URL = "http://localhost:9090"

def get_metric(query: str) -> float:
    """Query Prometheus for metrics."""
    response = requests.get(f"{PROMETHEUS_URL}/api/v1/query", params={"query": query})
    result = response.json()["data"]["result"]
    return float(result[0]["value"][1]) if result else 0.0

def scale_service(service_name: str, replicas: int):
    """Scale Docker Swarm service."""
    service = client.services.get(service_name)
    service.update(mode=docker.types.ServiceMode('replicated', replicas=replicas))
    print(f"Scaled {service_name} to {replicas} replicas")

def check_and_scale():
    """Check metrics and scale if needed."""
    # Get current state
    ws_service = client.services.get("mt5_websocket-service")
    api_service = client.services.get("mt5_api-service")
    
    ws_replicas = ws_service.attrs["Spec"]["Mode"]["Replicated"]["Replicas"]
    api_replicas = api_service.attrs["Spec"]["Mode"]["Replicated"]["Replicas"]
    
    # Check WebSocket load
    ws_accounts = get_metric('sum(ws_active_accounts)')
    ws_capacity = ws_replicas * 5  # 5 accounts per container
    
    if ws_accounts > ws_capacity * 0.8:  # 80% threshold
        new_replicas = min(ws_replicas + 2, 10)  # Max 10
        scale_service("mt5_websocket-service", new_replicas)
    elif ws_accounts < ws_capacity * 0.3 and ws_replicas > 2:  # 30% threshold
        new_replicas = max(ws_replicas - 1, 2)  # Min 2
        scale_service("mt5_websocket-service", new_replicas)
    
    # Check API load
    api_latency = get_metric('histogram_quantile(0.95, api_request_duration_seconds)')
    
    if api_latency > 0.3:  # 300ms threshold
        new_replicas = min(api_replicas + 3, 20)  # Max 20
        scale_service("mt5_api-service", new_replicas)
    elif api_latency < 0.1 and api_replicas > 3:  # 100ms threshold
        new_replicas = max(api_replicas - 2, 3)  # Min 3
        scale_service("mt5_api-service", new_replicas)

if __name__ == "__main__":
    print("Auto-scaler started...")
    while True:
        try:
            check_and_scale()
        except Exception as e:
            print(f"Error: {e}")
        
        time.sleep(30)  # Check every 30 seconds
```

### 4.8 Summary: Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Data Flow                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User Request (Frontend)                                  │
│     → Supabase Edge Function                                 │
│     → Check capacity, scale if needed                        │
│     → Route to Nginx → Container                             │
│                                                               │
│  2. Container Processing                                     │
│     → MT5 terminal (Wine) fetches data                      │
│     → Python service processes                               │
│     → Sync to Supabase (background worker)                  │
│                                                               │
│  3. Data Distribution                                        │
│     → PostgreSQL stores data (source_container tracked)     │
│     → Trigger fires → Supabase Realtime                     │
│     → Frontend receives update (WebSocket or Realtime)      │
│                                                               │
│  4. Auto-scaling                                             │
│     → Prometheus monitors metrics                            │
│     → Auto-scaler adjusts replicas                          │
│     → Docker Swarm rebalances load                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Key Points:**

✅ **No manual container management** - Auto-scales based on load  
✅ **Start with 5 containers** - Scale up to 30 as needed  
✅ **Data aggregation via Supabase** - All containers sync to single source  
✅ **Frontend never talks to Docker** - Goes through Supabase Edge Functions  
✅ **Track container source** - Know which container served data  
✅ **Realtime updates** - Frontend gets data via Supabase Realtime + WebSocket  

---

## 5. Deployment Process
### 4.2 Deployment Steps

```bash
# Step 1: Pull gmag11 image (no custom build needed - Python included!)
docker pull gmag11/metatrader5_vnc:2.1

# Step 2: Deploy stack
docker stack deploy -c docker-stack.yml mt5
# Initialize Docker Swarm
docker swarm init

# Create secrets
echo "your_db_password" | docker secret create db_password -
echo "your_vnc_password" | docker secret create vnc_password -
echo "your_grafana_password" | docker secret create grafana_password -
```

### 4.2 Deployment Steps

```bash
# Step 1: Build custom image (if needed)
docker build -t mt5-service:latest .

# Step 2: Deploy stack
docker stack deploy -c docker-stack.yml mt5

# Step 3: Verify deployment
docker service ls
docker service logs mt5_websocket-service
docker service logs mt5_api-service

# Step 4: Scale services (if needed)
docker service scale mt5_websocket-service=10
docker service scale mt5_api-service=20

# Step 5: Monitor health
docker service ps mt5_websocket-service
docker service ps mt5_api-service
```

### 4.3 Post-Deployment Verification

```bash
# Check container health
docker ps --filter health=healthy

# Test API endpoint
curl https://your-domain.com/api/health

# Test WebSocket connection
wscat -c wss://your-domain.com/ws/account/12345

# Check metrics
curl http://localhost:9090/metrics

# Access Grafana dashboard
# Visit http://your-domain.com:3000
```

---

## 5. Monitoring & Observability

### 5.1 Prometheus Metrics

**File:** `prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # API service metrics
  - job_name: 'api-service'
    dns_sd_configs:
      - names:
          - 'tasks.api-service'
        type: 'A'
        port: 8000
    metrics_path: '/metrics'

  # WebSocket service metrics
  - job_name: 'websocket-service'
    dns_sd_configs:
      - names:
          - 'tasks.websocket-service'
        type: 'A'
        port: 8000
    metrics_path: '/metrics'

  # Redis metrics
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  # PostgreSQL metrics
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  # Node exporter for host metrics
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

### 5.2 Key Metrics

| Category | Metric | Alert Threshold |
|----------|--------|----------------|
| **API Performance** | `api_request_duration_seconds` | p95 > 200ms |
| **WebSocket** | `ws_active_connections` | > 60 (80% capacity) |
| **MT5 Sessions** | `mt5_session_pool_size` | > 18 (90% capacity) |
| **Container Health** | `container_health_status` | < 1 (unhealthy) |
| **Redis** | `redis_memory_usage_bytes` | > 3.5GB (90%) |
| **Database** | `postgres_connections` | > 90 (90% max) |
| **Network** | `nginx_active_connections` | > 3500 (90% limit) |

---

## 6. Security Considerations

### 6.1 Credential Management
- **Encryption:** AES-256-GCM for stored passwords
- **Key Rotation:** Monthly encryption key rotation
- **Access Control:** Row-level security in PostgreSQL
- **Secrets:** Docker secrets for sensitive data

### 6.2 Network Security
- **SSL/TLS:** Enforce HTTPS with TLS 1.3
- **API Key:** Required for all Supabase → MT5 Service calls
- **Rate Limiting:** 100 req/sec per IP
- **DDoS Protection:** Nginx rate limiting + connection limits

### 6.3 Container Isolation
- **User Namespaces:** Non-root container execution
- **Resource Limits:** Memory/CPU limits per container
- **Network Policies:** Isolated overlay networks
- **Read-only Filesystems:** Where applicable

---

## 7. Disaster Recovery

### 7.1 Backup Strategy
- **PostgreSQL:** Daily full backup + WAL archiving
- **Redis:** RDB snapshots every 15 minutes
- **Configuration:** Git-tracked Docker configs
- **Retention:** 30 days backup retention

### 7.2 Failover Procedures
- **Container Failure:** Automatic restart (Docker Swarm)
- **Node Failure:** N/A (single server, future: multi-node)
- **Database Failure:** Restore from latest backup
- **Network Failure:** Automatic retry with exponential backoff

---

## 8. Scaling Plan

### 8.1 Current Capacity
- **50 WebSocket accounts** (10 containers × 5 accounts)
- **400 API sessions** (20 containers × 20 sessions)
- **500+ concurrent users**

### 8.2 Scaling Triggers
| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU Usage | > 70% | Scale up containers |
| Memory Usage | > 80% | Scale up containers |
| API Latency | > 300ms (p95) | Add API containers |
| WebSocket Connections | > 45 accounts | Add WS containers |

### 8.3 Scaling Commands
```bash
# Scale WebSocket pool
docker service scale mt5_websocket-service=15

# Scale API pool
docker service scale mt5_api-service=30

# Check resource usage
docker stats
```

---

## 9. Cost Analysis

### 9.1 Infrastructure Costs
| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| Dedicated Server (64GB) | $0 | Already owned |
| Domain + SSL | $15 | Annual renewal |
| Backup Storage | $10 | S3-compatible |
| **Total** | **$25/month** | Minimal operational cost |

### 9.2 Resource Utilization
- **RAM:** 52GB / 64GB (81% utilization) - using v2.x with Python
- **CPU:** 15 cores / 32 cores (47% utilization)
- **Disk:** 40GB / 500GB (8% utilization) - larger images
- **Network:** 1Gbps dedicated

---

## 10. Success Criteria

### 10.1 Technical KPIs
✅ API response time < 200ms (p95)  
✅ WebSocket latency < 500ms  
✅ Support 50 concurrent WebSocket accounts  
✅ Support 400 API sessions  
✅ 99.9% uptime  
✅ Automatic failover < 30 seconds  

### 10.2 Business KPIs
✅ Support 200-300 concurrent users  
✅ Zero downtime deployments  
✅ < 5 minutes to scale capacity  
✅ Comprehensive monitoring dashboards  
✅ Automated alerting for incidents  

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **MT5 License Limits** | High | Verify MT5 broker allows multiple connections |
| **Docker Container Overhead** | Medium | Use Alpine images, optimize resource limits |
| **Redis Single Point of Failure** | High | Implement Redis Sentinel/Cluster in Phase 2 |
| **Database Connection Pool Exhaustion** | Medium | Implement connection pooling, monitor connections |
| **gmag11 Image Maintenance** | Medium | Pin to specific version, maintain fork if needed |

---

## 12. Future Enhancements (Phase 2)

1. **Multi-Node Deployment:** Expand to 2-3 physical servers
2. **Redis Cluster:** High availability for routing/caching
3. **PostgreSQL Replication:** Primary-replica setup
4. **Kubernetes Migration:** If > 100 containers needed
5. **Advanced Analytics:** Machine learning for trade pattern analysis
6. **Mobile SDK:** Native iOS/Android WebSocket clients

---

## 13. Appendix

### 13.1 Key Advantages of gmag11/metatrader5_vnc:2.1

✅ **Linux Compatibility:** Run MT5 on Linux using Wine  
✅ **Headless Operation:** No GUI required, VNC for debugging only  
✅ **Python 3.10+ Included:** Built-in MetaTrader5 Python library  
✅ **RPyC Python Access:** Direct Python API via port 8001  
✅ **Docker-native:** Designed for containerization  
✅ **Well-maintained:** 200+ stars, active community  
✅ **Version 2.x Features:** ~4GB image includes full Python environment  
✅ **mt5linux Library:** Pre-installed for remote MT5 access  

**Note:** Version 2.x is larger (~4GB vs 600MB v1.0) but includes Python environment, eliminating need for custom Dockerfile with Python installation.  

### 13.2 Why This Architecture Wins

1. **True Isolation:** Each container = separate MT5 terminal
2. **Parallel Processing:** 10 WebSocket containers poll simultaneously
3. **No Blocking:** WebSocket polling never blocks API requests
4. **Cost Effective:** Zero infrastructure cost (existing server)
5. **Proven Technology:** Docker Swarm + gmag11 image battle-tested
6. **Easy Scaling:** `docker service scale` command

---

## 14. Approval Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | _______________ | _______________ | ______ |
| Technical Lead | _______________ | _______________ | ______ |
| DevOps Engineer | _______________ | _______________ | ______ |
| Security Officer | _______________ | _______________ | ______ |

---

**Document Version:** 2.0  
**Last Updated:** November 13, 2025  
**Next Review:** January 13, 2026
