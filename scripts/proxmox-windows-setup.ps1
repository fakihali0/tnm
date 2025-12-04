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
#   .\proxmox-windows-setup.ps1

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  MT5 Integration Service - Proxmox Windows VM Setup" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$VMIP = "172.16.16.20"
$Gateway = "172.16.16.1"
$DNS = @("8.8.8.8", "8.8.4.4")
$SubnetPrefix = 24  # 255.255.255.0
$FirewallRuleName = "MT5 FastAPI Service"
$ServicePort = 8000

# Step 1: Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "[✓] Running as Administrator" -ForegroundColor Green
Write-Host ""

# Step 2: Verify Docker Installation
Write-Host "Step 1: Verifying Docker Installation..." -ForegroundColor Yellow
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerInstalled) {
    $dockerVersion = docker --version
    Write-Host "[✓] Docker already installed: $dockerVersion" -ForegroundColor Green
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
Write-Host "[✓] Found active adapter: $adapterName" -ForegroundColor Green
Write-Host ""

# Step 4: Verify/Configure Static IP
Write-Host "Step 3: Verifying Static IP Configuration..." -ForegroundColor Yellow
$currentIP = (Get-NetIPAddress -InterfaceAlias $adapterName -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress

if ($currentIP -eq $VMIP) {
    Write-Host "[✓] IP already configured: $currentIP" -ForegroundColor Green
} else {
    Write-Host "   Current IP: $currentIP" -ForegroundColor Gray
    Write-Host "   Configuring static IP: $VMIP" -ForegroundColor White
    
    try {
        # Remove existing IP configuration
        Remove-NetIPAddress -InterfaceAlias $adapterName -Confirm:$false -ErrorAction SilentlyContinue
        Remove-NetRoute -InterfaceAlias $adapterName -Confirm:$false -ErrorAction SilentlyContinue
        
        # Set static IP
        New-NetIPAddress -InterfaceAlias $adapterName -IPAddress $VMIP -PrefixLength $SubnetPrefix -DefaultGateway $Gateway | Out-Null
        
        # Set DNS
        Set-DnsClientServerAddress -InterfaceAlias $adapterName -ServerAddresses $DNS
        
        Write-Host "[✓] Static IP configured successfully" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to configure static IP: $_" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 5: Test Internet Connectivity
Write-Host "Step 4: Testing Internet Connectivity..." -ForegroundColor Yellow
try {
    $testConnection = Test-NetConnection -ComputerName google.com -InformationLevel Quiet
    if ($testConnection) {
        Write-Host "[✓] Internet connectivity verified" -ForegroundColor Green
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
    Write-Host "[✓] Execution policy already set to $currentPolicy" -ForegroundColor Green
} else {
    try {
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
        Write-Host "[✓] Execution policy set to RemoteSigned" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to set execution policy: $_" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 7: Create Firewall Rule
Write-Host "Step 6: Configuring Windows Firewall..." -ForegroundColor Yellow
$existingRule = Get-NetFirewallRule -DisplayName $FirewallRuleName -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "[✓] Firewall rule already exists" -ForegroundColor Green
} else {
    try {
        New-NetFirewallRule `
            -DisplayName $FirewallRuleName `
            -Direction Inbound `
            -LocalPort $ServicePort `
            -Protocol TCP `
            -Action Allow `
            -Description "Allow inbound HTTP traffic on port $ServicePort for MT5 FastAPI service" | Out-Null
        
        Write-Host "[✓] Firewall rule created for port $ServicePort" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to create firewall rule: $_" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 8: Verify Docker Compose
Write-Host "Step 7: Verifying Docker Compose..." -ForegroundColor Yellow
$dockerComposeInstalled = docker compose version 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[✓] Docker Compose available: $dockerComposeInstalled" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Docker Compose not available!" -ForegroundColor Red
    Write-Host "   Please ensure Docker Desktop includes Compose plugin" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 9: Create MT5 Docker Directory
Write-Host "Step 8: Creating MT5 Docker Directory..." -ForegroundColor Yellow
$serviceDir = "C:\mt5-docker"

if (Test-Path $serviceDir) {
    Write-Host "[✓] Docker directory already exists: $serviceDir" -ForegroundColor Green
} else {
    try {
        New-Item -Path $serviceDir -ItemType Directory -Force | Out-Null
        Write-Host "[✓] Docker directory created: $serviceDir" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to create docker directory: $_" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 10: Create Dockerfile for MT5 Headless (Windows Server Core)
Write-Host "Step 9: Creating Dockerfile for MT5 Headless..." -ForegroundColor Yellow
$dockerfileContent = @"
# Dockerfile for MT5 Headless + Python FastAPI on Windows Server Core
# escape=``

FROM mcr.microsoft.com/windows/servercore:ltsc2022

# Install Chocolatey
RUN powershell -Command ``
    Set-ExecutionPolicy Bypass -Scope Process -Force; ``
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; ``
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Python
RUN choco install -y python --version=3.11.7

# Set working directory
WORKDIR C:\\app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN python -m pip install --upgrade pip && ``
    pip install --no-cache-dir -r requirements.txt

# Download and install MT5 Terminal (silent install)
RUN powershell -Command ``
    Invoke-WebRequest -Uri 'https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe' -OutFile 'C:\\Temp\\mt5setup.exe'; ``
    Start-Process -FilePath 'C:\\Temp\\mt5setup.exe' -ArgumentList '/auto' -Wait; ``
    Remove-Item 'C:\\Temp\\mt5setup.exe'

# Copy application code
COPY app C:\\app\\app

# Expose FastAPI port
EXPOSE 8000

# Run FastAPI service
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
"@

$dockerfilePath = "$serviceDir\Dockerfile"
try {
    $dockerfileContent | Out-File -FilePath $dockerfilePath -Encoding UTF8 -Force
    Write-Host "[✓] Dockerfile created" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create Dockerfile: $_" -ForegroundColor Red
}
Write-Host ""

# Step 11: Create docker-compose.yml
Write-Host "Step 10: Creating docker-compose.yml..." -ForegroundColor Yellow
$composeContent = @"
version: '3.8'

services:
  mt5-service:
    build: .
    container_name: mt5-fastapi
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=development
      - LOG_LEVEL=DEBUG
      - SUPABASE_URL=http://172.16.16.100:8000
      - SUPABASE_SERVICE_ROLE_KEY=\${SUPABASE_SERVICE_ROLE_KEY}
      - MT5_SERVICE_API_KEY=\${MT5_SERVICE_API_KEY}
      - JWT_SECRET_KEY=\${JWT_SECRET_KEY}
      - ENCRYPTION_KEY=\${ENCRYPTION_KEY}
      - CORS_ORIGINS=http://localhost:5173,http://localhost:3000
    volumes:
      - ./app:C:\\app\\app
      - mt5-data:C:\\Users\\ContainerAdministrator\\AppData\\Roaming\\MetaQuotes
    networks:
      - mt5-network

volumes:
  mt5-data:

networks:
  mt5-network:
    driver: nat
"@

$composePath = "$serviceDir\docker-compose.yml"
try {
    $composeContent | Out-File -FilePath $composePath -Encoding UTF8 -Force
    Write-Host "[✓] docker-compose.yml created" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create docker-compose.yml: $_" -ForegroundColor Red
}
Write-Host ""

# Step 12: Create requirements.txt
Write-Host "Step 11: Creating requirements.txt..." -ForegroundColor Yellow
$requirementsFile = "$serviceDir\requirements.txt"
$requirementsContent = @"
fastapi==0.104.1
uvicorn[standard]==0.24.0
MetaTrader5==5.0.45
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
    $requirementsContent | Out-File -FilePath $requirementsFile -Encoding UTF8 -Force
    Write-Host "[✓] requirements.txt created" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create requirements.txt: $_" -ForegroundColor Red
}
Write-Host ""

# Step 13: Create .env.example
Write-Host "Step 12: Creating .env.example..." -ForegroundColor Yellow
$envExampleFile = "$serviceDir\.env.example"
$envExampleContent = @"
# Service Configuration
ENVIRONMENT=development
LOG_LEVEL=DEBUG

# Authentication
MT5_SERVICE_API_KEY=dev_local_test_key_change_in_production
JWT_SECRET_KEY=dev_jwt_secret_change_in_production

# Supabase Integration (Docker VM)
SUPABASE_URL=http://172.16.16.100:8000
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Encryption (generate: openssl rand -base64 32)
ENCRYPTION_KEY=your_32_byte_base64_key_here

# CORS Origins (for Mac development via SSH tunnel)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
"@

try {
    $envExampleContent | Out-File -FilePath $envExampleFile -Encoding UTF8 -Force
    Write-Host "[✓] .env.example created" -ForegroundColor Green
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
Write-Host "  Venv:          $venvPath" -ForegroundColor Gray
Write-Host ""

Write-Host "Service Configuration:" -ForegroundColor White
Write-Host "  Directory:     $serviceDir" -ForegroundColor Gray
Write-Host "  Port:          $ServicePort" -ForegroundColor Gray
Write-Host "  URL (Internal): http://$VMIP:$ServicePort" -ForegroundColor Gray
Write-Host "  URL (Mac):     http://localhost:8000 (via SSH tunnel)" -ForegroundColor Gray
Write-Host "  Mode:          Docker Containerized (Windows Server Core)" -ForegroundColor Gray
Write-Host ""

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  Next Steps:" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure environment variables:" -ForegroundColor Yellow
Write-Host "   cd $serviceDir" -ForegroundColor White
Write-Host "   copy .env.example .env" -ForegroundColor White
Write-Host "   # Edit .env with actual Supabase keys" -ForegroundColor White
Write-Host ""
Write-Host "2. Clone/Copy your MT5 service code:" -ForegroundColor Yellow
Write-Host "   cd $serviceDir" -ForegroundColor White
Write-Host "   git clone <your-repo-url> app" -ForegroundColor White
Write-Host "   # Or copy app/ folder with your FastAPI code" -ForegroundColor White
Write-Host ""
Write-Host "3. Build and run Docker container:" -ForegroundColor Yellow
Write-Host "   cd $serviceDir" -ForegroundColor White
Write-Host "   docker compose build" -ForegroundColor White
Write-Host "   docker compose up -d" -ForegroundColor White
Write-Host ""
Write-Host "4. Check container logs:" -ForegroundColor Yellow
Write-Host "   docker compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "5. From Mac, create SSH tunnel:" -ForegroundColor Yellow
Write-Host "   ssh -L 8000:$VMIP:8000 root@142.132.156.162 -N" -ForegroundColor Cyan
Write-Host "   Then access: http://localhost:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: MT5 Terminal runs inside Windows Server Core container" -ForegroundColor Yellow
Write-Host "      - Native Windows execution (not Wine)" -ForegroundColor Gray
Write-Host "      - No GUI - fully headless operation" -ForegroundColor Gray
Write-Host "      - All MT5 operations via Python MetaTrader5 API" -ForegroundColor Gray
Write-Host ""

Write-Host "[✓] Windows Server 2025 VM setup completed successfully!" -ForegroundColor Green
Write-Host ""
