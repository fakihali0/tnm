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

# Step 8: Install Python
Write-Host "Step 7: Installing Python 3.11+..." -ForegroundColor Yellow

# Check if Python is already installed
$pythonInstalled = Get-Command python -ErrorAction SilentlyContinue

if ($pythonInstalled) {
    $pythonVersion = python --version
    Write-Host "[✓] Python already installed: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "   Downloading Python installer..." -ForegroundColor Gray
    
    # Create temp directory
    $tempDir = "C:\Temp"
    if (-not (Test-Path $tempDir)) {
        New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
    }
    
    # Download Python 3.11
    $pythonUrl = "https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe"
    $pythonInstaller = "$tempDir\python-installer.exe"
    
    try {
        Invoke-WebRequest -Uri $pythonUrl -OutFile $pythonInstaller -UseBasicParsing
        
        Write-Host "   Installing Python..." -ForegroundColor Gray
        Start-Process -FilePath $pythonInstaller -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1" -Wait
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Host "[✓] Python installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to install Python: $_" -ForegroundColor Red
        Write-Host "   Please install Python manually from: https://www.python.org/downloads/" -ForegroundColor Yellow
        exit 1
    }
}
Write-Host ""

# Step 9: Create MT5 Service Directory
Write-Host "Step 8: Creating MT5 Service Directory..." -ForegroundColor Yellow
$serviceDir = "C:\mt5-service"

if (Test-Path $serviceDir) {
    Write-Host "[✓] Service directory already exists: $serviceDir" -ForegroundColor Green
} else {
    try {
        New-Item -Path $serviceDir -ItemType Directory -Force | Out-Null
        Write-Host "[✓] Service directory created: $serviceDir" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to create service directory: $_" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 10: Create Python Virtual Environment
Write-Host "Step 9: Creating Python Virtual Environment..." -ForegroundColor Yellow
$venvPath = "$serviceDir\venv"

if (Test-Path "$venvPath\Scripts\activate.ps1") {
    Write-Host "[✓] Virtual environment already exists" -ForegroundColor Green
} else {
    try {
        Write-Host "   Creating virtual environment..." -ForegroundColor Gray
        python -m venv $venvPath
        Write-Host "[✓] Virtual environment created" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to create virtual environment: $_" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 11: Create requirements.txt
Write-Host "Step 10: Creating requirements.txt..." -ForegroundColor Yellow
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

# Step 12: Install Python Dependencies
Write-Host "Step 11: Installing Python Dependencies..." -ForegroundColor Yellow
try {
    Write-Host "   This may take a few minutes..." -ForegroundColor Gray
    & "$venvPath\Scripts\python.exe" -m pip install --upgrade pip | Out-Null
    & "$venvPath\Scripts\python.exe" -m pip install -r $requirementsFile
    Write-Host "[✓] Python dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install dependencies: $_" -ForegroundColor Red
    Write-Host "   You can install manually later: .\venv\Scripts\activate; pip install -r requirements.txt" -ForegroundColor Yellow
}
Write-Host ""

# Step 13: Create .env.example
Write-Host "Step 12: Creating .env.example..." -ForegroundColor Yellow
$envExampleFile = "$serviceDir\.env.example"
$envExampleContent = @"
# Service Configuration
ENVIRONMENT=development
LOG_LEVEL=DEBUG
API_PORT=8000
HOST=0.0.0.0

# Authentication
MT5_SERVICE_API_KEY=dev_local_test_key_change_in_production
JWT_SECRET_KEY=dev_jwt_secret_change_in_production

# Supabase Integration (Docker VM)
SUPABASE_URL=http://172.16.16.100:8000
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# MT5 Configuration
MT5_CONNECTION_POOL_SIZE=5
MT5_CONNECTION_TIMEOUT=300

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
Write-Host ""

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  Next Steps:" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Install MT5 Terminal:" -ForegroundColor Yellow
Write-Host "   Download from: https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe" -ForegroundColor White
Write-Host ""
Write-Host "2. Configure environment variables:" -ForegroundColor Yellow
Write-Host "   cd $serviceDir" -ForegroundColor White
Write-Host "   copy .env.example .env" -ForegroundColor White
Write-Host "   # Edit .env with actual values" -ForegroundColor White
Write-Host ""
Write-Host "3. Clone MT5 service repository:" -ForegroundColor Yellow
Write-Host "   cd $serviceDir" -ForegroundColor White
Write-Host "   git clone <your-repo-url> ." -ForegroundColor White
Write-Host ""
Write-Host "4. Test the service:" -ForegroundColor Yellow
Write-Host "   .\\venv\\Scripts\\activate" -ForegroundColor White
Write-Host "   python run.py" -ForegroundColor White
Write-Host ""
Write-Host "5. From Mac, create SSH tunnel:" -ForegroundColor Yellow
Write-Host "   ssh -L 8000:$VMIP:8000 root@142.132.156.162 -N" -ForegroundColor Cyan
Write-Host "   Then access: http://localhost:8000/health" -ForegroundColor Cyan
Write-Host ""

Write-Host "[✓] Windows Server 2025 VM setup completed successfully!" -ForegroundColor Green
Write-Host ""
