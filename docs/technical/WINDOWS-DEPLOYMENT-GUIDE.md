# Windows VPS Deployment Guide - MT5 Integration Service

**Project:** TNM AI - MT5 Integration Service  
**Target:** Windows Server 2022 (Contabo/Hetzner VPS)  
**Date:** November 12, 2025

---

## Table of Contents

1. [VPS Selection & Provisioning](#1-vps-selection--provisioning)
2. [Initial Windows Setup](#2-initial-windows-setup)
3. [MT5 Terminal Installation](#3-mt5-terminal-installation)
4. [Python Environment Setup](#4-python-environment-setup)
5. [FastAPI Service Deployment](#5-fastapi-service-deployment)
6. [Service Management (Windows Service)](#6-service-management-windows-service)
7. [Nginx Reverse Proxy Setup](#7-nginx-reverse-proxy-setup)
8. [SSL Certificate Configuration](#8-ssl-certificate-configuration)
9. [Firewall Configuration](#9-firewall-configuration)
10. [Monitoring Setup](#10-monitoring-setup)
11. [Backup & Recovery](#11-backup--recovery)
12. [CI/CD Pipeline](#12-cicd-pipeline)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. VPS Selection & Provisioning

### 1.1 Recommended Providers

**Option A: Contabo (Cheapest - €14.99/month)**
```
VPS Windows M SSD
- CPU: 6 vCores
- RAM: 16 GB
- Storage: 400 GB SSD
- Traffic: 32 TB
- Location: EU or US
- Cost: €14.99/month (~$16/month)
```

**Order:** https://contabo.com/en/vps/

**Option B: Hetzner (Better Performance - €25/month)**
```
CPX31 Windows
- CPU: 4 vCores
- RAM: 8 GB
- Storage: 160 GB
- Traffic: 20 TB
- Location: Germany/Finland/US
- Cost: €25/month (~$27/month)
```

**Order:** https://www.hetzner.com/cloud

---

### 1.2 Provisioning Steps

1. **Create Account** on provider website
2. **Select VPS Plan:**
   - Choose Windows Server 2022 (not Core for easier setup)
   - Select datacenter location (close to user base)
   - Add SSH key or set administrator password

3. **Provision VPS** (takes 5-15 minutes)

4. **Receive Credentials:**
   - IP Address
   - Administrator username
   - Administrator password
   - RDP access details

---

## 2. Initial Windows Setup

### 2.1 Connect via RDP

**From Mac:**
```bash
# Install Microsoft Remote Desktop from App Store
# Open app and add PC:
# - PC Name: <VPS_IP_ADDRESS>
# - User: Administrator
# - Password: <from_email>
```

**From Windows:**
```
Press Win + R
Type: mstsc
Enter IP address and credentials
```

**From Linux:**
```bash
# Install rdesktop
sudo apt install rdesktop

# Connect
rdesktop -u Administrator <VPS_IP_ADDRESS>
```

---

### 2.2 Initial Configuration

**1. Update Windows:**
```powershell
# Open PowerShell as Administrator
# Check for updates
Install-Module PSWindowsUpdate -Force
Get-WindowsUpdate
Install-WindowsUpdate -AcceptAll -AutoReboot
```

**2. Disable Unnecessary Services:**
```powershell
# Disable Windows Defender (optional - if causes performance issues)
Set-MpPreference -DisableRealtimeMonitoring $true

# Disable Windows Update automatic restarts
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" -Name "NoAutoRebootWithLoggedOnUsers" -Value 1
```

**3. Install Chocolatey (Package Manager):**
```powershell
# Run in PowerShell as Admin
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

**4. Install Essential Tools:**
```powershell
# Install Git
choco install git -y

# Install text editor
choco install notepadplusplus -y

# Install 7zip
choco install 7zip -y

# Refresh environment
refreshenv
```

---

## 3. MT5 Terminal Installation

### 3.1 Download MT5

**Option A: Manual Download**
```
1. Open browser on VPS
2. Go to: https://www.metatrader5.com/en/download
3. Click "Download MT5 for Windows"
4. Save to C:\Installers\mt5setup.exe
```

**Option B: PowerShell Download**
```powershell
# Create installers directory
New-Item -ItemType Directory -Force -Path C:\Installers

# Download MT5
$url = "https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe"
$output = "C:\Installers\mt5setup.exe"
Invoke-WebRequest -Uri $url -OutFile $output
```

---

### 3.2 Install MT5 Terminal

```powershell
# Run installer silently
Start-Process -FilePath "C:\Installers\mt5setup.exe" -ArgumentList "/auto" -Wait

# Default installation path: C:\Program Files\MetaTrader 5
```

**Manual Installation Steps:**
1. Double-click installer
2. Accept license agreement
3. Choose installation folder: `C:\Program Files\MetaTrader 5`
4. Uncheck "Launch MetaTrader 5" (we'll configure first)
5. Finish installation

---

### 3.3 Configure MT5 for Headless Operation

**1. Create MT5 Configuration File:**

```powershell
# Create config directory
New-Item -ItemType Directory -Force -Path "C:\MT5Config"

# Create config file
@"
[Common]
; Disable auto-update
AllowAutoUpdate=false

; Disable news
ShowNews=false

; Disable community
ShowCommunity=false

; Performance settings
MaxBars=10000
EnableDDE=false
EnableOpenCL=false

[Charts]
; Disable charts
ShowCharts=false
"@ | Out-File -FilePath "C:\MT5Config\terminal.ini" -Encoding ASCII
```

**2. Disable MT5 Auto-Update:**
```powershell
# Navigate to MT5 directory
cd "C:\Program Files\MetaTrader 5"

# Rename update files to prevent auto-update
Rename-Item -Path "update.exe" -NewName "update.exe.bak" -ErrorAction SilentlyContinue
```

**3. Test MT5 Launch:**
```powershell
# Start MT5 (will open GUI - just testing)
Start-Process "C:\Program Files\MetaTrader 5\terminal64.exe"

# Verify it opens correctly, then close it
# We'll run it in background mode later
```

---

## 4. Python Environment Setup

### 4.1 Install Python

**Using Chocolatey:**
```powershell
# Install Python 3.11
choco install python311 -y

# Refresh environment
refreshenv

# Verify installation
python --version
# Should output: Python 3.11.x

pip --version
# Should output: pip 23.x.x
```

**Manual Installation (if Chocolatey fails):**
```
1. Download from: https://www.python.org/downloads/windows/
2. Run installer
3. ✅ Check "Add Python to PATH"
4. Click "Install Now"
```

---

### 4.2 Create Python Virtual Environment

```powershell
# Create application directory
New-Item -ItemType Directory -Force -Path C:\MT5Service
cd C:\MT5Service

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip
```

---

### 4.3 Install Python Dependencies

**Create requirements.txt:**
```powershell
# Create requirements file
@"
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
MetaTrader5==5.0.45
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
redis==5.0.1
httpx==0.25.1
websockets==12.0
cryptography==41.0.7
"@ | Out-File -FilePath "requirements.txt" -Encoding ASCII

# Install dependencies
pip install -r requirements.txt
```

---

## 5. FastAPI Service Deployment

### 5.1 Project Structure

```powershell
# Create directory structure
cd C:\MT5Service

New-Item -ItemType Directory -Force -Path app
New-Item -ItemType Directory -Force -Path app\routes
New-Item -ItemType Directory -Force -Path app\services
New-Item -ItemType Directory -Force -Path app\models
New-Item -ItemType Directory -Force -Path app\utils
New-Item -ItemType Directory -Force -Path logs
New-Item -ItemType Directory -Force -Path config
```

**Final Structure:**
```
C:\MT5Service\
├── venv\                  # Virtual environment
├── app\
│   ├── __init__.py
│   ├── main.py           # FastAPI application
│   ├── config.py         # Configuration
│   ├── routes\
│   │   ├── __init__.py
│   │   ├── accounts.py   # Account endpoints
│   │   └── websocket.py  # WebSocket endpoint
│   ├── services\
│   │   ├── __init__.py
│   │   ├── mt5_manager.py      # MT5 connection manager
│   │   ├── connection_pool.py  # Connection pooling
│   │   └── encryption.py       # Credential encryption
│   ├── models\
│   │   ├── __init__.py
│   │   └── schemas.py    # Pydantic models
│   └── utils\
│       ├── __init__.py
│       ├── logger.py     # Logging setup
│       └── auth.py       # Authentication
├── logs\                 # Log files
├── config\
│   └── .env             # Environment variables
├── requirements.txt
└── run_service.py       # Service entry point
```

---

### 5.2 Deploy Code via Git

**Option A: Git Clone (Recommended)**
```powershell
cd C:\MT5Service

# Clone your repository
git clone https://github.com/your-org/mt5-service.git .

# Or if using specific branch
git clone -b main https://github.com/your-org/mt5-service.git .
```

**Option B: Manual Upload**
```
1. Use WinSCP or FileZilla to upload files
2. Connect to VPS IP via SFTP/FTP
3. Upload all files to C:\MT5Service\
```

---

### 5.3 Configure Environment Variables

```powershell
# Create .env file
cd C:\MT5Service
New-Item -ItemType File -Force -Path config\.env

# Edit .env file
notepad config\.env

# Add the following content:
```

**config/.env:**
```env
# Service Configuration
ENVIRONMENT=production
LOG_LEVEL=INFO
SERVICE_PORT=8000

# Security
MT5_SERVICE_API_KEY=your-secure-api-key-here-change-this
JWT_SECRET_KEY=your-jwt-secret-here-change-this
ENCRYPTION_KEY=your-aes256-encryption-key-here

# Supabase Integration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# MT5 Configuration
MT5_TERMINAL_PATH=C:\Program Files\MetaTrader 5\terminal64.exe
MT5_CONNECTION_POOL_SIZE=20
MT5_CONNECTION_TIMEOUT=300
MT5_DATA_PATH=C:\Users\Administrator\AppData\Roaming\MetaQuotes\Terminal

# Cache Configuration (optional - Phase 2)
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=30

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

**Generate secure keys:**
```powershell
# Generate random API key
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Or use Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

### 5.4 Test Service Locally

```powershell
# Activate virtual environment
cd C:\MT5Service
.\venv\Scripts\Activate.ps1

# Run service in development mode
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Test in browser: http://localhost:8000/docs
# Should see FastAPI Swagger UI
```

**Test endpoints:**
```powershell
# Test health endpoint
Invoke-WebRequest -Uri "http://localhost:8000/health" -Method Get

# Should return:
# {"status": "healthy", "mt5_initialized": true, ...}
```

Press `Ctrl+C` to stop the service.

---

## 6. Service Management (Windows Service)

### 6.1 Install NSSM (Non-Sucking Service Manager)

```powershell
# Install NSSM via Chocolatey
choco install nssm -y

# Verify installation
nssm --version
```

---

### 6.2 Create Windows Service

**Create service installation script:**

```powershell
# Create script
@"
@echo off
REM MT5 Service Installation Script

cd C:\MT5Service

REM Remove existing service if exists
nssm stop MT5Service
nssm remove MT5Service confirm

REM Install new service
nssm install MT5Service "C:\MT5Service\venv\Scripts\python.exe"
nssm set MT5Service AppParameters "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"
nssm set MT5Service AppDirectory "C:\MT5Service"
nssm set MT5Service DisplayName "TNM MT5 Integration Service"
nssm set MT5Service Description "FastAPI service for MT5 trading data integration"
nssm set MT5Service Start SERVICE_AUTO_START
nssm set MT5Service ObjectName LocalSystem

REM Logging configuration
nssm set MT5Service AppStdout "C:\MT5Service\logs\service-output.log"
nssm set MT5Service AppStderr "C:\MT5Service\logs\service-error.log"
nssm set MT5Service AppRotateFiles 1
nssm set MT5Service AppRotateOnline 1
nssm set MT5Service AppRotateSeconds 86400
nssm set MT5Service AppRotateBytes 10485760

REM Environment variables
nssm set MT5Service AppEnvironmentExtra "PYTHONPATH=C:\MT5Service"

REM Restart on failure
nssm set MT5Service AppExit Default Restart
nssm set MT5Service AppRestartDelay 5000

echo Service installed successfully!
echo Starting service...
nssm start MT5Service

echo Service status:
nssm status MT5Service

pause
"@ | Out-File -FilePath "C:\MT5Service\install_service.bat" -Encoding ASCII
```

**Run the installation script:**
```powershell
# Run as Administrator
cd C:\MT5Service
.\install_service.bat
```

---

### 6.3 Manage Windows Service

**Start/Stop/Restart Service:**
```powershell
# Start service
nssm start MT5Service
# Or: net start MT5Service

# Stop service
nssm stop MT5Service
# Or: net stop MT5Service

# Restart service
nssm restart MT5Service

# Check status
nssm status MT5Service

# View logs
Get-Content C:\MT5Service\logs\service-output.log -Tail 50
```

**Service Management via GUI:**
```powershell
# Open Services app
services.msc

# Find "TNM MT5 Integration Service"
# Right-click for options (Start, Stop, Restart, Properties)
```

---

### 6.4 Auto-start MT5 Terminal on Boot

**Create MT5 startup script:**
```powershell
@"
@echo off
REM Start MT5 Terminal in background

cd "C:\Program Files\MetaTrader 5"
start /B terminal64.exe /portable

echo MT5 Terminal started
"@ | Out-File -FilePath "C:\MT5Service\start_mt5.bat" -Encoding ASCII
```

**Add to Task Scheduler:**
```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute "C:\MT5Service\start_mt5.bat"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName "Start MT5 Terminal" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Auto-start MT5 Terminal on boot"
```

---

## 7. Nginx Reverse Proxy Setup

### 7.1 Install Nginx for Windows

```powershell
# Download Nginx for Windows
$url = "https://nginx.org/download/nginx-1.24.0.zip"
$output = "C:\Installers\nginx.zip"
Invoke-WebRequest -Uri $url -OutFile $output

# Extract
Expand-Archive -Path $output -DestinationPath "C:\nginx"

# Verify
cd C:\nginx\nginx-1.24.0
.\nginx.exe -v
```

---

### 7.2 Configure Nginx

**Edit nginx.conf:**
```powershell
notepad C:\nginx\nginx-1.24.0\conf\nginx.conf
```

**nginx.conf content:**
```nginx
worker_processes  2;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;

    # Upstream FastAPI service
    upstream mt5_service {
        server 127.0.0.1:8000;
    }

    # HTTP server (redirect to HTTPS)
    server {
        listen       80;
        server_name  mt5.tnm.com;  # Replace with your domain

        # Let's Encrypt verification
        location /.well-known/acme-challenge/ {
            root C:/nginx/nginx-1.24.0/html;
        }

        # Redirect all other traffic to HTTPS
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS server
    server {
        listen       443 ssl http2;
        server_name  mt5.tnm.com;  # Replace with your domain

        # SSL certificates (will be generated via Certbot)
        ssl_certificate      C:/nginx/ssl/fullchain.pem;
        ssl_certificate_key  C:/nginx/ssl/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;

        # API endpoints
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://mt5_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts
            proxy_connect_timeout 10s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # WebSocket endpoint
        location /ws/ {
            proxy_pass http://mt5_service;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            # WebSocket timeouts
            proxy_read_timeout 3600s;
            proxy_send_timeout 3600s;
        }

        # Health check
        location /health {
            proxy_pass http://mt5_service;
            access_log off;
        }
    }
}
```

---

### 7.3 Install Nginx as Windows Service

```powershell
# Install NSSM if not already installed
choco install nssm -y

# Install Nginx service
nssm install NginxService "C:\nginx\nginx-1.24.0\nginx.exe"
nssm set NginxService AppDirectory "C:\nginx\nginx-1.24.0"
nssm set NginxService DisplayName "Nginx Reverse Proxy"
nssm set NginxService Start SERVICE_AUTO_START

# Start service
nssm start NginxService

# Verify
nssm status NginxService
```

---

## 8. SSL Certificate Configuration

### 8.1 Domain Setup

**Point your domain to VPS:**
```
1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Add DNS A record:
   - Type: A
   - Name: mt5 (or @ for root domain)
   - Value: <VPS_IP_ADDRESS>
   - TTL: 300
3. Wait for DNS propagation (5-30 minutes)
```

**Verify DNS:**
```powershell
nslookup mt5.tnm.com
# Should return your VPS IP
```

---

### 8.2 Install Certbot (Let's Encrypt)

**Unfortunately, Certbot doesn't have native Windows support. Options:**

**Option A: Use win-acme (Recommended for Windows)**
```powershell
# Download win-acme
$url = "https://github.com/win-acme/win-acme/releases/download/v2.2.6/win-acme.v2.2.6.1594.x64.pluggable.zip"
$output = "C:\Installers\win-acme.zip"
Invoke-WebRequest -Uri $url -OutFile $output

# Extract
Expand-Archive -Path $output -DestinationPath "C:\win-acme"

# Run win-acme
cd C:\win-acme
.\wacs.exe
```

**Interactive setup:**
```
1. Choose N for New certificate
2. Choose 1 for Single binding of an IIS site
3. Enter domain: mt5.tnm.com
4. Choose validation method: http-01 (webroot)
5. Webroot path: C:\nginx\nginx-1.24.0\html
6. Choose installation: manually provide path
7. Certificate path: C:\nginx\ssl\
```

**Option B: Manual Certificate (if domain not ready)**
```powershell
# Generate self-signed certificate for testing
# DO NOT use in production!
cd C:\nginx
mkdir ssl

# Generate certificate (requires OpenSSL)
choco install openssl -y
openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
  -keyout ssl/privkey.pem `
  -out ssl/fullchain.pem `
  -subj "/CN=mt5.tnm.com"
```

---

### 8.3 Auto-renewal Setup

**win-acme handles auto-renewal automatically via Windows Task Scheduler**

Verify renewal task:
```powershell
Get-ScheduledTask | Where-Object {$_.TaskName -like "*win-acme*"}
```

---

## 9. Firewall Configuration

### 9.1 Windows Firewall Rules

```powershell
# Allow HTTP (port 80)
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# Allow HTTPS (port 443)
New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow

# Allow RDP (port 3389) - should already be open
New-NetFirewallRule -DisplayName "Allow RDP" -Direction Inbound -LocalPort 3389 -Protocol TCP -Action Allow

# Block direct access to FastAPI (port 8000)
New-NetFirewallRule -DisplayName "Block FastAPI Direct" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Block

# Verify rules
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*HTTP*" -or $_.DisplayName -like "*RDP*"}
```

---

### 9.2 VPS Provider Firewall

**Contabo/Hetzner Control Panel:**
```
1. Login to provider control panel
2. Go to Firewall settings
3. Add rules:
   - Allow TCP 80 (HTTP)
   - Allow TCP 443 (HTTPS)
   - Allow TCP 3389 (RDP)
   - Block all other incoming traffic
```

---

## 10. Monitoring Setup

### 10.1 UptimeRobot (External Monitoring)

```
1. Go to: https://uptimerobot.com
2. Sign up (free plan)
3. Add Monitor:
   - Type: HTTPS
   - URL: https://mt5.tnm.com/health
   - Interval: 5 minutes
   - Alert: Email when down
```

---

### 10.2 Local Health Check Script

```powershell
# Create monitoring script
@"
# Health Check Script
`$url = "http://localhost:8000/health"

try {
    `$response = Invoke-WebRequest -Uri `$url -TimeoutSec 5
    if (`$response.StatusCode -eq 200) {
        Write-Host "[OK] Service is healthy"
        exit 0
    } else {
        Write-Host "[WARN] Service returned status: `$(`$response.StatusCode)"
        exit 1
    }
} catch {
    Write-Host "[ERROR] Service is down: `$(`$_.Exception.Message)"
    
    # Restart service
    Write-Host "Attempting to restart service..."
    nssm restart MT5Service
    
    exit 2
}
"@ | Out-File -FilePath "C:\MT5Service\health_check.ps1" -Encoding ASCII
```

**Schedule health check:**
```powershell
# Run health check every 5 minutes
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File C:\MT5Service\health_check.ps1"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName "MT5 Service Health Check" -Action $action -Trigger $trigger -Settings $settings
```

---

## 11. Backup & Recovery

### 11.1 Automated Backup Script

```powershell
# Create backup script
@"
# MT5 Service Backup Script
`$backupDir = "C:\Backups\MT5Service"
`$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
`$backupPath = "`$backupDir\backup_`$timestamp"

# Create backup directory
New-Item -ItemType Directory -Force -Path `$backupPath

# Backup service files
Copy-Item -Path "C:\MT5Service\*" -Destination "`$backupPath\" -Recurse -Exclude "venv","logs","__pycache__"

# Backup configuration
Copy-Item -Path "C:\MT5Service\config\.env" -Destination "`$backupPath\config\"

# Backup nginx config
Copy-Item -Path "C:\nginx\nginx-1.24.0\conf\nginx.conf" -Destination "`$backupPath\"

# Keep only last 7 backups
Get-ChildItem `$backupDir | Sort-Object CreationTime -Descending | Select-Object -Skip 7 | Remove-Item -Recurse -Force

Write-Host "Backup completed: `$backupPath"
"@ | Out-File -FilePath "C:\MT5Service\backup.ps1" -Encoding ASCII
```

**Schedule daily backups:**
```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File C:\MT5Service\backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "MT5 Service Daily Backup" -Action $action -Trigger $trigger
```

---

## 12. CI/CD Pipeline

### 12.1 GitHub Actions Workflow

**Create `.github/workflows/deploy-windows.yml` in your repo:**

```yaml
name: Deploy to Windows VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Deploy to Windows VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: Administrator
          password: ${{ secrets.VPS_PASSWORD }}
          port: 22
          script: |
            cd C:\MT5Service
            git pull origin main
            C:\MT5Service\venv\Scripts\pip.exe install -r requirements.txt
            nssm restart MT5Service
            timeout /t 10
            Invoke-WebRequest -Uri "http://localhost:8000/health" -Method Get
```

**Add secrets in GitHub:**
```
Repository → Settings → Secrets and variables → Actions
Add:
- VPS_HOST: your.vps.ip.address
- VPS_PASSWORD: administrator_password
```

---

## 13. Troubleshooting

### 13.1 Service Won't Start

**Check logs:**
```powershell
Get-Content C:\MT5Service\logs\service-error.log -Tail 50
```

**Common issues:**
- Python path incorrect: Verify in NSSM config
- Missing dependencies: Run `pip install -r requirements.txt`
- Port already in use: `netstat -ano | findstr :8000`
- MT5 not installed: Verify `C:\Program Files\MetaTrader 5\terminal64.exe` exists

---

### 13.2 MT5 Connection Failed

**Test MT5 manually:**
```powershell
cd C:\MT5Service
.\venv\Scripts\Activate.ps1
python

>>> import MetaTrader5 as mt5
>>> mt5.initialize()
True  # Should return True

>>> mt5.version()
(5, 0, 4500, ...)  # Should show version
```

---

### 13.3 SSL Certificate Issues

**Test SSL:**
```powershell
Invoke-WebRequest -Uri "https://mt5.tnm.com/health" -Method Get
```

**Common issues:**
- Certificate not found: Check paths in nginx.conf
- Certificate expired: Run win-acme renewal
- DNS not propagated: Wait 30 minutes, check nslookup

---

### 13.4 High Memory Usage

**Check resource usage:**
```powershell
Get-Process python | Select-Object Name, CPU, WorkingSet
Get-Process nginx | Select-Object Name, CPU, WorkingSet
```

**Optimize if needed:**
- Reduce MT5_CONNECTION_POOL_SIZE in .env
- Enable Redis caching
- Add memory limits in NSSM config

---

## Summary Checklist

**Pre-deployment:**
- [ ] VPS provisioned and accessible via RDP
- [ ] Domain DNS configured and propagated
- [ ] Git repository ready with code

**Installation:**
- [ ] Windows updated
- [ ] Chocolatey installed
- [ ] MT5 Terminal installed and configured
- [ ] Python 3.11 installed
- [ ] Virtual environment created
- [ ] Dependencies installed

**Service Setup:**
- [ ] Code deployed via Git
- [ ] Environment variables configured
- [ ] FastAPI service tested locally
- [ ] Windows service installed via NSSM
- [ ] Service auto-starts on boot

**Proxy & SSL:**
- [ ] Nginx installed and configured
- [ ] SSL certificate generated
- [ ] HTTPS working
- [ ] Redirects configured

**Security:**
- [ ] Firewall rules configured
- [ ] API keys generated and secured
- [ ] RDP password changed from default
- [ ] Windows Defender configured

**Monitoring:**
- [ ] UptimeRobot monitoring configured
- [ ] Health check script scheduled
- [ ] Backup script scheduled
- [ ] Logs being written correctly

**Final Tests:**
- [ ] Health endpoint accessible: https://mt5.tnm.com/health
- [ ] API endpoints responding
- [ ] MT5 connection working
- [ ] Service survives reboot
- [ ] Auto-restart working

---

**Deployment Complete! 🎉**

**Next Steps:**
1. Test with real MT5 account
2. Monitor logs for 24 hours
3. Run load test
4. Update Supabase edge functions
5. Deploy frontend updates

**Support:** Check logs in `C:\MT5Service\logs\` for issues
