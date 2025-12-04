# Network Configuration

**Last Updated:** December 4, 2025  
**Environment:** Proxmox Self-Hosted Infrastructure  
**Access Method:** IP-based (SSH tunnels from Mac)

## Proxmox Host

- **Local IP:** `172.16.16.1` (Internal network)
- **Public IP:** `142.132.156.162` (Internet access)
- **Web Interface:** `https://142.132.156.162:8006`
- **Subnet:** `172.16.16.0/24`

## Windows Server 2025 VM (MT5 Service Host)

- **IP Address:** `172.16.16.20/24`
- **Gateway:** `172.16.16.1`
- **Service Port:** `8000` (FastAPI)
- **Access:** Via SSH tunnel or RDP
- **Service URL (Internal):** `http://172.16.16.20:8000`
- **Service URL (Mac):** `http://localhost:8000` (via tunnel)

## Docker VM (Supabase Host)

- **IP Address:** `172.16.16.100/24`
- **Gateway:** `172.16.16.1`
- **Docker Bridge:** `172.17.0.1` (internal)
- **Supabase API Port:** `8000`
- **Supabase Studio Port:** `3000`
- **Service URL (Internal):** `http://172.16.16.100:8000`
- **Service URL (Mac):** `http://localhost:8001` (via tunnel)

## Mac Machine (Frontend Development)

- **Access to Proxmox:** `142.132.156.162` (SSH/HTTPS)
- **Frontend Port:** `5173` (Vite development server)
- **Access Method:** SSH tunnels to reach internal VMs

## Network Setup Commands

### Mac - Create SSH Tunnels to VMs

```bash
# Tunnel to Windows MT5 Service
ssh -L 8000:172.16.16.20:8000 root@142.132.156.162 -N
# Access MT5 service: http://localhost:8000

# Tunnel to Supabase (API + Studio)
ssh -L 8001:172.16.16.100:8000 -L 3000:172.16.16.100:3000 root@142.132.156.162 -N
# Access Supabase API: http://localhost:8001
# Access Supabase Studio: http://localhost:3000

# Combined tunnel (all services)
ssh -L 8000:172.16.16.20:8000 -L 8001:172.16.16.100:8000 -L 3000:172.16.16.100:3000 root@142.132.156.162 -N
```

### Mac - RDP to Windows VM

```bash
# Create RDP tunnel
ssh -L 3389:172.16.16.20:3389 root@142.132.156.162 -N

# Then connect with Microsoft Remote Desktop to: localhost:3389
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
# Test Proxmox host
ping 142.132.156.162

# SSH into Proxmox
ssh root@142.132.156.162

# From Proxmox, test VMs
ping 172.16.16.20   # Windows VM
ping 172.16.16.100  # Docker VM

# Test services (after SSH tunnel established)
curl http://localhost:8000/health      # MT5 service
curl http://localhost:8001/health      # Supabase API
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
