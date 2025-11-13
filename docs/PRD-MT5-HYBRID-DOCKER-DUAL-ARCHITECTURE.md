# Product Requirements Document (PRD)
# MT5 Integration Service - Hybrid Docker Architecture
## Dual Implementation: Linux (Primary) + Windows (Fallback)

**Version:** 3.0  
**Date:** November 13, 2025  
**Status:** Architecture Design - Dual Path Strategy  
**Author:** Technical Architecture Team

---

## Executive Summary

This PRD provides **two complete implementation paths** for a highly scalable MT5 integration service using Docker containerization:

1. **Primary Path (Linux):** gmag11/metatrader5_vnc on Linux - Cost-effective, high-density
2. **Fallback Path (Windows):** Windows Server containers - Maximum broker compatibility

**Decision Point:** Test Primary Path for 7 days. If broker blocks Wine/Linux, pivot to Fallback Path.

**Hybrid Container Model:** Each container handles ONE account with BOTH WebSocket polling AND API endpoints (no split pools).

---

## Table of Contents

1. [Business Objectives](#1-business-objectives)
2. [Architecture Decision Framework](#2-architecture-decision-framework)
3. [Primary Path: Linux Architecture](#3-primary-path-linux-architecture)
4. [Fallback Path: Windows Architecture](#4-fallback-path-windows-architecture)
5. [Hybrid Container Design](#5-hybrid-container-design)
6. [Dynamic Scaling Strategy](#6-dynamic-scaling-strategy)
7. [Implementation Roadmap](#7-implementation-roadmap)
8. [Risk Mitigation](#8-risk-mitigation)

---

## 1. Business Objectives

### 1.1 Primary Goals
- **Scalability:** Support 200-300 concurrent users with sub-second response times
- **Real-Time Data:** WebSocket streaming for 40-50 accounts with < 500ms latency
- **High Availability:** 99.9% uptime with automatic failover
- **Cost Efficiency:** Minimize infrastructure costs
- **Flexibility:** Support both Linux and Windows deployment paths
- **Security:** Isolated MT5 environments, encrypted credentials, secure API access

### 1.2 Success Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time | < 200ms (p95) | Prometheus monitoring |
| WebSocket Latency | < 500ms | Real-time polling cycle |
| Concurrent Accounts | 40-50 accounts | Active connections gauge |
| API Request Throughput | 100+ req/sec | Request counter |
| System Uptime | 99.9% | Grafana dashboard |
| Container Recovery Time | < 30 seconds | Docker health checks |
| Broker Compatibility | 100% | Zero account blocks |

---

## 2. Architecture Decision Framework

### 2.1 Decision Tree

```
┌─────────────────────────────────────────────┐
│   Start: Deploy Test Container (Week 1)    │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ Test gmag11/Linux  │
         │ with Broker        │
         │ (7 days)           │
         └────────┬───────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
   ✅ Success          ❌ Broker Blocks
   (80% chance)        (20% chance)
        │                   │
        ▼                   ▼
┌───────────────┐    ┌──────────────────┐
│ PRIMARY PATH  │    │  FALLBACK PATH   │
│ Linux Deploy  │    │  Windows Deploy  │
│ 48 containers │    │  30 containers   │
│ $0 licensing  │    │  $1000 licensing │
└───────────────┘    └──────────────────┘
```

### 2.2 Validation Checklist (Week 1)

**Before committing to either path, validate:**

```bash
# Test Script: test-broker-compatibility.sh
#!/bin/bash

echo "=== MT5 Broker Compatibility Test ==="
echo "Running for 7 days..."

# Deploy test container
docker run -d --name mt5-broker-test \
  -p 3000:3000 \
  -e MT5_LOGIN=${TEST_ACCOUNT_LOGIN} \
  -e MT5_PASSWORD=${TEST_ACCOUNT_PASSWORD} \
  -e MT5_SERVER=${BROKER_SERVER} \
  gmag11/metatrader5_vnc:2.1

# Monitor for 7 days
for day in {1..7}; do
  echo "Day $day: Checking connection..."
  
  # Check if MT5 is connected
  docker exec mt5-broker-test python3 -c "
import MetaTrader5 as mt5
mt5.initialize()
connected = mt5.terminal_info() is not None
print(f'Connected: {connected}')
mt5.shutdown()
"
  
  # Check logs for Wine-related errors
  docker logs mt5-broker-test 2>&1 | grep -i "wine\|error\|denied" || echo "No errors"
  
  sleep 86400  # Wait 24 hours
done

echo "Test complete. Review logs and broker account status."
```

**Validation Criteria:**
- ✅ MT5 connects successfully
- ✅ No "Wine detected" errors in logs
- ✅ Broker account NOT flagged/suspended
- ✅ API calls return valid data
- ✅ No connection drops over 7 days

**Decision:**
- If ALL checks pass → **Deploy Primary Path (Linux)**
- If ANY check fails → **Deploy Fallback Path (Windows)**

---

## 3. Primary Path: Linux Architecture

### 3.1 Overview

**Use When:** Broker allows Wine/Linux environments (80% of brokers)

**Advantages:**
- $0 licensing cost (free Ubuntu)
- 48 containers on 64GB server (60% higher density)
- Faster container startup (20-40s)
- Better Docker Swarm support
- Proven solution (200+ users)

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Edge Functions                   │
│              (Authentication & Authorization)                │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS + API Key
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Nginx Load Balancer (1GB RAM)                   │
│  - SSL Termination                                           │
│  - Account-based routing (Redis registry)                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │  Redis Registry     │
        │  (Account → Container│
        │   mapping)          │
        └─────────┬───────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│           Hybrid Containers (Dynamic: 5-40 replicas)        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Container1│  │Container2│  │Container3│  │   ...    │   │
│  │Account101│  │Account102│  │Account103│  │Account140│   │
│  │          │  │          │  │          │  │          │   │
│  │WS + API  │  │WS + API  │  │WS + API  │  │WS + API  │   │
│  │1.2GB RAM │  │1.2GB RAM │  │1.2GB RAM │  │1.2GB RAM │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘

Infrastructure:
├─ Redis: 4GB (routing registry)
├─ PostgreSQL: 8GB (metadata, logs)
├─ Prometheus: 2GB (metrics)
└─ Grafana: 2GB (dashboards)

Total: 48GB for containers + 16GB infrastructure = 64GB
```

### 3.2 Docker Stack Configuration (Linux)

**File:** `docker-stack-linux.yml`

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
    volumes:
      - ./nginx-linux.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - frontend
      - backend

  # Redis Registry (Account → Container mapping)
  redis:
    image: redis:7-alpine
    deploy:
      replicas: 1
      resources:
        limits:
          memory: 4G
    command: |
      redis-server 
      --maxmemory 3gb 
      --maxmemory-policy allkeys-lru
      --save 900 1
      --save 300 10
    volumes:
      - redis-data:/data
    networks:
      - backend
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s

  # PostgreSQL Metadata
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
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - backend
    secrets:
      - db_password

  # Hybrid MT5 Containers (Linux)
  hybrid-service:
    image: gmag11/metatrader5_vnc:2.1
    environment:
      - INSTANCE_TYPE=hybrid
      - ACCOUNT_ID=${ACCOUNT_ID}  # Set by orchestrator
      - REDIS_URL=redis://redis:6379
      - DB_URL=postgresql://mt5_user@postgres:5432/mt5_metadata
      - POLL_INTERVAL=0.5
      - CUSTOM_USER=admin
      - PASSWORD_FILE=/run/secrets/vnc_password
    deploy:
      replicas: 5  # Start with 5, scale to 40
      resources:
        limits:
          memory: 1.2G
          cpus: '0.5'
        reservations:
          memory: 768M
          cpus: '0.25'
      update_config:
        parallelism: 3
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      placement:
        max_replicas_per_node: 40
    networks:
      - frontend
      - backend
    secrets:
      - vnc_password
      - db_password
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    deploy:
      replicas: 1
      resources:
        limits:
          memory: 2G
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    networks:
      - backend

  # Grafana
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    deploy:
      replicas: 1
      resources:
        limits:
          memory: 2G
    environment:
      - GF_SECURITY_ADMIN_PASSWORD_FILE=/run/secrets/grafana_password
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - backend
    secrets:
      - grafana_password

volumes:
  redis-data:
  postgres-data:
  prometheus-data:
  grafana-data:

networks:
  frontend:
    driver: overlay
  backend:
    driver: overlay

secrets:
  db_password:
    external: true
  vnc_password:
    external: true
  grafana_password:
    external: true
```

### 3.3 Nginx Configuration (Linux)

**File:** `nginx-linux.conf`

```nginx
events {
    worker_connections 4096;
    use epoll;
}

http {
    # Upstream dynamically resolved via Redis
    # No need for upstream block - use dynamic routing
    
    # Redis lookup for account routing
    lua_shared_dict account_registry 10m;
    
    init_by_lua_block {
        redis = require "resty.redis"
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # WebSocket endpoint
        location /ws/ {
            # Extract account_id from URL
            set $account_id '';
            if ($request_uri ~* "/ws/account/(\d+)") {
                set $account_id $1;
            }

            # Lookup container from Redis
            set_by_lua_block $container_host {
                local redis = require "resty.redis"
                local red = redis:new()
                red:connect("redis", 6379)
                
                local account_id = ngx.var.account_id
                local container = red:get("account:" .. account_id .. ":container")
                
                if container == ngx.null then
                    return "hybrid-service:8000"  # Fallback to service discovery
                end
                
                return container
            }

            proxy_pass http://$container_host;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_read_timeout 7d;
            proxy_buffering off;
        }

        # API endpoint
        location /api/ {
            # Same Redis lookup logic
            set $account_id '';
            if ($arg_account_id) {
                set $account_id $arg_account_id;
            }

            set_by_lua_block $container_host {
                local redis = require "resty.redis"
                local red = redis:new()
                red:connect("redis", 6379)
                
                local account_id = ngx.var.account_id
                local container = red:get("account:" .. account_id .. ":container")
                
                if container == ngx.null then
                    return "hybrid-service:8000"
                end
                
                return container
            }

            proxy_pass http://$container_host;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
        }
    }
}
```

### 3.4 Resource Allocation (Linux)

| Component | Replicas | RAM per | Total RAM | Notes |
|-----------|----------|---------|-----------|-------|
| **Hybrid Containers** | 5-40 | 1.2GB | 6-48GB | 1 account per container |
| Nginx | 1 | 1GB | 1GB | Load balancer |
| Redis | 1 | 4GB | 4GB | Routing registry |
| PostgreSQL | 1 | 8GB | 8GB | Metadata |
| Prometheus | 1 | 2GB | 2GB | Metrics |
| Grafana | 1 | 2GB | 2GB | Dashboards |
| **Total** | - | - | **23-65GB** | Max 40 containers |

**Scaling Capacity:**
- **Start:** 5 containers = 23GB total (35% utilization)
- **Growth:** 20 containers = 41GB total (64% utilization)
- **Max:** 40 containers = 65GB total (exceeds 64GB - need optimization)

**Optimized Max:** 38 containers = 62GB (safe margin)

---

## 4. Fallback Path: Windows Architecture

### 4.1 Overview

**Use When:** Broker blocks Wine/Linux environments (20% of brokers)

**Advantages:**
- 100% broker compatibility (native Windows MT5)
- 20-40% faster API calls (no Wine overhead)
- Maximum stability

**Disadvantages:**
- $1,000+ licensing cost (Windows Server 2022)
- Lower density: 30 containers max on 64GB
- Larger containers (1.5-2GB vs 1.2GB)
- Slower startup (60-90s vs 20-40s)

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Edge Functions                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│         Nginx (Windows Container) - 1.5GB RAM                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │  Redis (Windows)    │
        │  4GB RAM            │
        └─────────┬───────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│       Hybrid Containers (Dynamic: 5-30 replicas)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Container1│  │Container2│  │Container3│  │   ...    │   │
│  │Account101│  │Account102│  │Account103│  │Account130│   │
│  │          │  │          │  │          │  │          │   │
│  │WS + API  │  │WS + API  │  │WS + API  │  │WS + API  │   │
│  │1.8GB RAM │  │1.8GB RAM │  │1.8GB RAM │  │1.8GB RAM │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘

Infrastructure:
├─ Redis: 4GB
├─ PostgreSQL: 8GB
├─ Prometheus: 2GB
└─ Grafana: 2GB

Total: 54GB for containers + 17.5GB infrastructure = 71.5GB
⚠️ Exceeds 64GB - Need to reduce to 28 containers max
```

### 4.2 Docker Compose Configuration (Windows)

**File:** `docker-compose-windows.yml`

```yaml
version: '3.8'

services:
  # Nginx (Windows Container)
  nginx:
    image: stefanscherer/nginx-windows:latest
    ports:
      - "80:80"
      - "443:443"
    deploy:
      resources:
        limits:
          memory: 1.5G
    volumes:
      - type: bind
        source: C:\docker\nginx
        target: C:\nginx\conf
      - type: bind
        source: C:\docker\ssl
        target: C:\nginx\ssl
    networks:
      - frontend
      - backend
    isolation: process

  # Redis (Windows Container)
  redis:
    image: redis/redis-stack-server:latest
    deploy:
      resources:
        limits:
          memory: 4G
    volumes:
      - redis-data:C:\data
    networks:
      - backend
    isolation: process

  # PostgreSQL (Windows Container)
  postgres:
    image: stellirin/postgres-windows:15
    environment:
      POSTGRES_DB: mt5_metadata
      POSTGRES_USER: mt5_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    deploy:
      resources:
        limits:
          memory: 8G
    volumes:
      - postgres-data:C:\pgsql\data
    networks:
      - backend
    isolation: process

  # Hybrid MT5 Container (Windows)
  hybrid-service:
    image: mt5-windows-hybrid:latest  # Custom image
    build:
      context: .
      dockerfile: Dockerfile.windows
    environment:
      - INSTANCE_TYPE=hybrid
      - ACCOUNT_ID=${ACCOUNT_ID}
      - REDIS_URL=redis://redis:6379
      - DB_URL=postgresql://mt5_user:${DB_PASSWORD}@postgres:5432/mt5_metadata
      - POLL_INTERVAL=0.5
    deploy:
      replicas: 5  # Start with 5, max 28
      resources:
        limits:
          memory: 1.8G
          cpus: '0.5'
        reservations:
          memory: 1.2G
    networks:
      - frontend
      - backend
    volumes:
      - type: bind
        source: C:\MT5Terminal
        target: C:\Program Files\MetaTrader 5
    isolation: process

  # Prometheus (Windows)
  prometheus:
    image: prom/prometheus:latest-windows
    deploy:
      resources:
        limits:
          memory: 2G
    volumes:
      - prometheus-data:C:\prometheus
    networks:
      - backend
    isolation: process

  # Grafana (Windows)
  grafana:
    image: grafana/grafana:latest-windows
    ports:
      - "3000:3000"
    deploy:
      resources:
        limits:
          memory: 2G
    volumes:
      - grafana-data:C:\grafana
    networks:
      - backend
    isolation: process

volumes:
  redis-data:
  postgres-data:
  prometheus-data:
  grafana-data:

networks:
  frontend:
  backend:
```

### 4.3 Windows Dockerfile

**File:** `Dockerfile.windows`

```dockerfile
# escape=`

FROM mcr.microsoft.com/windows/servercore:ltsc2022

# Install Python
RUN powershell -Command `
    Invoke-WebRequest -Uri https://www.python.org/ftp/python/3.11.0/python-3.11.0-amd64.exe -OutFile python-installer.exe; `
    Start-Process python-installer.exe -ArgumentList '/quiet InstallAllUsers=1 PrependPath=1' -Wait; `
    Remove-Item python-installer.exe

# Install MetaTrader5 Python library
RUN pip install MetaTrader5 fastapi uvicorn redis psycopg2 prometheus_client websockets

# Copy application
COPY app/ C:\app\
WORKDIR C:\app

# Copy MT5 terminal
COPY MT5Terminal/ "C:\Program Files\MetaTrader 5\"

# Expose ports
EXPOSE 8000

# Startup script
COPY start-hybrid.ps1 C:\start-hybrid.ps1

# Run
CMD ["powershell", "-File", "C:\\start-hybrid.ps1"]
```

**File:** `start-hybrid.ps1`

```powershell
# Start MT5 terminal (hidden)
$mt5Process = Start-Process `
    -FilePath "C:\Program Files\MetaTrader 5\terminal64.exe" `
    -WindowStyle Hidden `
    -PassThru

# Wait for MT5 to initialize
Start-Sleep -Seconds 10

# Start FastAPI application
python C:\app\main.py
```

### 4.4 Resource Allocation (Windows)

| Component | Replicas | RAM per | Total RAM | Notes |
|-----------|----------|---------|-----------|-------|
| **Hybrid Containers** | 5-28 | 1.8GB | 9-50.4GB | 1 account per container |
| Nginx | 1 | 1.5GB | 1.5GB | Load balancer |
| Redis | 1 | 4GB | 4GB | Routing registry |
| PostgreSQL | 1 | 8GB | 8GB | Metadata |
| Prometheus | 1 | 2GB | 2GB | Metrics |
| Grafana | 1 | 2GB | 2GB | Dashboards |
| **Total** | - | - | **28-69GB** | Max 28 containers |

**Scaling Capacity:**
- **Start:** 5 containers = 28GB total (44% utilization)
- **Growth:** 15 containers = 46GB total (72% utilization)
- **Max:** 28 containers = 69GB total ⚠️ **EXCEEDS 64GB**

**Corrected Max:** 26 containers = 64GB (100% utilization - no margin)

**Safe Max:** 24 containers = 62GB (safe operating margin)

---

## 5. Hybrid Container Design

### 5.1 Architecture Principle

**Key Concept:** 1 Container = 1 Account = Both WebSocket + API

```
┌─────────────────────────────────────────────────────────────┐
│            Hybrid Container (Account #12345)                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MT5 Terminal (Wine on Linux / Native on Windows)    │  │
│  │  - Logged in to Account #12345                       │  │
│  │  - Always connected                                  │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                      │
│          ┌───────────┴───────────┐                         │
│          │                       │                         │
│          ▼                       ▼                         │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │   WebSocket  │      │   API Layer  │                   │
│  │   Poller     │      │   (FastAPI)  │                   │
│  ├──────────────┤      ├──────────────┤                   │
│  │ - Poll 500ms │      │ GET /account │                   │
│  │ - Broadcast  │      │ GET /positions│                  │
│  │   changes    │      │ POST /order  │                   │
│  │ - Keep alive │      │ GET /history │                   │
│  └──────────────┘      └──────────────┘                   │
│          │                       │                         │
│          └───────────┬───────────┘                         │
│                      ▼                                      │
│          ┌───────────────────────┐                         │
│          │  Background Workers   │                         │
│          ├───────────────────────┤                         │
│          │ - Sync to Supabase    │                         │
│          │ - Update Redis        │                         │
│          │ - Emit metrics        │                         │
│          └───────────────────────┘                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Python Implementation

**File:** `app/hybrid_service.py`

```python
"""
Hybrid MT5 Service - WebSocket + API in single container.
Each container handles ONE account only.
"""

import os
import asyncio
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.responses import JSONResponse
import MetaTrader5 as mt5
from redis import Redis
from sqlalchemy import create_engine
from prometheus_client import Counter, Gauge, Histogram

# Configuration
ACCOUNT_ID = os.getenv("ACCOUNT_ID")  # Assigned by orchestrator
INSTANCE_ID = os.getenv("HOSTNAME")   # Container hostname
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
POLL_INTERVAL = float(os.getenv("POLL_INTERVAL", "0.5"))

# Metrics
api_requests = Counter('api_requests_total', 'Total API requests', ['endpoint', 'method'])
ws_connections = Gauge('websocket_connections', 'Active WebSocket connections')
mt5_poll_duration = Histogram('mt5_poll_duration_seconds', 'MT5 polling duration')

# Initialize
app = FastAPI()
redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
logger = logging.getLogger(__name__)

# State
current_account_data: Optional[Dict[str, Any]] = None
websocket_clients: list[WebSocket] = []
mt5_initialized = False

# ============================================================================
# MT5 Initialization
# ============================================================================

async def initialize_mt5():
    """Initialize MT5 connection."""
    global mt5_initialized
    
    if not mt5.initialize():
        logger.error("MT5 initialization failed")
        return False
    
    # Login to assigned account
    account_login = int(os.getenv("MT5_LOGIN"))
    account_password = os.getenv("MT5_PASSWORD")
    account_server = os.getenv("MT5_SERVER")
    
    if not mt5.login(account_login, password=account_password, server=account_server):
        logger.error(f"Login failed for account {account_login}")
        return False
    
    logger.info(f"MT5 initialized for account {account_login}")
    mt5_initialized = True
    
    # Register in Redis
    redis_client.setex(
        f"account:{ACCOUNT_ID}:container",
        3600,  # 1 hour TTL (refreshed by heartbeat)
        f"{INSTANCE_ID}:8000"
    )
    
    return True

# ============================================================================
# WebSocket Polling Loop
# ============================================================================

async def poll_mt5_data():
    """Background task: Poll MT5 every 500ms and broadcast changes."""
    global current_account_data
    
    while True:
        try:
            with mt5_poll_duration.time():
                # Fetch data
                account_info = mt5.account_info()
                positions = mt5.positions_get()
                
                if account_info is None:
                    logger.warning("Failed to fetch account info")
                    await asyncio.sleep(POLL_INTERVAL)
                    continue
                
                # Build data structure
                new_data = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "account": {
                        "login": account_info.login,
                        "balance": account_info.balance,
                        "equity": account_info.equity,
                        "margin": account_info.margin,
                        "margin_free": account_info.margin_free,
                        "profit": account_info.profit,
                    },
                    "positions": [
                        {
                            "ticket": pos.ticket,
                            "symbol": pos.symbol,
                            "type": pos.type,
                            "volume": pos.volume,
                            "price_open": pos.price_open,
                            "price_current": pos.price_current,
                            "profit": pos.profit,
                        }
                        for pos in (positions or [])
                    ]
                }
                
                # Detect changes
                if current_account_data is None or new_data != current_account_data:
                    current_account_data = new_data
                    
                    # Broadcast to WebSocket clients
                    await broadcast_to_websockets(new_data)
                    
                    # Sync to Supabase (background)
                    asyncio.create_task(sync_to_supabase(new_data))
            
            await asyncio.sleep(POLL_INTERVAL)
            
        except Exception as e:
            logger.error(f"Error in poll loop: {e}")
            await asyncio.sleep(5)

async def broadcast_to_websockets(data: dict):
    """Send data to all connected WebSocket clients."""
    if not websocket_clients:
        return
    
    disconnected = []
    for ws in websocket_clients:
        try:
            await ws.send_json(data)
        except:
            disconnected.append(ws)
    
    # Clean up disconnected clients
    for ws in disconnected:
        websocket_clients.remove(ws)
        ws_connections.dec()

async def sync_to_supabase(data: dict):
    """Sync data to Supabase (background task)."""
    try:
        # TODO: Implement Supabase sync
        # supabase.table("mt5_accounts_data").upsert({...}).execute()
        pass
    except Exception as e:
        logger.error(f"Supabase sync error: {e}")

# ============================================================================
# WebSocket Endpoint
# ============================================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await websocket.accept()
    websocket_clients.append(websocket)
    ws_connections.inc()
    
    logger.info(f"WebSocket connected (total: {len(websocket_clients)})")
    
    # Send current data immediately
    if current_account_data:
        await websocket.send_json(current_account_data)
    
    try:
        # Keep connection alive
        while True:
            # Wait for client messages (pings)
            await websocket.receive_text()
    except:
        pass
    finally:
        if websocket in websocket_clients:
            websocket_clients.remove(websocket)
            ws_connections.dec()
        logger.info(f"WebSocket disconnected (total: {len(websocket_clients)})")

# ============================================================================
# REST API Endpoints
# ============================================================================

@app.get("/api/account")
async def get_account():
    """Get current account info."""
    api_requests.labels(endpoint="/api/account", method="GET").inc()
    
    if not current_account_data:
        raise HTTPException(status_code=503, detail="Data not available")
    
    return JSONResponse(current_account_data["account"])

@app.get("/api/positions")
async def get_positions():
    """Get current positions."""
    api_requests.labels(endpoint="/api/positions", method="GET").inc()
    
    if not current_account_data:
        raise HTTPException(status_code=503, detail="Data not available")
    
    return JSONResponse(current_account_data["positions"])

@app.get("/api/history")
async def get_history(days: int = 30):
    """Get trade history."""
    api_requests.labels(endpoint="/api/history", method="GET").inc()
    
    from datetime import datetime, timedelta
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    deals = mt5.history_deals_get(start_date, end_date)
    
    if deals is None:
        return JSONResponse([])
    
    return JSONResponse([
        {
            "ticket": deal.ticket,
            "order": deal.order,
            "time": deal.time,
            "symbol": deal.symbol,
            "type": deal.type,
            "volume": deal.volume,
            "price": deal.price,
            "profit": deal.profit,
        }
        for deal in deals
    ])

@app.post("/api/order")
async def place_order(order: dict):
    """Place new order."""
    api_requests.labels(endpoint="/api/order", method="POST").inc()
    
    # TODO: Implement order placement
    raise HTTPException(status_code=501, detail="Not implemented")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "mt5_initialized": mt5_initialized,
        "account_id": ACCOUNT_ID,
        "instance_id": INSTANCE_ID,
        "websocket_clients": len(websocket_clients),
    }

# ============================================================================
# Startup/Shutdown
# ============================================================================

@app.on_event("startup")
async def startup():
    """Initialize on startup."""
    logger.info(f"Starting hybrid service for account {ACCOUNT_ID}")
    
    # Initialize MT5
    if not await initialize_mt5():
        raise RuntimeError("MT5 initialization failed")
    
    # Start polling loop
    asyncio.create_task(poll_mt5_data())

@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown."""
    logger.info("Shutting down...")
    
    # Close WebSocket connections
    for ws in websocket_clients:
        await ws.close()
    
    # Unregister from Redis
    redis_client.delete(f"account:{ACCOUNT_ID}:container")
    
    # Shutdown MT5
    if mt5_initialized:
        mt5.shutdown()

# ============================================================================
# Run
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 5.3 Why Hybrid is Superior

**Comparison: Hybrid vs Split Architecture**

| Aspect | Hybrid (1:1) | Split (WS + API Pools) |
|--------|--------------|------------------------|
| **Routing Complexity** | Simple (account → container) | Complex (sticky sessions, failover) |
| **Data Consistency** | Always fresh (same container) | Potential lag (cross-container sync) |
| **Latency** | Low (no network hops) | Medium (WS → API hop) |
| **Resource Utilization** | High (no idle containers) | Medium (unbalanced pools) |
| **Scaling** | Linear (1 account = 1 container) | Manual tuning required |
| **Debugging** | Easy (all data in 1 place) | Hard (data split across pools) |
| **Failover** | Simple (restart container) | Complex (WS + API coordination) |
| **Max Capacity (64GB)** | 38 accounts (Linux) / 24 (Windows) | 50 accounts (flawed assumptions) |

---

## 6. Dynamic Scaling Strategy

### 6.1 Auto-Scaling Logic

**File:** `auto-scaler.py`

```python
"""
Auto-scaler for hybrid containers.
Runs on Docker host, monitors Redis and scales services.
"""

import docker
import redis
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

docker_client = docker.from_env()
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Configuration
SERVICE_NAME_LINUX = "mt5_hybrid-service"
SERVICE_NAME_WINDOWS = "mt5_hybrid-service"
MIN_REPLICAS = 5
MAX_REPLICAS_LINUX = 38
MAX_REPLICAS_WINDOWS = 24
SCALE_UP_THRESHOLD = 0.9  # 90% utilization
SCALE_DOWN_THRESHOLD = 0.5  # 50% utilization

def get_active_accounts() -> int:
    """Get number of active accounts from Redis."""
    keys = redis_client.keys("account:*:container")
    return len(keys)

def get_current_replicas(service_name: str) -> int:
    """Get current number of service replicas."""
    try:
        service = docker_client.services.get(service_name)
        return service.attrs["Spec"]["Mode"]["Replicated"]["Replicas"]
    except:
        return MIN_REPLICAS

def scale_service(service_name: str, replicas: int):
    """Scale service to target replicas."""
    try:
        service = docker_client.services.get(service_name)
        service.update(mode=docker.types.ServiceMode('replicated', replicas=replicas))
        logger.info(f"✅ Scaled {service_name} to {replicas} replicas")
    except Exception as e:
        logger.error(f"❌ Failed to scale {service_name}: {e}")

def check_and_scale():
    """Check metrics and scale if needed."""
    # Detect which architecture we're running
    try:
        service = docker_client.services.get(SERVICE_NAME_LINUX)
        service_name = SERVICE_NAME_LINUX
        max_replicas = MAX_REPLICAS_LINUX
        logger.info("Detected: Linux architecture")
    except:
        service_name = SERVICE_NAME_WINDOWS
        max_replicas = MAX_REPLICAS_WINDOWS
        logger.info("Detected: Windows architecture")
    
    # Get current state
    active_accounts = get_active_accounts()
    current_replicas = get_current_replicas(service_name)
    utilization = active_accounts / current_replicas if current_replicas > 0 else 0
    
    logger.info(f"📊 Active accounts: {active_accounts}, Replicas: {current_replicas}, Utilization: {utilization:.1%}")
    
    # Scale UP: Need more containers
    if utilization > SCALE_UP_THRESHOLD and current_replicas < max_replicas:
        # Each account needs its own container
        needed = min(active_accounts + 2, max_replicas)  # +2 buffer
        scale_service(service_name, needed)
    
    # Scale DOWN: Too many idle containers
    elif utilization < SCALE_DOWN_THRESHOLD and current_replicas > MIN_REPLICAS:
        needed = max(active_accounts + 1, MIN_REPLICAS)  # +1 buffer, min 5
        scale_service(service_name, needed)
    
    else:
        logger.info("✔️ No scaling needed")

if __name__ == "__main__":
    logger.info("🚀 Auto-scaler started")
    
    while True:
        try:
            check_and_scale()
        except Exception as e:
            logger.error(f"❌ Error: {e}")
        
        time.sleep(30)  # Check every 30 seconds
```

### 6.2 Scaling Scenarios

**Scenario 1: Launch (5 accounts)**
```
Active accounts: 5
Current replicas: 5
Utilization: 100%
Action: No change (optimal)
```

**Scenario 2: Growth (12 accounts)**
```
Active accounts: 12
Current replicas: 5
Utilization: 240% (overload!)
Action: Scale UP to 14 replicas (+2 buffer)
```

**Scenario 3: Peak (35 accounts on Linux)**
```
Active accounts: 35
Current replicas: 30
Utilization: 117% (slight overload)
Action: Scale UP to 37 replicas (near max)
```

**Scenario 4: Off-hours (8 accounts)**
```
Active accounts: 8
Current replicas: 20
Utilization: 40% (underutilized)
Action: Scale DOWN to 9 replicas (8 + 1 buffer)
```

---

## 7. Implementation Roadmap

### Phase 0: Decision Week (Week 1)

**Goal:** Validate broker compatibility

```bash
# Day 1: Deploy test container
docker run -d --name mt5-broker-test \
  -p 3000:3000 \
  -e MT5_LOGIN=your_test_account \
  -e MT5_PASSWORD=your_password \
  -e MT5_SERVER=your_broker \
  gmag11/metatrader5_vnc:2.1

# Days 1-7: Monitor
- Check MT5 connection status daily
- Review VNC (http://localhost:3000) for issues
- Monitor broker for account flags
- Test API calls (account_info, positions)

# Day 7: Decision
if broker_allows_wine:
    proceed_with_linux_path()
else:
    proceed_with_windows_path()
```

### Phase 1A: Linux Deployment (Week 2-3)

**Prerequisites:**
- ✅ Broker allows Wine/Linux
- ✅ Ubuntu 22.04 server with Docker installed
- ✅ 64GB RAM available
- ✅ Domain name configured

**Steps:**

```bash
# Week 2: Infrastructure Setup
cd /opt/mt5-service

# 1. Create secrets
echo "your_db_password" | docker secret create db_password -
echo "your_vnc_password" | docker secret create vnc_password -
echo "your_grafana_password" | docker secret create grafana_password -

# 2. Initialize Docker Swarm
docker swarm init

# 3. Deploy infrastructure
docker stack deploy -c docker-stack-linux.yml mt5

# 4. Verify
docker service ls
docker service logs mt5_hybrid-service

# Week 3: Production Deployment
# 5. Add accounts (via Supabase Edge Function)
curl -X POST https://your-api.com/add-account \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"login": 12345, "password": "xxx", "server": "broker"}'

# 6. Monitor scaling
watch -n 5 'docker service ls'

# 7. Verify WebSocket
wscat -c wss://your-domain.com/ws/account/12345
```

### Phase 1B: Windows Deployment (Week 2-4)

**Prerequisites:**
- ✅ Windows Server 2022 (64GB RAM)
- ✅ Docker Desktop for Windows installed
- ✅ Windows Server license activated
- ✅ MT5 terminal installed

**Steps:**

```powershell
# Week 2: Infrastructure Setup
cd C:\docker\mt5-service

# 1. Build custom Windows image
docker build -f Dockerfile.windows -t mt5-windows-hybrid:latest .

# 2. Create compose file with environment variables
# Edit docker-compose-windows.yml with actual passwords

# 3. Deploy stack
docker-compose -f docker-compose-windows.yml up -d

# 4. Verify
docker ps
docker logs mt5_hybrid-service_1

# Week 3-4: Production Deployment
# 5. Add accounts
Invoke-RestMethod -Uri "https://your-api.com/add-account" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $TOKEN"} `
  -Body (@{login=12345; password="xxx"; server="broker"} | ConvertTo-Json)

# 6. Monitor
docker stats

# 7. Scale if needed
docker-compose -f docker-compose-windows.yml up -d --scale hybrid-service=10
```

### Phase 2: Monitoring & Optimization (Week 4-5)

**Both Paths:**

```bash
# 1. Configure Grafana dashboards
# Access: http://your-server:3000
# Import dashboard: grafana-dashboard-mt5.json

# 2. Set up alerts
# - Container health alerts
# - High memory usage alerts
# - API latency alerts

# 3. Enable auto-scaler
# Copy auto-scaler.py to /opt/mt5-autoscaler/
sudo systemctl enable mt5-autoscaler
sudo systemctl start mt5-autoscaler

# 4. Verify auto-scaling
sudo journalctl -u mt5-autoscaler -f
```

### Phase 3: Production Hardening (Week 6+)

- **Security:** Enable Supabase RLS, rotate secrets
- **Backup:** Configure PostgreSQL WAL archiving
- **Monitoring:** Add PagerDuty/Slack alerts
- **Documentation:** Create runbook for ops team
- **Load Testing:** Simulate 40 concurrent accounts

---

## 8. Risk Mitigation

### 8.1 Risk Matrix

| Risk | Probability | Impact | Mitigation | Fallback |
|------|-------------|--------|------------|----------|
| **Broker blocks Wine** | 20% | High | Test for 7 days first | Switch to Windows path |
| **Exceeds 64GB RAM** | 30% | Medium | Limit max containers (38 Linux / 24 Windows) | Add second server |
| **Container startup delay** | 50% | Low | Pre-warm containers, maintain 2 extra | Use Redis queue |
| **Redis failure** | 10% | High | Redis Sentinel in Phase 2 | Fallback to service discovery |
| **Windows licensing** | 5% | Medium | Purchase license upfront | Use trial for testing |
| **MT5 API rate limits** | 40% | Medium | Implement caching, respect broker limits | Reduce poll frequency |
| **Docker Swarm complexity** | 30% | Low | Provide detailed docs | Consider Kubernetes if >100 containers |

### 8.2 Contingency Plans

**If Linux Path Fails:**
1. Document failure reason (broker message, account flag)
2. Backup all configuration
3. Pivot to Windows path within 48 hours
4. Budget $1,000 for Windows Server license
5. Accept lower density (24 vs 38 accounts)

**If RAM Exceeds 64GB:**
1. Reduce max containers (Linux: 38 → 35, Windows: 24 → 22)
2. Optimize container memory (reduce Python overhead)
3. Consider second server ($50-100/month)
4. Implement account prioritization (VIP accounts first)

**If Performance Degrades:**
1. Scale down to 80% capacity
2. Increase poll interval (500ms → 1000ms)
3. Implement data caching (Redis)
4. Analyze slow queries (Prometheus)

---

## 9. Cost Comparison

### 9.1 Total Cost of Ownership (3 Years)

**Linux Path:**
| Item | Cost |
|------|------|
| Server (64GB, owned) | $0 |
| Ubuntu license | $0 |
| Domain + SSL | $15/month × 36 = $540 |
| Backup storage (S3) | $10/month × 36 = $360 |
| **Total 3-year** | **$900** |
| **Per month** | **$25** |

**Windows Path:**
| Item | Cost |
|------|------|
| Server (64GB, owned) | $0 |
| Windows Server 2022 Standard | $1,069 (one-time) |
| CALs (50 users) | $1,950 (one-time) |
| Domain + SSL | $15/month × 36 = $540 |
| Backup storage | $10/month × 36 = $360 |
| **Total 3-year** | **$3,919** |
| **Per month equivalent** | **$109** |

**Savings with Linux:** $3,019 over 3 years (77% reduction)

### 9.2 Break-Even Analysis

If broker blocks Linux and you must use Windows:
- Extra cost: $3,019
- Per account cost: $3,019 ÷ 24 accounts = $126/account over 3 years
- Monthly per account: $3.50/month

**Decision:** Linux is worth testing for 7 days to save $3,000+

---

## 10. Success Criteria

### 10.1 Technical KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time | < 200ms (p95) | Prometheus |
| WebSocket Latency | < 500ms | Polling cycle |
| Container Startup | < 60s (Linux) / < 90s (Windows) | Docker logs |
| Memory Utilization | < 90% | Docker stats |
| CPU Utilization | < 70% | Docker stats |
| Uptime | 99.9% | Grafana |
| Auto-Scale Time | < 60s | Auto-scaler logs |

### 10.2 Business KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Concurrent Accounts | 40 (Linux) / 24 (Windows) | Redis registry |
| Concurrent Users | 200-300 | Supabase analytics |
| Zero-Downtime Deploys | 100% | Deployment logs |
| Broker Compatibility | 100% | Account status |
| Cost per Account | < $5/month | Cost analysis |

### 10.3 Acceptance Criteria

**Linux Path:**
- ✅ Broker allows Wine/Linux for 30+ days
- ✅ 38 containers running stably
- ✅ Auto-scaling works (5 → 38 → 5)
- ✅ WebSocket latency < 500ms
- ✅ API response time < 200ms
- ✅ No broker account flags

**Windows Path:**
- ✅ Windows Server licensed and activated
- ✅ 24 containers running stably
- ✅ Native MT5 performance validated
- ✅ All technical KPIs met
- ✅ Backup/restore tested

---

## 11. Appendix

### 11.1 Command Reference

**Linux Deployment:**
```bash
# Deploy
docker stack deploy -c docker-stack-linux.yml mt5

# Scale
docker service scale mt5_hybrid-service=20

# Logs
docker service logs -f mt5_hybrid-service

# Stats
docker stats $(docker ps -q -f name=mt5_hybrid)

# Remove
docker stack rm mt5
```

**Windows Deployment:**
```powershell
# Deploy
docker-compose -f docker-compose-windows.yml up -d

# Scale
docker-compose -f docker-compose-windows.yml up -d --scale hybrid-service=15

# Logs
docker-compose -f docker-compose-windows.yml logs -f hybrid-service

# Stats
docker stats

# Remove
docker-compose -f docker-compose-windows.yml down
```

### 11.2 Troubleshooting

**Linux Issues:**
```bash
# Container won't start
docker service ps mt5_hybrid-service --no-trunc
docker service logs mt5_hybrid-service | grep ERROR

# Wine errors
docker exec -it $(docker ps -q -f name=mt5_hybrid) bash
wine --version
cat /var/log/wine.log

# MT5 connection issues
docker exec -it $(docker ps -q -f name=mt5_hybrid) python3 -c "
import MetaTrader5 as mt5
mt5.initialize()
print(mt5.terminal_info())
mt5.shutdown()
"
```

**Windows Issues:**
```powershell
# Container won't start
docker logs mt5_hybrid-service_1

# MT5 terminal issues
docker exec -it mt5_hybrid-service_1 powershell
Get-Process | Where-Object {$_.Name -like '*terminal*'}
Test-Path "C:\Program Files\MetaTrader 5\terminal64.exe"

# Python issues
docker exec -it mt5_hybrid-service_1 powershell
python --version
pip list | Select-String MetaTrader5
```

### 11.3 Performance Tuning

**Linux Optimizations:**
```yaml
# Add to docker-stack-linux.yml
deploy:
  resources:
    limits:
      memory: 1.2G
      cpus: '0.5'
    reservations:
      memory: 768M
      cpus: '0.25'
  # Use process isolation for better performance
  placement:
    constraints:
      - node.role == worker
```

**Windows Optimizations:**
```yaml
# Add to docker-compose-windows.yml
isolation: process  # Faster than Hyper-V
restart: unless-stopped
healthcheck:
  interval: 30s
  timeout: 10s
  retries: 3
```

---

## 12. Approval & Sign-off

### 12.1 Architecture Decision

**Primary Path (Linux):** ☐ Approved  
**Fallback Path (Windows):** ☐ Approved  
**Dual-Path Strategy:** ☐ Approved  

### 12.2 Budget Approval

**Linux Path ($900 / 3 years):** ☐ Approved  
**Windows Path ($3,919 / 3 years):** ☐ Approved  
**Contingency Budget ($1,000):** ☐ Approved  

### 12.3 Timeline Approval

**Week 1 - Testing:** ☐ Approved  
**Week 2-3 - Deployment:** ☐ Approved  
**Week 4-5 - Optimization:** ☐ Approved  
**Week 6+ - Production:** ☐ Approved  

### 12.4 Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | _______________ | _______________ | ______ |
| Technical Lead | _______________ | _______________ | ______ |
| DevOps Engineer | _______________ | _______________ | ______ |
| Finance | _______________ | _______________ | ______ |
| Security | _______________ | _______________ | ______ |

---

**Document Version:** 3.0 (Dual Architecture)  
**Last Updated:** November 13, 2025  
**Next Review:** December 13, 2025  
**Status:** Ready for Implementation
