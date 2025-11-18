# Local Development Guide - MT5 Integration Service

**Date:** November 12, 2025  
**Purpose:** Test MT5 integration locally on Windows before VPS deployment  
**Cost:** $0 (using existing hardware)  

---

## Overview

This guide explains how to develop and test the MT5 Integration Service on a **local Windows computer** on the same network as your Mac development machine, avoiding VPS costs during development.

### Architecture (Local Development)

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  Mac (Frontend) │────────▶│ Windows Computer │────────▶│  MT5 Terminal   │
│  localhost:5173 │  HTTP   │ vms.tnm.local    │  Python │  (Broker)       │
│                 │         │  :8000           │  API    │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
         │                           ▲
         │                           │
         └──────────────────────────────────────────┐
                      Supabase Cloud                │
                (via ngrok tunnel for testing)      │
                                                     │
                   ┌──────────────────────────┐     │
                   │  ngrok                   │     │
                   │  https://abc.ngrok.io ───┼─────┘
                   │  → vms.tnm.local:8000   │
                   └──────────────────────────┘
```

---

## Prerequisites

### Hardware Requirements
- **Windows Computer:** Windows 10/11 (any PC on your local network)
- **Mac Computer:** Your development machine (same network)
- **Network:** Both machines on same Wi-Fi or Ethernet network
- **Storage:** ~5GB free space on Windows machine

### Software Requirements (Windows)
- Windows 10/11 (latest updates)
- PowerShell (built-in)
- Internet connection

### Software Requirements (Mac)
- Terminal (built-in)
- Node.js 18+ (for frontend)
- Modern browser (Chrome/Safari)

---

## Setup Steps

### Step 1: Windows Machine Network Configuration

**1.1 Find Current IP Address:**
```powershell
# On Windows - PowerShell
ipconfig

# Look for "IPv4 Address" under your active network adapter
# Example: 10.4.0.180 (will be mapped to vms.tnm.local)
```

**1.2 Set Static IP and Hostname:**
- Open: Settings → Network & Internet → Properties
- Under "IP assignment" click "Edit"
- Choose "Manual" and enable IPv4
- Set:
  - IP address: `10.4.0.180` (or any available IP in your subnet)
  - Subnet mask: `255.255.255.0`
  - Gateway: `10.4.0.1` (your router's IP)
  - DNS: `8.8.8.8` (Google DNS)
- Add hostname to hosts file: `10.4.0.180    vms.tnm.local`

**1.3 Configure Windows Firewall:**
```powershell
# Allow port 8000 (FastAPI service)
New-NetFirewallRule -DisplayName "MT5 FastAPI Local Dev" `
  -Direction Inbound `
  -LocalPort 8000 `
  -Protocol TCP `
  -Action Allow

# Verify rule created
Get-NetFirewallRule -DisplayName "MT5 FastAPI Local Dev"
```

**1.4 Test Connectivity from Mac:**
```bash
# On Mac terminal
ping vms.tnm.local

# Should see responses:
# 64 bytes from 10.4.0.180: icmp_seq=0 ttl=128 time=2.123 ms
```

---

### Step 2: Windows Software Installation

**2.1 Enable PowerShell Script Execution:**
```powershell
# On Windows - Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**2.2 Install Chocolatey (Package Manager):**
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; 
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; 
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Verify installation
choco --version
```

**2.3 Install Python 3.11:**
```powershell
choco install python311 -y

# Verify installation
python --version
# Should output: Python 3.11.x
```

**2.4 Install Git (for code management):**
```powershell
choco install git -y

# Verify
git --version
```

---

### Step 3: MT5 Terminal Installation

**3.1 Download MT5:**
- Visit: https://www.metatrader5.com/en/download
- Download MT5 for Windows
- Or direct link: https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe

**3.2 Install MT5:**
```powershell
# Run installer (downloaded file)
.\mt5setup.exe

# Install to default location: C:\Program Files\MetaTrader 5\
```

**3.3 Create Demo Account:**
- Open MT5 Terminal
- File → Open an Account → MetaQuotes-Demo
- Fill demo account details
- Note: Login, Password, Server name (you'll need these for testing)

**3.4 Test MT5 Python Integration:**
```powershell
# Install MetaTrader5 package
pip install MetaTrader5

# Test connection
python -c "import MetaTrader5 as mt5; print('MT5 Available:', mt5.initialize())"
# Should print: MT5 Available: True
```

---

### Step 4: Python Service Setup

**4.1 Create Project Directory:**
```powershell
# Create directory
mkdir C:\mt5-service
cd C:\mt5-service

# Initialize git (optional)
git init
```

**4.2 Create Virtual Environment:**
```powershell
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Prompt should change to: (venv) C:\mt5-service>
```

**4.3 Install Dependencies:**
```powershell
# Create requirements.txt
@"
fastapi==0.115.0
uvicorn[standard]==0.30.0
MetaTrader5==5.0.45
cryptography==42.0.0
python-jose[cryptography]==3.3.0
httpx==0.27.0
pydantic==2.8.0
pydantic-settings==2.4.0
psutil==6.0.0
"@ | Out-File -FilePath requirements.txt -Encoding UTF8

# Install packages
pip install -r requirements.txt

# Verify installation
pip list
```

**4.4 Create Project Structure:**
```powershell
# Create directories
New-Item -ItemType Directory -Path app\api\routes
New-Item -ItemType Directory -Path app\core
New-Item -ItemType Directory -Path app\models
New-Item -ItemType Directory -Path app\utils
New-Item -ItemType Directory -Path tests
New-Item -ItemType Directory -Path logs

# Create __init__.py files
New-Item -ItemType File -Path app\__init__.py
New-Item -ItemType File -Path app\api\__init__.py
New-Item -ItemType File -Path app\api\routes\__init__.py
New-Item -ItemType File -Path app\core\__init__.py
New-Item -ItemType File -Path app\models\__init__.py
New-Item -ItemType File -Path app\utils\__init__.py
New-Item -ItemType File -Path tests\__init__.py
```

**4.5 Create main.py (Minimal FastAPI App):**
```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MT5 Integration Service", version="1.0.0")

# CORS - Critical for local development (Mac frontend → Windows service)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    import MetaTrader5 as mt5
    return {
        "status": "healthy",
        "version": "1.0.0",
        "mt5_available": mt5.initialize() is not None
    }

@app.get("/")
async def root():
    return {"message": "MT5 Integration Service - Local Development"}
```

**4.6 Create run.py (Entry Point):**
```python
# run.py
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",  # Listen on all network interfaces
        port=8000,
        reload=True,      # Auto-restart on code changes
        log_level="debug"
    )
```

**4.7 Create start-dev.ps1 (Startup Script):**
```powershell
# start-dev.ps1
.\venv\Scripts\activate
Write-Host "Starting MT5 Service on http://vms.tnm.local:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
python run.py
```

---

### Step 5: Environment Configuration

**5.1 Create .env.example:**
```bash
# .env.example
ENVIRONMENT=development
LOG_LEVEL=DEBUG
API_PORT=8000

MT5_SERVICE_API_KEY=dev_local_test_key_12345
JWT_SECRET_KEY=dev_jwt_secret_not_for_production

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

MT5_CONNECTION_POOL_SIZE=5
MT5_CONNECTION_TIMEOUT=300

ENCRYPTION_KEY=your_32_byte_base64_key_here

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**5.2 Create .env (actual secrets):**
```powershell
# Copy template
Copy-Item .env.example .env

# Edit .env with actual values
notepad .env
```

**5.3 Create .gitignore:**
```
# .gitignore
.env
venv/
__pycache__/
*.pyc
logs/*.log
.pytest_cache/
```

---

### Step 6: Start Development Service

**6.1 Start the Service:**
```powershell
cd C:\mt5-service
.\start-dev.ps1

# You should see:
# INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
# INFO:     Started reloader process
# INFO:     Started server process
# INFO:     Waiting for application startup.
```

**6.2 Test from Windows (Local):**
```powershell
# Open another PowerShell window
curl http://localhost:8000/health

# Should return JSON:
# {"status":"healthy","version":"1.0.0","mt5_available":true}
```

---

### Step 7: Test from Mac (Cross-Network)

**7.1 Test Health Endpoint:**
```bash
# On Mac terminal
curl http://vms.tnm.local:8000/health

# Expected response:
# {"status":"healthy","version":"1.0.0","mt5_available":true}
```

**7.2 Test CORS (Browser):**
```javascript
// On Mac - Open browser console (http://localhost:5173)
fetch('http://vms.tnm.local:8000/health')
  .then(r => r.json())
  .then(console.log);

// Expected: JSON response logged (no CORS error)
// If CORS error: Check CORS middleware in main.py
```

**7.3 Test from Frontend (.env.local):**
```bash
# On Mac - tnm_concept/.env.local
VITE_MT5_SERVICE_URL=http://vms.tnm.local:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Start frontend
cd ~/Desktop/tnm/tnm_concept
npm run dev

# Frontend should now call Windows service
```

---

## Troubleshooting

### Issue: Cannot connect from Mac to Windows

**Solution 1: Check Firewall**
```powershell
# On Windows - verify firewall rule exists
Get-NetFirewallRule -DisplayName "MT5 FastAPI Local Dev"

# If missing, recreate:
New-NetFirewallRule -DisplayName "MT5 FastAPI Local Dev" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

**Solution 2: Verify IP Address**
```powershell
# On Windows - confirm IP
ipconfig | findstr IPv4

# Update Mac frontend .env.local with correct IP
```

**Solution 3: Test Ping First**
```bash
# On Mac - test basic connectivity
ping 192.168.1.100

# If ping fails, network issue (check router/Wi-Fi)
```

---

### Issue: CORS Error in Browser

**Symptom:** Browser console shows:
```
Access to fetch at 'http://vms.tnm.local:8000/health' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solution:** Update CORS middleware in `app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",  # Add alternative localhost
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Issue: MT5 Not Initialized

**Symptom:** `mt5.initialize()` returns `None` or `False`

**Solution 1: Check MT5 Running**
- Ensure MT5 Terminal application is open on Windows
- MetaTrader5 Python package connects to running terminal

**Solution 2: Reinstall MT5**
```powershell
# Download latest MT5
# Install to default location
# Create demo account to test connection
```

---

### Issue: Port 8000 Already in Use

**Symptom:** 
```
ERROR: [Errno 10048] error while attempting to bind on address ('0.0.0.0', 8000): 
only one usage of each socket address is normally permitted
```

**Solution:** Change port or kill existing process:
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <process_id> /F

# Or change port in run.py to 8001
```

---

## ngrok for Supabase Testing

### Setup (Story 1.5 - Completed)

**1. Install ngrok (Windows):**
```powershell
# Install via Chocolatey
choco install ngrok -y

# Verify installation
ngrok version
# Output: ngrok version 3.22.1
```

**2. Configure Authentication:**
```powershell
# Get auth token from https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken YOUR_TOKEN_HERE

# Verify configuration
# Config saved to: C:\Users\YourUser\AppData\Local\ngrok\ngrok.yml
```

**3. Start ngrok Tunnel:**
```powershell
# Method 1: Command line (stays in foreground)
ngrok http 8000

# Method 2: Background process (recommended)
Start-Process -FilePath "ngrok" -ArgumentList "http", "8000"

# Get public URL from ngrok API
curl http://localhost:4040/api/tunnels | ConvertFrom-Json | Select-Object -ExpandProperty tunnels | ForEach-Object { $_.public_url }
```

**4. Current ngrok URL:**
```
Public URL: https://indeterminedly-crablike-dorinda.ngrok-free.dev
Local URL:  http://localhost:8000
Status:     Active ✅
Dashboard:  http://localhost:4040
```

**⚠️ Important:** This URL changes every time ngrok restarts. Use the dashboard at http://localhost:4040 to get the current URL.

**5. Test Tunnel:**
```bash
# From Mac or any internet-connected device
curl https://indeterminedly-crablike-dorinda.ngrok-free.dev/health

# Expected response:
# {"status":"healthy","service":"mt5-integration","version":"1.0.0"}
```

**6. View Request Logs:**
- Open http://localhost:4040 in Windows browser
- See all incoming requests in real-time
- Useful for debugging Supabase edge function calls

### Update Supabase Edge Functions

**Option 1: Environment Variable (Recommended)**
```typescript
// supabase/functions/connect-mt5-account/index.ts
const MT5_SERVICE_URL = Deno.env.get('MT5_SERVICE_URL') || 'http://vms.tnm.local:8000';

// Set in Supabase Dashboard:
// Settings → Edge Functions → Add secret
// Name: MT5_SERVICE_URL
// Value: https://indeterminedly-crablike-dorinda.ngrok-free.dev
```

**Option 2: Direct Configuration**
```typescript
// For testing only - update URL each time ngrok restarts
const MT5_SERVICE_URL = 'https://indeterminedly-crablike-dorinda.ngrok-free.dev';
```

### ngrok Best Practices

**Do:**
- ✅ Use ngrok for testing Supabase → Windows integration
- ✅ Keep ngrok window/process running during development
- ✅ Check http://localhost:4040 for request debugging
- ✅ Update edge function URL when ngrok restarts

**Don't:**
- ❌ Use ngrok for production (use VPS instead)
- ❌ Commit ngrok URLs to git (they change)
- ❌ Expose production credentials through ngrok
- ❌ Forget to restart tunnel after Windows reboot

### ngrok Free Tier Limits
- ✅ 1 online ngrok process
- ✅ 40 connections/minute
- ✅ HTTPS tunnel included
- ⚠️ URL changes on restart
- ⚠️ "Visit Site" button required on first visit (ngrok warning page)

### Alternative: Direct Network Access

For **Mac → Windows** testing without Supabase:
```bash
# Use direct local network URL (no ngrok needed)
curl http://vms.tnm.local:8000/health
```

This is **faster** and **more reliable** than ngrok for local-only testing.

---

## Environment Configuration (Story 5.5)

### Frontend Environment Variables

The frontend requires specific environment variables to communicate with the MT5 service and Supabase. These are configured in the `.env` file.

#### Setup Instructions:

**1. Copy the example file:**
```bash
cd tnm_concept
cp env.example .env
```

**2. Edit `.env` with your values:**
```dotenv
# Supabase Configuration (from your Supabase dashboard)
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"

# MT5 Service Configuration
# Option A: Using ngrok tunnel (for Supabase edge functions)
VITE_MT5_SERVICE_URL="https://your-subdomain.ngrok-free.app"
VITE_MT5_SERVICE_WS="wss://your-subdomain.ngrok-free.app"

# Option B: Direct local network (faster, no Supabase edge functions)
# VITE_MT5_SERVICE_URL="http://vms.tnm.local:8000"
# VITE_MT5_SERVICE_WS="ws://vms.tnm.local:8000"

# Feature Flags
VITE_ENABLE_REALTIME="true"
VITE_ENABLE_MT5_WEBSOCKET="false"
```

#### Required Variables:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_SUPABASE_URL` | ✅ Yes | Your Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous/public key | `eyJhbGci...` |
| `VITE_MT5_SERVICE_URL` | ✅ Yes | MT5 service base URL | `https://xyz.ngrok-free.app` or `http://vms.tnm.local:8000` |
| `VITE_MT5_SERVICE_WS` | ⚠️ Recommended | WebSocket URL for Story 6.1 | `wss://xyz.ngrok-free.app` or `ws://vms.tnm.local:8000` |
| `VITE_ENABLE_REALTIME` | ⚠️ Recommended | Enable Supabase Realtime | `true` or `false` |
| `VITE_SUPABASE_PROJECT_ID` | Optional | Supabase project ID | `abc123` |
| `VITE_ENABLE_MT5_WEBSOCKET` | Optional | Enable MT5 WebSocket (Story 6.1) | `false` (until implemented) |

#### Getting Supabase Credentials:

1. Go to: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to: **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public** key → `VITE_SUPABASE_ANON_KEY`
   - **Project ID** (from URL) → `VITE_SUPABASE_PROJECT_ID`

#### MT5 Service URL Configuration:

**For Local Development (Windows + Mac on same network):**

Choose one of these approaches:

**Option A: ngrok Tunnel (Recommended for Supabase Integration)**
- Allows Supabase edge functions to call MT5 service
- Required for Stories 4.1, 4.2, 5.1, 5.2, 5.3, 5.4
- See [Story 1.5](./stories/1-5-ngrok-tunnel-for-supabase-edge-function-testing.md)

```bash
# Start ngrok on Windows
ngrok http 8000

# Copy the HTTPS URL to .env
VITE_MT5_SERVICE_URL="https://abc-xyz-123.ngrok-free.app"
```

**Option B: Direct Local Network (Faster for Testing)**
- Direct Mac → Windows communication
- Faster, no internet required
- Cannot be used with Supabase edge functions

```dotenv
VITE_MT5_SERVICE_URL="http://vms.tnm.local:8000"
# OR
VITE_MT5_SERVICE_URL="http://10.4.0.180:8000"
```

**For Production:**
```dotenv
VITE_MT5_SERVICE_URL="https://mt5.yourdomain.com"
VITE_MT5_SERVICE_WS="wss://mt5.yourdomain.com"
```

#### Validating Configuration:

Run the environment checker before building:

```bash
cd tnm_concept
npm run check-env
```

Expected output:
```
🔍 Validating environment variables...

Required Variables:
  ✅ VITE_SUPABASE_URL - https://edzkor...
  ✅ VITE_SUPABASE_ANON_KEY - eyJhbGc...
  ✅ VITE_MT5_SERVICE_URL - https://ind...

Recommended Variables:
  ✅ VITE_SUPABASE_PROJECT_ID - edzkorfdixv...
  ✅ VITE_ENABLE_REALTIME - true
  ✅ VITE_MT5_SERVICE_WS - wss://ind...

==================================================
✅ All environment variables validated successfully!
```

#### Syncing with Backend (.env in mt5-service):

The MT5 service (Windows) has its own `.env` file. Keep these values synchronized:

| Frontend Variable | Backend Variable | Must Match? |
|-------------------|------------------|-------------|
| `VITE_SUPABASE_URL` | `SUPABASE_URL` | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | `SUPABASE_ANON_KEY` | ✅ Yes |
| `VITE_MT5_SERVICE_URL` | N/A (backend doesn't need this) | ❌ No |

**Backend `.env` location:** `c:\mt5-service\.env`

#### Troubleshooting:

**Build fails with missing variables:**
```bash
# Run env checker
npm run check-env

# If variables missing, check .env file exists:
ls -la .env

# Copy from example if needed:
cp env.example .env
```

**"Failed to fetch" errors in browser:**
- Verify MT5 service is running: `curl http://vms.tnm.local:8000/health`
- Check firewall allows port 8000 (see Step 1.3 above)
- If using ngrok, verify tunnel is active: `curl https://your-subdomain.ngrok-free.app/health`

**Supabase edge functions can't reach MT5 service:**
- Must use ngrok URL (not `vms.tnm.local`)
- Verify ngrok tunnel is running
- Check `VITE_MT5_SERVICE_URL` uses HTTPS ngrok URL

**Realtime updates not working:**
- Check `VITE_ENABLE_REALTIME="true"` in `.env`
- Verify Supabase Realtime is enabled in dashboard (Database → Replication)
- Check browser console for WebSocket connection errors

---

## Development Workflow

### Daily Development Routine:

**Terminal 1 (Windows) - Backend:**
```powershell
cd C:\mt5-service
.\start-dev.ps1
# Leave running - auto-reloads on code changes
```

**Terminal 2 (Mac) - Frontend:**
```bash
cd ~/Desktop/tnm/tnm_concept
npm run dev
# Frontend runs on http://localhost:5173
```

**Terminal 3 (Mac) - Testing:**
```bash
# Test endpoints
curl http://vms.tnm.local:8000/health

# Or use Postman/Insomnia for complex requests
```

---

## When to Migrate to VPS

Migrate to VPS (Hetzner/Contabo) when:
- ✅ All Epic 1-5 stories work locally
- ✅ Frontend → Windows service → MT5 integration tested
- ✅ Supabase integration working (with ngrok)
- ✅ No blocking issues found
- ✅ Ready for production deployment

**Migration Steps:**
1. Provision VPS (Week 4 of timeline)
2. Copy code from local Windows to VPS
3. Add Nginx + SSL (Story 1.5 from original plan)
4. Add NSSM Windows Service (Story 1.6 from original plan)
5. Update frontend URLs to production domain
6. Deploy & test

---

## Cost Comparison

| Phase | Environment | Cost |
|-------|-------------|------|
| Week 1-3 | Local Windows | **$0** |
| Week 4+ | VPS (Hetzner/Contabo) | **€15-25/month** |
| **Savings** | 3 weeks of validation | **€45-75 saved** |

---

## Quick Reference

### Windows Service Commands:
```powershell
# Start service
.\start-dev.ps1

# Stop service
Ctrl+C

# View logs
Get-Content logs\app.log -Tail 50 -Wait
```

### Mac Testing Commands:
```bash
# Health check
curl http://vms.tnm.local:8000/health

# API test with auth
curl -X POST http://vms.tnm.local:8000/api/mt5/connect \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev_local_test_key_12345" \
  -d '{"login":12345,"password":"test","server":"MetaQuotes-Demo"}'
```

### Important IPs/URLs:
- Windows Service: `http://vms.tnm.local:8000`
- Frontend Dev: `http://localhost:5173`
- ngrok Tunnel: `https://abc123.ngrok.io` (changes on restart)

---

## Next Steps

1. ✅ Complete local setup (this guide)
2. ⏭ Implement Epic 2: MT5 Service Core
3. ⏭ Implement Epic 3: REST API
4. ⏭ Test full integration locally
5. ⏭ Deploy to VPS (Week 4)

For detailed story-by-story implementation, see: `/docs/epics.md`

---

**Questions? Issues?**  
Check troubleshooting section above or review Epic 1 stories in epics.md.

**Happy Local Development! 🚀**
