# MT5 Integration Cost Analysis for TNM AI
**Scale:** 200-300 Users  
**Date:** November 12, 2025  
**Prepared by:** BMad Master

---

## Current Architecture

**Frontend:** React + Vite + TypeScript (Vercel hosted)  
**Backend:** Supabase (Edge Functions + PostgreSQL)  
**MT5 Integration:** DISABLED (was MetaAPI)

---

## Option 1: MetaAPI (Previous Solution) ❌

### Architecture
```
User → TNM Frontend → Supabase Edge Functions → MetaAPI Cloud → MT5 Broker
```

### Costs (200-300 users)
- **MetaAPI Subscription:** 
  - Growth Plan: $399/month (100 accounts)
  - Scale Plan: $799/month (300 accounts)
  - **Total: ~$800/month minimum**

### Pros
✅ Fully managed  
✅ No server maintenance  
✅ Multi-broker support out of box

### Cons
❌ **Very expensive** at scale  
❌ API rate limits  
❌ External dependency  
❌ No control over infrastructure  
❌ Data privacy concerns (third party)

**VERDICT: Too expensive for 200-300 users**

---

## Option 2: Self-Hosted Python MT5 Service (RECOMMENDED) ✅

### Architecture
```
User → TNM Frontend (Vercel)
       ↓
Supabase Edge Functions (Free tier sufficient)
       ↓
Windows VPS (Your MT5 Python Service)
       ↓
MT5 Terminal → Broker Servers
```

### Implementation Stack
**Windows VPS:**
- Windows Server 2022 Core (lightweight)
- Python 3.11 + FastAPI
- MetaTrader5 Python package
- MT5 Terminal (headless mode)
- Nginx reverse proxy
- Docker (optional, for service management)

**Service Architecture:**
```python
FastAPI Service
├─ /api/mt5/connect          # Login to account
├─ /api/mt5/accounts         # List connected accounts  
├─ /api/mt5/account/{id}/info
├─ /api/mt5/account/{id}/positions
├─ /api/mt5/account/{id}/history
├─ /api/mt5/account/{id}/sync
└─ /ws/account/{id}          # WebSocket for real-time
```

### Monthly Costs Breakdown

#### A) Single Windows VPS (Recommended for 200-300 users)

**Provider: Contabo Windows VPS**
- CPU: 6 vCores
- RAM: 16 GB
- Storage: 400 GB SSD
- **Cost: €14.99/month (~$16/month)**

**OR Provider: Hetzner**
- CPX31 Windows
- CPU: 4 vCores
- RAM: 8 GB
- **Cost: €25/month (~$27/month)**

**Capacity:** Can handle 500+ accounts easily with:
- Account switching via mt5.login()
- Connection pooling
- Efficient memory management
- Redis cache for frequently accessed data

#### B) Supabase Costs

**For 200-300 active users:**
- **Free Tier (up to 50K MAUs):** $0/month
- Database storage: ~2-5GB for trading data
- Edge Functions: Within free limits (500K invocations/month)
- **Estimated: $0-25/month**

#### C) Additional Services

**Redis Cache (Optional but recommended):**
- Upstash Redis Free tier: $0/month
- OR Railway Redis: $5/month

**Monitoring:**
- UptimeRobot: Free
- Sentry: Free tier

**SSL/Domain:**
- Cloudflare: Free
- Let's Encrypt: Free

### Total Monthly Cost: **$16-32/month** 🎉

**Cost per user:** $0.05-0.11/month

---

## Option 3: Multi-Region Setup (Future Scale 500+)

If you reach 500+ users, split by region:

**Setup:**
- US Windows VPS: $16/month (150 users)
- EU Windows VPS: $16/month (150 users)  
- Asia Windows VPS: $16/month (150 users)

**Total:** $48/month for 450 users  
**Cost per user:** $0.11/month

---

## Option 4: Hybrid Cloud (Not Recommended)

**AWS/Azure Windows EC2/VM:**
- t3.medium Windows: ~$40-50/month
- Network egress costs: $10-20/month
- **Total: $60-70/month**

**Why NOT recommended:**
- 3-4x more expensive than Contabo/Hetzner
- Same capabilities
- Only advantage: Better SLA (not critical for this use case)

---

## Resource Requirements Analysis

### Per User Resource Usage

**Active Trading Session:**
- MT5 connection: ~5-10 MB RAM
- Data caching: ~2-5 MB RAM
- API overhead: ~1-2 MB RAM
- **Total: ~10-15 MB per active user**

**For 300 concurrent users:**
- RAM needed: ~4.5 GB
- With overhead: ~6-8 GB
- **16 GB VPS is MORE than sufficient**

### Data Storage

**Per user (yearly):**
- Trades: ~100 trades/year × 1KB = 100 KB
- Account info snapshots: ~365 days × 0.5KB = 182 KB
- **Total: ~300 KB/user/year**

**For 300 users:**
- 300 × 300 KB = 90 MB/year
- With indexes and relations: ~200-300 MB/year
- **Supabase free tier (500 MB) sufficient for 2-3 years**

---

## Implementation Phases

### Phase 1: Core MT5 Service (Week 1)
**Tasks:**
1. Set up Windows VPS (Contabo/Hetzner)
2. Install MT5 Terminal
3. Create Python FastAPI service
4. Implement core endpoints:
   - `/connect` - Login to MT5 account
   - `/account/info` - Get balance, equity, margin
   - `/positions` - Get open trades
   - `/history` - Get closed trades

**Deliverable:** Working MT5 API service

### Phase 2: Supabase Integration (Week 2)
**Tasks:**
1. Update `connect-mt5-account` edge function
2. Modify `sync-trading-data` edge function
3. Implement authentication/authorization
4. Add encryption for credentials
5. Test end-to-end flow

**Deliverable:** Backend integration complete

### Phase 3: Frontend Updates (Week 3)
**Tasks:**
1. Re-enable `AccountLinkForm.tsx`
2. Update `auth.ts` store
3. Re-enable sync hooks
4. Add real-time WebSocket connection
5. Update UI notifications

**Deliverable:** Fully working TNM AI with MT5

### Phase 4: Optimization (Week 4)
**Tasks:**
1. Add Redis caching
2. Implement connection pooling
3. Add monitoring/alerts
4. Load testing (simulate 300 users)
5. Security hardening

**Deliverable:** Production-ready system

---

## Technical Implementation Details

### Python Service Structure

```
mt5-service/
├─ app/
│  ├─ main.py              # FastAPI app
│  ├─ mt5_manager.py       # MT5 connection management
│  ├─ models.py            # Pydantic models
│  ├─ routes/
│  │  ├─ accounts.py       # Account endpoints
│  │  ├─ trades.py         # Trading data endpoints
│  │  └─ websocket.py      # Real-time updates
│  ├─ services/
│  │  ├─ auth.py           # API authentication
│  │  ├─ encryption.py     # Credential encryption
│  │  └─ cache.py          # Redis caching
│  └─ utils/
│     ├─ logger.py
│     └─ validators.py
├─ requirements.txt
├─ Dockerfile              # Optional
├─ .env
└─ README.md
```

### Sample Code

```python
# app/mt5_manager.py
import MetaTrader5 as mt5
from typing import Optional
import logging

class MT5Manager:
    def __init__(self):
        self.initialized = False
        
    def connect(self, login: int, password: str, server: str) -> bool:
        """Connect to MT5 account"""
        if not mt5.initialize():
            return False
            
        authorized = mt5.login(login=login, password=password, server=server)
        if authorized:
            self.initialized = True
            logging.info(f"Connected to account {login}")
        return authorized
    
    def get_account_info(self) -> Optional[dict]:
        """Get account information"""
        if not self.initialized:
            return None
            
        info = mt5.account_info()
        if info is None:
            return None
            
        return {
            'balance': info.balance,
            'equity': info.equity,
            'margin': info.margin,
            'free_margin': info.margin_free,
            'margin_level': info.margin_level,
            'profit': info.profit,
            'currency': info.currency,
            'leverage': info.leverage
        }
    
    def get_positions(self) -> list:
        """Get open positions"""
        positions = mt5.positions_get()
        if positions is None:
            return []
            
        return [
            {
                'ticket': pos.ticket,
                'symbol': pos.symbol,
                'type': 'buy' if pos.type == 0 else 'sell',
                'volume': pos.volume,
                'open_price': pos.price_open,
                'current_price': pos.price_current,
                'sl': pos.sl,
                'tp': pos.tp,
                'profit': pos.profit,
                'open_time': pos.time
            }
            for pos in positions
        ]
```

```python
# app/main.py
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from .mt5_manager import MT5Manager
import os

app = FastAPI(title="MT5 Bridge Service")

class ConnectRequest(BaseModel):
    login: int
    password: str
    server: str
    user_id: str  # From Supabase

@app.post("/api/mt5/connect")
async def connect_account(request: ConnectRequest):
    """Connect to MT5 account"""
    manager = MT5Manager()
    
    success = manager.connect(
        login=request.login,
        password=request.password,
        server=request.server
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Connection failed")
    
    account_info = manager.get_account_info()
    
    return {
        'success': True,
        'account_info': account_info
    }

@app.get("/api/mt5/account/{account_id}/positions")
async def get_positions(account_id: str):
    """Get open positions for account"""
    # Load account credentials from cache/database
    # Connect to MT5
    # Return positions
    pass
```

### Security Measures

1. **API Authentication:**
   - JWT tokens from Supabase
   - API key for service-to-service

2. **Credential Encryption:**
   - AES-256 encryption for passwords
   - Store only encrypted credentials in database

3. **Network Security:**
   - VPS firewall (only ports 443, 22)
   - Cloudflare proxy
   - Rate limiting

4. **MT5 Security:**
   - Use investor passwords (read-only)
   - No trading operations
   - Connection timeout after inactivity

---

## Performance Optimization

### Caching Strategy

**Redis Cache:**
```
account:{account_id}:info          TTL: 30s
account:{account_id}:positions     TTL: 5s  
account:{account_id}:history       TTL: 5m
```

### Connection Pooling

- Maintain 10-20 active MT5 connections
- Rotate based on last activity
- Close inactive connections after 5 minutes

### Load Balancing (Future)

If single VPS saturates:
```
Nginx Load Balancer
├─ MT5 Service Instance 1 (VPS 1)
├─ MT5 Service Instance 2 (VPS 2)
└─ MT5 Service Instance 3 (VPS 3)
```

---

## Comparison Matrix

| Feature | MetaAPI | Self-Hosted Python | Hybrid Cloud |
|---------|---------|-------------------|--------------|
| **Cost (300 users)** | $800/month | $16-32/month | $60-70/month |
| **Setup Time** | 1 day | 2 weeks | 1 week |
| **Maintenance** | None | Low | Medium |
| **Scalability** | Excellent | Good | Excellent |
| **Control** | None | Full | Full |
| **Data Privacy** | Low | High | High |
| **Customization** | Limited | Full | Full |
| **Rate Limits** | Yes | No | No |

---

## Risk Analysis

### Self-Hosted Risks & Mitigations

**Risk 1: VPS Downtime**
- **Impact:** Users can't sync data
- **Mitigation:** 
  - Use reliable provider (Contabo/Hetzner 99.9% uptime)
  - Set up monitoring alerts
  - Graceful degradation (show last cached data)
  - Set up backup VPS (add $16/month)

**Risk 2: MT5 Terminal Crash**
- **Impact:** Service unavailable
- **Mitigation:**
  - Process monitoring (systemd/supervisord)
  - Auto-restart on crash
  - Health check endpoint

**Risk 3: Security Breach**
- **Impact:** Credentials compromised
- **Mitigation:**
  - Use investor passwords (read-only)
  - Encrypt all credentials
  - VPS hardening
  - Regular security updates

**Risk 4: Scaling Issues**
- **Impact:** Performance degradation
- **Mitigation:**
  - Start with single VPS (sufficient for 300)
  - Monitor CPU/RAM usage
  - Add second VPS if needed ($16 more)

---

## Monitoring & Alerting

### Key Metrics

1. **Service Health:**
   - API response time
   - Error rate
   - MT5 connection status

2. **Resource Usage:**
   - CPU utilization
   - RAM usage
   - Disk I/O

3. **Business Metrics:**
   - Active connections
   - Successful syncs
   - Failed login attempts

### Tools (All Free)

- **UptimeRobot:** Endpoint monitoring
- **Grafana + Prometheus:** Metrics dashboard
- **Sentry:** Error tracking
- **Custom alerting:** Email/Discord webhooks

---

## Final Recommendation

## ✅ **Option 2: Self-Hosted Python MT5 Service**

### Why?

1. **Cost Efficiency:** 25x cheaper than MetaAPI
   - $16-32/month vs $800/month
   - Saves $9,600/year

2. **Scalability:** Handles 200-300 users easily
   - Single VPS sufficient
   - Easy to add more VPS if needed

3. **Control:** Full control over infrastructure
   - Customize as needed
   - No external dependencies
   - Better data privacy

4. **Performance:** No rate limits
   - Direct MT5 connection
   - Local caching
   - Real-time updates via WebSocket

5. **Reliability:** 
   - 99.9% uptime with good provider
   - Easy to monitor and debug
   - Backup VPS for redundancy

### Implementation Timeline

- **Week 1:** Python service development
- **Week 2:** Supabase integration
- **Week 3:** Frontend updates
- **Week 4:** Testing & optimization

**Total: 4 weeks to production**

### Next Steps

1. **Immediate:** Provision Windows VPS
2. **Day 1-3:** Set up MT5 + Python environment
3. **Day 4-7:** Build FastAPI service
4. **Week 2:** Integrate with Supabase
5. **Week 3:** Update frontend
6. **Week 4:** Load test with 300 simulated users

---

## Questions for AF

1. **Timeline:** Do you need this in 4 weeks, or can we take more time?

2. **Budget:** Is $16-32/month acceptable? (vs $800 with MetaAPI)

3. **Development:** Do you want BMad Master to create PRD first, or start implementation directly?

4. **Backup:** Do you want backup VPS for redundancy? (+$16/month)

5. **Region:** Where are most users? (affects VPS location choice)

---

**Prepared by:** BMad Master  
**Mode:** bmad-master  
**For:** AF (TNM Project Owner)
