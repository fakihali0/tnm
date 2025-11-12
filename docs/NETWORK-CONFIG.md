# Network Configuration

**Last Updated:** November 12, 2025

## Windows Machine (MT5 Service Host)

- **Hostname:** `vms.tnm.local` ⭐ (Use this in all configurations)
- **IP Address:** `10.4.0.180`
- **Subnet Mask:** `255.255.255.0`
- **Default Gateway:** `10.4.0.1`
- **DNS Server:** `8.8.8.8`
- **Service Port:** `8000` (FastAPI)

> **Note:** Always use `vms.tnm.local` instead of the IP address. This allows easy IP changes by updating only the hosts file.

## Mac Machine (Frontend Development)

- **IP Assignment:** DHCP (automatic)
- **Network:** Same subnet as Windows (10.4.0.x)
- **Frontend Port:** `5173` (Vite development server)

## Network Setup Commands

### Windows - Configure Hosts File (PowerShell as Admin)

```powershell
# Add hostname to Windows hosts file
Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "`n10.4.0.180    vms.tnm.local"

# Verify
Get-Content C:\Windows\System32\drivers\etc\hosts | Select-String "vms.tnm.local"
```

### Mac - Configure Hosts File

```bash
# Add hostname to Mac hosts file
echo "10.4.0.180    vms.tnm.local" | sudo tee -a /etc/hosts

# Verify
cat /etc/hosts | grep vms.tnm.local
```

### Windows - Configure Static IP (PowerShell as Admin)

```powershell
# Get network adapter name
Get-NetAdapter

# Remove existing IP configuration (if needed)
Remove-NetIPAddress -InterfaceAlias "Ethernet" -Confirm:$false -ErrorAction SilentlyContinue
Remove-NetRoute -InterfaceAlias "Ethernet" -Confirm:$false -ErrorAction SilentlyContinue

# Set static IP
New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress 10.4.0.180 -PrefixLength 24 -DefaultGateway 10.4.0.1

# Set DNS
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("8.8.8.8","8.8.4.4")

# Verify
Get-NetIPAddress -InterfaceAlias "Ethernet" -AddressFamily IPv4
```

### Mac - Test Connectivity

```bash
# Ping test (using hostname)
ping vms.tnm.local

# Service health check (after FastAPI is running)
curl http://vms.tnm.local:8000/health
```

## Hosts File Management

### When IP Address Changes

If the Windows machine IP changes from `10.4.0.180` to a new IP:

**On Windows:**
```powershell
# Edit hosts file
notepad C:\Windows\System32\drivers\etc\hosts

# Update the line:
# OLD: 10.4.0.180    vms.tnm.local
# NEW: <NEW_IP>      vms.tnm.local
```

**On Mac:**
```bash
# Edit hosts file
sudo nano /etc/hosts

# Update the line:
# OLD: 10.4.0.180    vms.tnm.local
# NEW: <NEW_IP>      vms.tnm.local

# Flush DNS cache
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

All code and configurations using `vms.tnm.local` will automatically work with the new IP!

## Firewall Configuration

### Windows Firewall Rule

```powershell
New-NetFirewallRule -DisplayName "MT5 FastAPI Local Dev" `
  -Direction Inbound `
  -LocalPort 8000 `
  -Protocol TCP `
  -Action Allow `
  -Profile Private,Domain `
  -Description "Allow inbound HTTP traffic on port 8000 for local MT5 FastAPI development"
```

## Service URLs

- **Windows Backend:** `http://vms.tnm.local:8000`
- **Mac Frontend:** `http://localhost:5173`
- **Health Endpoint:** `http://vms.tnm.local:8000/health`
- **API Docs:** `http://vms.tnm.local:8000/docs`

> **Environment Variable:** Use `VITE_MT5_SERVICE_URL=http://vms.tnm.local:8000` in your `.env` file

## Migration to VPS (Future)

When moving to VPS in Week 4:
- Replace `10.4.0.180` with public VPS IP
- Add SSL/TLS certificate
- Configure Nginx reverse proxy
- Update firewall to allow Public profile
