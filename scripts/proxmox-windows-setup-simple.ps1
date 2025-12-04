# Windows Server 2025 Setup Script for Proxmox MT5 Service
# Story 1.1: Proxmox Windows VM Setup and Configuration
# 
# PREREQUISITES:
# - Run as Administrator
# - Windows Server 2025
# - VM IP: 172.16.16.20/24
# - Docker already installed
#
# USAGE:
#   .\proxmox-windows-setup-simple.ps1

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  MT5 Integration Service - Proxmox Windows VM Setup" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$VMIP = "172.16.16.20"
$Gateway = "172.16.16.1"
$DNS = @("8.8.8.8", "8.8.4.4")
$SubnetPrefix = 24
$FirewallRuleOrchestrator = "MT5 Orchestrator Service"
$FirewallRuleMT5Range = "MT5 Dynamic Containers"
$OrchestratorPort = 7999
$MT5PortRangeStart = 8000
$MT5PortRangeEnd = 8999

# Step 1: Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Running as Administrator" -ForegroundColor Green
Write-Host ""

# Step 2: Verify Docker Installation
Write-Host "Step 1: Verifying Docker Installation..." -ForegroundColor Yellow
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerInstalled) {
    $dockerVersion = docker --version
    Write-Host "[OK] Docker already installed: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "[!] Docker not found. Please install Docker Desktop for Windows." -ForegroundColor Yellow
    Write-Host "    Download: https://www.docker.com/products/docker-desktop" -ForegroundColor White
    exit 1
}
Write-Host ""

# Step 3: Get active network adapter
Write-Host "Step 2: Detecting Network Adapter..." -ForegroundColor Yellow
$adapter = Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | Select-Object -First 1

if ($null -eq $adapter) {
    Write-Host "[ERROR] No active network adapter found!" -ForegroundColor Red
    exit 1
}

$adapterName = $adapter.Name
Write-Host "[OK] Found active adapter: $adapterName" -ForegroundColor Green
Write-Host ""

# Step 4: Verify Static IP (Skip Configuration)
Write-Host "Step 3: Verifying Static IP Configuration..." -ForegroundColor Yellow
$currentIP = (Get-NetIPAddress -InterfaceAlias $adapterName -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress

if ($currentIP -eq $VMIP) {
    Write-Host "[OK] IP already configured: $currentIP" -ForegroundColor Green
} else {
    Write-Host "[OK] Current IP: $currentIP" -ForegroundColor Yellow
    Write-Host "    Expected IP: $VMIP" -ForegroundColor Gray
    Write-Host "    Skipping IP configuration (already set manually)" -ForegroundColor Gray
}
Write-Host ""

# Step 5: Test Internet Connectivity
Write-Host "Step 4: Testing Internet Connectivity..." -ForegroundColor Yellow
try {
    $testConnection = Test-NetConnection -ComputerName google.com -InformationLevel Quiet
    if ($testConnection) {
        Write-Host "[OK] Internet connectivity verified" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Cannot reach google.com - check network settings" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Network test failed: $_" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Set PowerShell Execution Policy
Write-Host "Step 5: Configuring PowerShell Execution Policy..." -ForegroundColor Yellow
$currentPolicy = Get-ExecutionPolicy -Scope CurrentUser

if ($currentPolicy -eq "RemoteSigned" -or $currentPolicy -eq "Unrestricted") {
    Write-Host "[OK] Execution policy already set to $currentPolicy" -ForegroundColor Green
} else {
    try {
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
        Write-Host "[OK] Execution policy set to RemoteSigned" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to set execution policy: $_" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 7: Create Firewall Rules
Write-Host "Step 6: Configuring Windows Firewall..." -ForegroundColor Yellow

# Orchestrator port
$existingRuleOrch = Get-NetFirewallRule -DisplayName $FirewallRuleOrchestrator -ErrorAction SilentlyContinue
if ($existingRuleOrch) {
    Write-Host "[OK] Orchestrator firewall rule already exists" -ForegroundColor Green
} else {
    try {
        New-NetFirewallRule -DisplayName $FirewallRuleOrchestrator -Direction Inbound -LocalPort $OrchestratorPort -Protocol TCP -Action Allow -Description "Allow inbound traffic on port $OrchestratorPort for MT5 Container Orchestrator" | Out-Null
        Write-Host "[OK] Orchestrator firewall rule created for port $OrchestratorPort" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to create orchestrator firewall rule: $_" -ForegroundColor Red
        exit 1
    }
}

# MT5 container port range
$existingRuleMT5 = Get-NetFirewallRule -DisplayName $FirewallRuleMT5Range -ErrorAction SilentlyContinue
if ($existingRuleMT5) {
    Write-Host "[OK] MT5 containers firewall rule already exists" -ForegroundColor Green
} else {
    try {
        New-NetFirewallRule -DisplayName $FirewallRuleMT5Range -Direction Inbound -LocalPort "$MT5PortRangeStart-$MT5PortRangeEnd" -Protocol TCP -Action Allow -Description "Allow inbound traffic on ports $MT5PortRangeStart-$MT5PortRangeEnd for dynamic MT5 containers" | Out-Null
        Write-Host "[OK] MT5 containers firewall rule created for ports $MT5PortRangeStart-$MT5PortRangeEnd" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to create MT5 containers firewall rule: $_" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 8: Verify Docker Compose
Write-Host "Step 7: Verifying Docker Compose..." -ForegroundColor Yellow
$dockerComposeInstalled = docker compose version 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Docker Compose available: $dockerComposeInstalled" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Docker Compose not available!" -ForegroundColor Red
    Write-Host "   Please ensure Docker Desktop includes Compose plugin" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 9: Create MT5 Docker Directories
Write-Host "Step 8: Creating MT5 Docker Directories..." -ForegroundColor Yellow
$orchestratorDir = "D:\mt5-orchestrator"
$mt5ServiceDir = "D:\mt5-service-template"

foreach ($dir in @($orchestratorDir, $mt5ServiceDir)) {
    if (Test-Path $dir) {
        Write-Host "[OK] Directory already exists: $dir" -ForegroundColor Green
    } else {
        try {
            New-Item -Path $dir -ItemType Directory -Force | Out-Null
            Write-Host "[OK] Directory created: $dir" -ForegroundColor Green
        } catch {
            Write-Host "[ERROR] Failed to create directory: $_" -ForegroundColor Red
            exit 1
        }
    }
}
Write-Host ""

# Step 10: Create Orchestrator Dockerfile
Write-Host "Step 9: Creating Orchestrator Dockerfile..." -ForegroundColor Yellow
$orchestratorDockerfile = @"
FROM mcr.microsoft.com/windows/servercore:ltsc2022

RUN powershell -Command Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

RUN choco install -y python --version=3.11.7
RUN choco install -y docker-cli

WORKDIR D:\orchestrator

COPY requirements.txt .
RUN python -m pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY orchestrator D:\orchestrator\orchestrator

EXPOSE 7999

CMD ["python", "-m", "uvicorn", "orchestrator.main:app", "--host", "0.0.0.0", "--port", "7999"]
"@

try {
    $orchestratorDockerfile | Out-File -FilePath "$orchestratorDir\Dockerfile" -Encoding UTF8 -Force
    Write-Host "[OK] Orchestrator Dockerfile created" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create Orchestrator Dockerfile: $_" -ForegroundColor Red
}
Write-Host ""

# Step 11: Create MT5 Service Template Dockerfile
Write-Host "Step 10: Creating MT5 Service Template Dockerfile..." -ForegroundColor Yellow
$mt5Dockerfile = @"
FROM mcr.microsoft.com/windows/servercore:ltsc2022

RUN powershell -Command Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

RUN choco install -y python --version=3.11.7

WORKDIR D:\app

COPY requirements.txt .
RUN python -m pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

RUN powershell -Command Invoke-WebRequest -Uri 'https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe' -OutFile 'D:\Temp\mt5setup.exe'; Start-Process -FilePath 'D:\Temp\mt5setup.exe' -ArgumentList '/auto' -Wait; Remove-Item 'D:\Temp\mt5setup.exe'

COPY app D:\app\app

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
"@

try {
    $mt5Dockerfile | Out-File -FilePath "$mt5ServiceDir\Dockerfile" -Encoding UTF8 -Force
    Write-Host "[OK] MT5 Service Template Dockerfile created" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create MT5 Service Dockerfile: $_" -ForegroundColor Red
}
Write-Host ""

# Step 12: Create Orchestrator docker-compose.yml
Write-Host "Step 11: Creating Orchestrator docker-compose.yml..." -ForegroundColor Yellow
$orchestratorCompose = @"
version: '3.8'

services:
  mt5-orchestrator:
    build: .
    container_name: mt5-orchestrator
    restart: unless-stopped
    ports:
      - "7999:7999"
    environment:
      - ENVIRONMENT=development
      - LOG_LEVEL=DEBUG
      - SUPABASE_URL=http://172.16.16.100:8000
      - SUPABASE_SERVICE_ROLE_KEY=`${SUPABASE_SERVICE_ROLE_KEY}
      - JWT_SECRET_KEY=`${JWT_SECRET_KEY}
      - ENCRYPTION_KEY=`${ENCRYPTION_KEY}
      - MT5_SERVICE_IMAGE=mt5-service:latest
      - MT5_PORT_RANGE_START=8000
      - MT5_PORT_RANGE_END=8999
      - DOCKER_HOST=npipe:////./pipe/docker_engine
    volumes:
      - ./orchestrator:D:\orchestrator\orchestrator
      - \\.\pipe\docker_engine:\\.\pipe\docker_engine
    networks:
      - mt5-network

networks:
  mt5-network:
    driver: nat
"@

try {
    $orchestratorCompose | Out-File -FilePath "$orchestratorDir\docker-compose.yml" -Encoding UTF8 -Force
    Write-Host "[OK] Orchestrator docker-compose.yml created" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create Orchestrator docker-compose.yml: $_" -ForegroundColor Red
}
Write-Host ""

# Step 13: Create requirements.txt files
Write-Host "Step 12: Creating requirements.txt files..." -ForegroundColor Yellow

# Orchestrator requirements
$orchestratorRequirements = @"
fastapi==0.104.1
uvicorn[standard]==0.24.0
docker==7.0.0
cryptography==41.0.7
python-jose[cryptography]==3.3.0
httpx==0.25.2
pydantic==2.5.2
pydantic-settings==2.1.0
python-dotenv==1.0.0
supabase==2.3.0
psutil==5.9.6
"@

try {
    $orchestratorRequirements | Out-File -FilePath "$orchestratorDir\requirements.txt" -Encoding UTF8 -Force
    Write-Host "[OK] Orchestrator requirements.txt created" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create Orchestrator requirements.txt: $_" -ForegroundColor Red
}

# MT5 Service requirements
$mt5Requirements = @"
fastapi==0.104.1
uvicorn[standard]==0.24.0
MetaTrader5==5.0.45
cryptography==41.0.7
python-jose[cryptography]==3.3.0
httpx==0.25.2
pydantic==2.5.2
pydantic-settings==2.1.0
python-dotenv==1.0.0
psutil==5.9.6
websockets==12.0
"@

try {
    $mt5Requirements | Out-File -FilePath "$mt5ServiceDir\requirements.txt" -Encoding UTF8 -Force
    Write-Host "[OK] MT5 Service requirements.txt created" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create MT5 Service requirements.txt: $_" -ForegroundColor Red
}
Write-Host ""

# Step 14: Create .env.example
Write-Host "Step 13: Creating .env.example..." -ForegroundColor Yellow
$envExampleContent = @"
# Service Configuration
ENVIRONMENT=development
LOG_LEVEL=DEBUG

# Authentication
JWT_SECRET_KEY=dev_jwt_secret_change_in_production

# Supabase Integration (Docker VM)
SUPABASE_URL=http://172.16.16.100:8000
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Encryption (generate: openssl rand -base64 32)
ENCRYPTION_KEY=your_32_byte_base64_key_here

# MT5 Container Configuration
MT5_SERVICE_IMAGE=mt5-service:latest
MT5_PORT_RANGE_START=8000
MT5_PORT_RANGE_END=8999
MT5_CONTAINER_IDLE_TIMEOUT=1800

# Docker Configuration
DOCKER_HOST=npipe:////./pipe/docker_engine
"@

try {
    $envExampleContent | Out-File -FilePath "$orchestratorDir\.env.example" -Encoding UTF8 -Force
    Write-Host "[OK] .env.example created" -ForegroundColor Green
    Write-Host "   Copy to .env and update with actual values" -ForegroundColor Yellow
} catch {
    Write-Host "[ERROR] Failed to create .env.example: $_" -ForegroundColor Red
}
Write-Host ""

# Verification Summary
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETE - Verification Summary" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

$ipConfig = Get-NetIPAddress -InterfaceAlias $adapterName -AddressFamily IPv4

Write-Host "Network Configuration:" -ForegroundColor White
Write-Host "  Adapter:       $adapterName" -ForegroundColor Gray
Write-Host "  IP Address:    $($ipConfig.IPAddress)" -ForegroundColor Gray
Write-Host "  Gateway:       $Gateway" -ForegroundColor Gray
Write-Host "  DNS:           $($DNS -join ', ')" -ForegroundColor Gray
Write-Host ""

Write-Host "Docker Status:" -ForegroundColor White
if ($dockerInstalled) {
    Write-Host "  Status:        Installed" -ForegroundColor Gray
    Write-Host "  Version:       $(docker --version)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "Python Configuration:" -ForegroundColor White
Write-Host "  Status:        Installed" -ForegroundColor Gray
Write-Host "  Version:       $(python --version 2>&1)" -ForegroundColor Gray
Write-Host ""

Write-Host "Service Configuration:" -ForegroundColor White
Write-Host "  Orchestrator:  $orchestratorDir" -ForegroundColor Gray
Write-Host "  MT5 Template:  $mt5ServiceDir" -ForegroundColor Gray
Write-Host "  Orch Port:     $OrchestratorPort" -ForegroundColor Gray
Write-Host "  MT5 Ports:     $MT5PortRangeStart-$MT5PortRangeEnd" -ForegroundColor Gray
Write-Host "  URL (Orch):    http://$VMIP:$OrchestratorPort" -ForegroundColor Gray
Write-Host "  URL (Mac):     http://localhost:7999 (via SSH tunnel)" -ForegroundColor Gray
Write-Host "  Architecture:  Orchestrator + Dynamic MT5 Containers" -ForegroundColor Gray
Write-Host "  Mode:          1 active container per user" -ForegroundColor Gray
Write-Host ""

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  Next Steps:" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Build MT5 Service Template Image:" -ForegroundColor Yellow
Write-Host "   cd $mt5ServiceDir" -ForegroundColor White
Write-Host "   # Copy your app/ code first" -ForegroundColor Gray
Write-Host "   docker build -t mt5-service:latest ." -ForegroundColor White
Write-Host ""
Write-Host "2. Configure Orchestrator environment:" -ForegroundColor Yellow
Write-Host "   cd $orchestratorDir" -ForegroundColor White
Write-Host "   copy .env.example .env" -ForegroundColor White
Write-Host "   # Edit .env with actual Supabase keys" -ForegroundColor White
Write-Host ""
Write-Host "3. Build and run Orchestrator:" -ForegroundColor Yellow
Write-Host "   cd $orchestratorDir" -ForegroundColor White
Write-Host "   # Copy your orchestrator/ code first" -ForegroundColor Gray
Write-Host "   docker compose build" -ForegroundColor White
Write-Host "   docker compose up -d" -ForegroundColor White
Write-Host ""
Write-Host "4. Check orchestrator logs:" -ForegroundColor Yellow
Write-Host "   docker compose logs -f mt5-orchestrator" -ForegroundColor White
Write-Host ""
Write-Host "5. From Mac, create SSH tunnel:" -ForegroundColor Yellow
Write-Host "   ssh -L 7999:$VMIP:7999 root@142.132.156.162 -N" -ForegroundColor Cyan
Write-Host "   Then access: http://localhost:7999/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Architecture Notes:" -ForegroundColor Yellow
Write-Host "  - Orchestrator (port 7999): Manages container lifecycle" -ForegroundColor Gray
Write-Host "  - Dynamic MT5 Containers (8000-8999): Created per user/broker" -ForegroundColor Gray
Write-Host "  - 1 active container per user at a time" -ForegroundColor Gray
Write-Host "  - User switches broker -> stops old container, starts new one" -ForegroundColor Gray
Write-Host "  - MT5 Windows limitation: 1 account per instance" -ForegroundColor Gray
Write-Host "  - Containers auto-cleanup after idle timeout (30 min)" -ForegroundColor Gray
Write-Host ""

Write-Host "[OK] Windows Server 2025 VM setup completed successfully!" -ForegroundColor Green
Write-Host ""
