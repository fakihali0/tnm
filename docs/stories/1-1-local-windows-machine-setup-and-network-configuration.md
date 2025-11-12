# Story 1.1: Local Windows Machine Setup and Network Configuration

**Status:** drafted  
**Epic:** 1 - Foundation & Infrastructure (Local Development)  
**Created:** November 12, 2025  
**Story Key:** 1-1-local-windows-machine-setup-and-network-configuration

---

## Story

As a **backend developer**,  
I want **my local Windows computer configured for MT5 service development with network access from my Mac**,  
So that **I can test the full integration locally before spending money on VPS hosting**.

---

## Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Windows machine is updated to latest version | `winver` shows Windows 10/11 with latest build |
| 2 | Static IP address assigned and documented (e.g., 192.168.1.100) | `ipconfig` shows static IP, IP documented in `.env` file |
| 3 | PowerShell execution policy allows scripts | `Get-ExecutionPolicy` returns `RemoteSigned` or `Unrestricted` |
| 4 | Windows Defender firewall rule created for port 8000 | `Get-NetFirewallRule -DisplayName "MT5 FastAPI Local Dev"` succeeds |
| 5 | Chocolatey package manager installed | `choco --version` returns version number |
| 6 | Mac can ping Windows IP address | `ping 192.168.1.100` from Mac terminal receives responses |
| 7 | (Optional) Remote Desktop enabled for Mac access | Can connect via RDP from Mac using Microsoft Remote Desktop |

---

## Tasks / Subtasks

### Task 1: Windows System Updates and Prerequisites (AC: 1)
- [ ] **1.1** Check current Windows version: Run `winver` command
- [ ] **1.2** Install all pending Windows updates:
  - Settings → Windows Update → Check for updates
  - Install all critical and recommended updates
  - Restart if required
- [ ] **1.3** Verify Windows build is at least:
  - Windows 10: Build 19042 or higher
  - Windows 11: Any build

### Task 2: Network Configuration and Static IP Assignment (AC: 2)
- [ ] **2.1** Document current network configuration:
  ```powershell
  ipconfig /all | Out-File -FilePath "$env:USERPROFILE\Desktop\network-config-before.txt"
  ```
- [ ] **2.2** Identify active network adapter:
  - Look for adapter with IPv4 address (e.g., "Wi-Fi" or "Ethernet")
  - Note current IP (e.g., 192.168.1.100)
  - Note subnet (typically 192.168.1.x or 192.168.0.x)
  - Note gateway IP (typically 192.168.1.1 or 192.168.0.1)
- [ ] **2.3** Assign static IP address:
  - **Method 1 (GUI):**
    - Settings → Network & Internet → Properties (of active adapter)
    - Under "IP assignment" click "Edit"
    - Choose "Manual" and enable IPv4
    - Enter:
      - IP address: `192.168.1.100` (or chosen IP)
      - Subnet prefix length: `24` (255.255.255.0)
      - Gateway: `192.168.1.1` (your router IP)
      - Preferred DNS: `8.8.8.8`
      - Alternate DNS: `8.8.4.4`
    - Save and verify connection still works
  - **Method 2 (PowerShell - Advanced):**
    ```powershell
    # Get network adapter name
    Get-NetAdapter | Where-Object {$_.Status -eq "Up"}
    
    # Set static IP (replace InterfaceAlias with your adapter name)
    New-NetIPAddress -InterfaceAlias "Wi-Fi" -IPAddress 192.168.1.100 -PrefixLength 24 -DefaultGateway 192.168.1.1
    Set-DnsClientServerAddress -InterfaceAlias "Wi-Fi" -ServerAddresses ("8.8.8.8","8.8.4.4")
    ```
- [ ] **2.4** Verify static IP assignment:
  ```powershell
  ipconfig
  # Should show 192.168.1.100 (or your chosen IP)
  ```
- [ ] **2.5** Test internet connectivity after static IP:
  ```powershell
  Test-NetConnection google.com
  # Should show "PingSucceeded : True"
  ```
- [ ] **2.6** Document IP address in project notes:
  - Create file: `docs/DEVELOPMENT-IPS.md`
  - Content:
    ```markdown
    # Development IP Addresses
    
    **Windows Machine (MT5 Service):** 192.168.1.100
    **Mac Machine (Frontend):** [Auto-assigned by DHCP]
    
    **Router Gateway:** 192.168.1.1
    **DNS Servers:** 8.8.8.8, 8.8.4.4
    
    Last updated: [Current Date]
    ```

### Task 3: PowerShell Configuration (AC: 3)
- [ ] **3.1** Check current execution policy:
  ```powershell
  Get-ExecutionPolicy
  ```
- [ ] **3.2** Set execution policy for current user (if not already set):
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
  - When prompted, type `Y` and press Enter
- [ ] **3.3** Verify execution policy:
  ```powershell
  Get-ExecutionPolicy -Scope CurrentUser
  # Should return "RemoteSigned"
  ```

### Task 4: Windows Defender Firewall Configuration (AC: 4)
- [ ] **4.1** Create firewall rule for port 8000 (FastAPI):
  ```powershell
  New-NetFirewallRule -DisplayName "MT5 FastAPI Local Dev" `
    -Direction Inbound `
    -LocalPort 8000 `
    -Protocol TCP `
    -Action Allow `
    -Profile Private,Domain `
    -Description "Allow inbound HTTP traffic on port 8000 for local MT5 FastAPI development"
  ```
- [ ] **4.2** Verify firewall rule created:
  ```powershell
  Get-NetFirewallRule -DisplayName "MT5 FastAPI Local Dev" | Format-List
  ```
  - Should show rule details with Enabled: True
- [ ] **4.3** Test firewall rule (optional - requires netcat):
  ```powershell
  # Install netcat via Chocolatey (if available)
  choco install netcat -y
  
  # Test port listening
  nc -l -p 8000
  # Then from Mac: curl http://192.168.1.100:8000
  ```

### Task 5: Chocolatey Package Manager Installation (AC: 5)
- [ ] **5.1** Check if Chocolatey already installed:
  ```powershell
  choco --version
  ```
  - If version number appears, skip to 5.3
- [ ] **5.2** Install Chocolatey:
  ```powershell
  Set-ExecutionPolicy Bypass -Scope Process -Force
  [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
  iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
  ```
  - Wait for installation to complete (1-2 minutes)
- [ ] **5.3** Close and reopen PowerShell (to refresh PATH)
- [ ] **5.4** Verify Chocolatey installation:
  ```powershell
  choco --version
  # Should show version like "2.3.0"
  ```
- [ ] **5.5** Update Chocolatey to latest version:
  ```powershell
  choco upgrade chocolatey -y
  ```

### Task 6: Connectivity Testing from Mac (AC: 6)
- [ ] **6.1** Test basic connectivity from Mac terminal:
  ```bash
  ping 192.168.1.100
  ```
  - Expected: `64 bytes from 192.168.1.100: icmp_seq=0 ttl=128 time=X.XXX ms`
  - Stop with Ctrl+C after 5-10 successful pings
- [ ] **6.2** Test network route from Mac:
  ```bash
  traceroute 192.168.1.100
  ```
  - Should show 1-2 hops (Mac → Router → Windows)
- [ ] **6.3** Document successful connectivity in project notes:
  - Add to `docs/DEVELOPMENT-IPS.md`:
    ```markdown
    ## Connectivity Test Results
    
    - Ping Mac → Windows: ✅ Success (avg latency: X.XX ms)
    - Tested: [Current Date]
    ```

### Task 7: Optional - Enable Remote Desktop (AC: 7)
- [ ] **7.1** Enable Remote Desktop on Windows:
  - Settings → System → Remote Desktop
  - Toggle "Enable Remote Desktop" to On
  - Click "Confirm" on security prompt
- [ ] **7.2** Note Windows username and password for RDP
- [ ] **7.3** Install Microsoft Remote Desktop on Mac:
  - Download from Mac App Store (free)
  - Or download from: https://apps.apple.com/app/microsoft-remote-desktop/id1295203466
- [ ] **7.4** Test RDP connection from Mac:
  - Open Microsoft Remote Desktop
  - Click "+" → Add PC
  - PC name: `192.168.1.100`
  - User account: Add Windows username/password
  - Connect and verify desktop appears

### Task 8: Documentation and Final Verification
- [ ] **8.1** Create summary document:
  - File: `docs/STORY-1-1-COMPLETION-SUMMARY.md`
  - Include:
    - Windows version
    - Static IP address
    - Firewall rule name
    - Chocolatey version
    - Ping test results
    - RDP status (enabled/disabled)
- [ ] **8.2** Take screenshot of successful `ipconfig` output
- [ ] **8.3** Take screenshot of successful Mac ping test
- [ ] **8.4** Verify all acceptance criteria met:
  ```powershell
  # Run verification script
  Write-Host "Windows Version:" -ForegroundColor Cyan
  winver
  
  Write-Host "`nStatic IP:" -ForegroundColor Cyan
  Get-NetIPAddress -InterfaceAlias "Wi-Fi" -AddressFamily IPv4
  
  Write-Host "`nExecution Policy:" -ForegroundColor Cyan
  Get-ExecutionPolicy
  
  Write-Host "`nFirewall Rule:" -ForegroundColor Cyan
  Get-NetFirewallRule -DisplayName "MT5 FastAPI Local Dev"
  
  Write-Host "`nChocolatey Version:" -ForegroundColor Cyan
  choco --version
  ```

---

## Dev Notes

### Environment Configuration
This story establishes the foundational network and system configuration for local MT5 development. The Windows machine will serve as the backend host running:
- FastAPI service (port 8000)
- MT5 Terminal (configured in Story 1.2)
- Python 3.11 runtime (configured in Story 1.3)

### Cost Optimization
By using local Windows hardware instead of VPS:
- **Development cost:** $0 (weeks 1-3)
- **VPS cost avoided:** €45-75 (3 months @ €15-25/month)
- **Risk reduction:** Validate everything before production deployment

### Network Architecture
```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Mac (Frontend) │────────▶│ Windows Computer │────────▶│  MT5 Terminal   │
│  localhost:5173 │  HTTP   │  192.168.1.100   │  Python │  (Demo Broker)  │
│                 │         │  :8000           │  API    │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

- **Local network traffic only** - no public exposure during development
- **Firewall scope:** Private and Domain profiles (not Public)
- **Port 8000:** HTTP only - SSL/TLS will be added during VPS migration (Week 4)

### Security Considerations
- Static IP assignment is safe for local network (192.168.x.x is non-routable)
- Firewall rule limited to TCP port 8000
- PowerShell execution policy `RemoteSigned` requires downloaded scripts to be signed
- RDP (if enabled) is local network only - router should block external RDP access

### Testing Standards
All connectivity tests use standard networking tools:
- `ping` for ICMP reachability
- `ipconfig` for IP configuration verification
- `Test-NetConnection` for advanced connectivity testing
- No custom tools required

### Project Structure Notes
This story creates the following documentation files:
- `docs/DEVELOPMENT-IPS.md` - IP address inventory
- `docs/STORY-1-1-COMPLETION-SUMMARY.md` - Setup verification results

These files will be referenced by subsequent stories (1.2-1.8) for IP configuration.

### References
- **[Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Step-1]** - Complete network configuration instructions
- **[Source: docs/technical/WINDOWS-DEPLOYMENT-GUIDE.md#2-Initial-Windows-Setup]** - Windows system preparation (adapted for local dev)
- **[Source: docs/epics.md#Story-1.1]** - Original acceptance criteria and business requirements
- **[Source: docs/PRD-MT5-Integration-Service.md#Technical-Stack]** - Platform requirements (Windows 10/11)

### Future Migration Path
When migrating to VPS (Story 4.x in Epic 1 - Phase 2):
1. Same setup applies with public IP instead of 192.168.1.100
2. Firewall rule will need Public profile added
3. Nginx will be added as reverse proxy
4. SSL/TLS certificate will be configured
5. Windows Service (NSSM) will replace manual startup

---

## Dev Agent Record

### Context Reference
**Story Context XML:** `docs/stories/1-1-local-windows-machine-setup-and-network-configuration.context.xml`

This context file contains:
- Complete acceptance criteria with verification commands
- Relevant documentation artifacts (LOCAL-DEVELOPMENT-GUIDE.md, epics.md, PRD)
- PowerShell command interfaces for network, firewall, and execution policy
- Development constraints (network requirements, security, cost optimization)
- 8 test scenarios with expected outputs
- Dependency specifications (Windows, PowerShell, Chocolatey)

### Agent Model Used
_To be filled by Dev Agent during implementation_

### Debug Log References
_To be filled by Dev Agent if issues encountered_

### Completion Notes List
_To be filled by Dev Agent upon story completion:_
- [ ] Windows version and build number
- [ ] Assigned static IP address
- [ ] Firewall rule verification
- [ ] Chocolatey installation path
- [ ] Mac connectivity test results
- [ ] RDP enabled (yes/no)
- [ ] Any deviations from planned approach
- [ ] Recommendations for Story 1.2

### File List
_To be filled by Dev Agent - files created/modified:_
- NEW: `docs/DEVELOPMENT-IPS.md`
- NEW: `docs/STORY-1-1-COMPLETION-SUMMARY.md`
- MODIFIED: (none expected)

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-12 | 1.0 | Initial draft created by create-story workflow | AF (via BMad Master) |
