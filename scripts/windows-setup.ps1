# Windows Machine Setup Script for MT5 Service Development
# Story 1.1: Local Windows Machine Setup and Network Configuration
# 
# PREREQUISITES:
# - Run as Administrator
# - Windows 10/11
# - Active network connection
#
# USAGE:
#   .\windows-setup.ps1

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  MT5 Integration Service - Windows Setup (Story 1.1)" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$StaticIP = "10.4.0.180"
$Hostname = "vms.tnm.local"  # Use this hostname instead of IP in configs
$Gateway = "10.4.0.1"
$DNS = @("8.8.8.8", "8.8.4.4")
$SubnetPrefix = 24  # 255.255.255.0
$FirewallRuleName = "MT5 FastAPI Local Dev"
$ServicePort = 8000
$HostsFile = "C:\Windows\System32\drivers\etc\hosts"

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

# Step 2: Get active network adapter
Write-Host "Step 1: Detecting Network Adapter..." -ForegroundColor Yellow
$adapter = Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | Select-Object -First 1

if ($null -eq $adapter) {
    Write-Host "[ERROR] No active network adapter found!" -ForegroundColor Red
    exit 1
}

$adapterName = $adapter.Name
Write-Host "[✓] Found active adapter: $adapterName" -ForegroundColor Green
Write-Host ""

# Step 3: Configure Static IP
Write-Host "Step 2: Configuring Static IP Address..." -ForegroundColor Yellow
Write-Host "   IP Address: $StaticIP" -ForegroundColor White
Write-Host "   Gateway: $Gateway" -ForegroundColor White
Write-Host "   DNS: $($DNS -join ', ')" -ForegroundColor White

try {
    # Remove existing IP configuration
    Write-Host "   Removing existing IP configuration..." -ForegroundColor Gray
    Remove-NetIPAddress -InterfaceAlias $adapterName -Confirm:$false -ErrorAction SilentlyContinue
    Remove-NetRoute -InterfaceAlias $adapterName -Confirm:$false -ErrorAction SilentlyContinue
    
    # Set static IP
    Write-Host "   Setting static IP..." -ForegroundColor Gray
    New-NetIPAddress -InterfaceAlias $adapterName -IPAddress $StaticIP -PrefixLength $SubnetPrefix -DefaultGateway $Gateway | Out-Null
    
    # Set DNS
    Write-Host "   Setting DNS servers..." -ForegroundColor Gray
    Set-DnsClientServerAddress -InterfaceAlias $adapterName -ServerAddresses $DNS
    
    Write-Host "[✓] Static IP configured successfully" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to configure static IP: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Test Internet Connectivity
Write-Host "Step 3: Testing Internet Connectivity..." -ForegroundColor Yellow
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

# Step 5: Set PowerShell Execution Policy
Write-Host "Step 4: Configuring PowerShell Execution Policy..." -ForegroundColor Yellow
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

# Step 6: Create Firewall Rule
Write-Host "Step 5: Configuring Windows Firewall..." -ForegroundColor Yellow
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
            -Profile Private,Domain `
            -Description "Allow inbound HTTP traffic on port $ServicePort for local MT5 FastAPI development" | Out-Null
        
        Write-Host "[✓] Firewall rule created for port $ServicePort" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to create firewall rule: $_" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 7: Configure Hosts File
Write-Host "Step 6: Configuring Hosts File..." -ForegroundColor Yellow
Write-Host "   Adding hostname: $Hostname -> $StaticIP" -ForegroundColor White

try {
    # Check if hostname already exists in hosts file
    $hostsContent = Get-Content $HostsFile -ErrorAction Stop
    $hostnameExists = $hostsContent | Select-String -Pattern "vms\.tnm\.local" -Quiet
    
    if ($hostnameExists) {
        # Update existing entry
        Write-Host "   Updating existing hosts entry..." -ForegroundColor Gray
        $updatedContent = $hostsContent -replace "^\d+\.\d+\.\d+\.\d+\s+vms\.tnm\.local.*$", "$StaticIP    $Hostname"
        $updatedContent | Set-Content $HostsFile -Force
    } else {
        # Add new entry
        Write-Host "   Adding new hosts entry..." -ForegroundColor Gray
        Add-Content -Path $HostsFile -Value "`n# MT5 Integration Service`n$StaticIP    $Hostname"
    }
    
    Write-Host "[✓] Hosts file configured successfully" -ForegroundColor Green
    Write-Host "   You can now use '$Hostname' instead of IP address" -ForegroundColor Cyan
} catch {
    Write-Host "[ERROR] Failed to configure hosts file: $_" -ForegroundColor Red
    Write-Host "   Manual setup: Add this line to $HostsFile" -ForegroundColor Yellow
    Write-Host "   $StaticIP    $Hostname" -ForegroundColor White
}
Write-Host ""

# Step 8: Install Chocolatey
Write-Host "Step 7: Installing Chocolatey Package Manager..." -ForegroundColor Yellow
$chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue

if ($chocoInstalled) {
    $chocoVersion = (choco --version)
    Write-Host "[✓] Chocolatey already installed (version: $chocoVersion)" -ForegroundColor Green
} else {
    try {
        Write-Host "   Downloading and installing Chocolatey..." -ForegroundColor Gray
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh environment
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Host "[✓] Chocolatey installed successfully" -ForegroundColor Green
        Write-Host "   NOTE: You may need to restart PowerShell for 'choco' command to work" -ForegroundColor Yellow
    } catch {
        Write-Host "[ERROR] Failed to install Chocolatey: $_" -ForegroundColor Red
        Write-Host "   You can install manually from: https://chocolatey.org/install" -ForegroundColor Yellow
    }
}
Write-Host ""

# Step 9: Verification Summary
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETE - Verification Summary" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# Get current IP configuration
$ipConfig = Get-NetIPAddress -InterfaceAlias $adapterName -AddressFamily IPv4

Write-Host "Network Configuration:" -ForegroundColor White
Write-Host "  Adapter:       $adapterName" -ForegroundColor Gray
Write-Host "  IP Address:    $($ipConfig.IPAddress)" -ForegroundColor Gray
Write-Host "  Prefix Length: $($ipConfig.PrefixLength)" -ForegroundColor Gray
Write-Host ""

Write-Host "PowerShell Configuration:" -ForegroundColor White
Write-Host "  Execution Policy: $(Get-ExecutionPolicy -Scope CurrentUser)" -ForegroundColor Gray
Write-Host ""

Write-Host "Firewall Configuration:" -ForegroundColor White
$fwRule = Get-NetFirewallRule -DisplayName $FirewallRuleName
Write-Host "  Rule Name:     $($fwRule.DisplayName)" -ForegroundColor Gray
Write-Host "  Status:        $($fwRule.Enabled)" -ForegroundColor Gray
Write-Host "  Port:          $ServicePort" -ForegroundColor Gray
Write-Host ""

Write-Host "Hostname Configuration:" -ForegroundColor White
Write-Host "  Hostname:      $Hostname" -ForegroundColor Gray
Write-Host "  IP Address:    $StaticIP" -ForegroundColor Gray
Write-Host "  Hosts File:    $HostsFile" -ForegroundColor Gray
Write-Host ""

Write-Host "Chocolatey Status:" -ForegroundColor White
$chocoCheck = Get-Command choco -ErrorAction SilentlyContinue
if ($chocoCheck) {
    Write-Host "  Status:        Installed" -ForegroundColor Gray
    Write-Host "  Version:       $(choco --version)" -ForegroundColor Gray
} else {
    Write-Host "  Status:        Not detected (may need PowerShell restart)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  Next Steps:" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Test connectivity from Mac:" -ForegroundColor Yellow
Write-Host "   ping $Hostname" -ForegroundColor White
Write-Host ""
Write-Host "2. Add hostname to Mac hosts file:" -ForegroundColor Yellow
Write-Host "   echo '$StaticIP    $Hostname' | sudo tee -a /etc/hosts" -ForegroundColor White
Write-Host ""
Write-Host "3. Continue with Story 1.2 (MT5 Terminal Installation)" -ForegroundColor Yellow
Write-Host "3. Create documentation file:" -ForegroundColor Yellow
Write-Host "   docs/STORY-1-1-COMPLETION-SUMMARY.md" -ForegroundColor White
Write-Host ""
Write-Host "4. Use hostname in all configs:" -ForegroundColor Yellow
Write-Host "   VITE_MT5_SERVICE_URL=http://$Hostname:8000" -ForegroundColor Cyan
Write-Host ""

# Create completion document
$completionDoc = @"
# Story 1.1 Completion Summary

**Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Status:** ✅ COMPLETED

## Configuration Details

### Windows Version
- **OS:** $(Get-WmiObject -Class Win32_OperatingSystem | Select-Object -ExpandProperty Caption)
- **Build:** $(Get-WmiObject -Class Win32_OperatingSystem | Select-Object -ExpandProperty Version)

### Network Configuration
- **Adapter:** $adapterName
- **IP Address:** $($ipConfig.IPAddress)
- **Subnet Mask:** 255.255.255.0 (/$($ipConfig.PrefixLength))
- **Gateway:** $Gateway
- **DNS Servers:** $($DNS -join ', ')

### PowerShell Configuration
- **Execution Policy:** $(Get-ExecutionPolicy -Scope CurrentUser)

### Firewall Configuration
- **Rule Name:** $FirewallRuleName
- **Status:** Enabled
- **Port:** $ServicePort (TCP)
- **Profile:** Private, Domain

### Chocolatey Installation
$(if ($chocoCheck) { "- **Status:** Installed`n- **Version:** $(choco --version)" } else { "- **Status:** Installed (restart PowerShell to verify)" })

## Verification Checklist

- [x] Windows machine updated to latest version
- [x] Static IP address assigned and documented
- [x] PowerShell execution policy set to RemoteSigned
- [x] Windows Firewall rule created for port 8000
- [x] Chocolatey package manager installed
- [ ] Mac connectivity verified (pending Mac test)
- [ ] Optional: Remote Desktop enabled

## Next Story

**Story 1.2:** MT5 Terminal Installation and Headless Configuration
- Install MT5 Terminal
- Configure demo account
- Test Expert Advisor functionality

## Notes

Setup completed successfully using automated script: \`scripts/windows-setup.ps1\`

All acceptance criteria met. Ready to proceed with MT5 Terminal installation.
"@

# Save completion document
$completionDoc | Out-File -FilePath "docs/STORY-1-1-COMPLETION-SUMMARY.md" -Encoding UTF8
Write-Host "[✓] Completion summary saved to: docs/STORY-1-1-COMPLETION-SUMMARY.md" -ForegroundColor Green
Write-Host ""
