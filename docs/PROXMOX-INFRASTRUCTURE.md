# Proxmox Infrastructure Configuration

**Date Created:** December 4, 2025  
**Status:** Development Environment  
**Access Method:** IP-based (no domain during development)

---

## Network Architecture

### Proxmox Host
- **Local IP (Internal Network):** `172.16.16.1`
- **Public IP (Internet Access):** `142.132.156.162`
- **Access from Mac:** SSH/Web via `142.132.156.162`
- **Web Interface:** `https://142.132.156.162:8006`

### Network Subnets
- **VM Network:** `172.16.16.0/24`
- **Docker Internal:** `172.17.0.0/16` (Docker default bridge)

---

## Virtual Machines

### VM 1: Windows Server 2025 (MT5 + Docker)
- **IP Address:** `172.16.16.20/24`
- **OS:** Windows Server 2025
- **Purpose:** MT5 Terminal + Python FastAPI Service
- **Current Status:**
  - ✅ VM Created
  - ✅ Docker Installed
  - ❌ MT5 Terminal (Not installed yet)
  - ❌ Python Environment (Not configured yet)
  - ❌ FastAPI Service (Not configured yet)
- **Gateway:** `172.16.16.1` (Proxmox)
- **Access:** RDP via Proxmox or SSH tunnel

### VM 2: Docker Host (Supabase)
- **IP Address:** `172.16.16.100/24`
- **OS:** Linux (Ubuntu/Debian)
- **Docker Bridge IP:** `172.17.0.1` (internal)
- **Purpose:** Self-hosted Supabase Stack
- **Current Status:**
  - ✅ VM Created
  - ✅ Docker Installed
  - ✅ Supabase Cloned (`/opt/supabase/`)
  - ❌ Supabase Not Running Yet
- **Gateway:** `172.16.16.1` (Proxmox)
- **Access:** SSH via Proxmox

---

## Development Access Points

### From Mac (Development Machine)
```bash
# SSH to Proxmox Host
ssh root@142.132.156.162

# Access Proxmox Web Interface
https://142.132.156.162:8006

# SSH to Docker VM (via Proxmox)
ssh root@142.132.156.162 -t "pct enter 100"  # If LXC
# OR
ssh root@142.132.156.162  # Then: ssh 172.16.16.100

# RDP to Windows VM (via SSH Tunnel)
ssh -L 3389:172.16.16.20:3389 root@142.132.156.162
# Then RDP to localhost:3389
```

### Service URLs (After Setup)

#### Windows Server 2025 VM (172.16.16.20)
- **MT5 FastAPI Service:** `http://172.16.16.20:8000`
- **Health Check:** `http://172.16.16.20:8000/health`
- **API Docs:** `http://172.16.16.20:8000/docs`

#### Docker VM (172.16.16.100)
- **Supabase API:** `http://172.16.16.100:8000`
- **Supabase Studio:** `http://172.16.16.100:3000`
- **PostgreSQL:** `172.16.16.100:5432` (internal)

#### Access from Mac (via SSH Tunnel)
```bash
# Tunnel to Windows MT5 Service
ssh -L 8000:172.16.16.20:8000 root@142.132.156.162
# Access: http://localhost:8000

# Tunnel to Supabase
ssh -L 8001:172.16.16.100:8000 -L 3000:172.16.16.100:3000 root@142.132.156.162
# Access: http://localhost:8001 (API), http://localhost:3000 (Studio)
```

---

## Environment Variables

### Frontend (.env.local) - Mac Development
```env
# Supabase (via SSH tunnel)
VITE_SUPABASE_URL=http://localhost:8001
VITE_SUPABASE_ANON_KEY=<will-be-generated>

# MT5 Service (via SSH tunnel)
VITE_MT5_SERVICE_URL=http://localhost:8000
VITE_MT5_SERVICE_API_KEY=<will-be-generated>
```

### MT5 Service (.env) - Windows Server 2025
```env
# Supabase Connection (Internal Network)
SUPABASE_URL=http://172.16.16.100:8000
SUPABASE_SERVICE_ROLE_KEY=<will-be-generated>

# Service Configuration
API_PORT=8000
ENVIRONMENT=development
LOG_LEVEL=DEBUG

# MT5 Configuration
MT5_CONNECTION_POOL_SIZE=5
MT5_CONNECTION_TIMEOUT=300
```

### Supabase Stack (.env) - Docker VM
```env
# Database
POSTGRES_PASSWORD=<to-be-generated>
POSTGRES_HOST=172.16.16.100
POSTGRES_PORT=5432

# API URLs (no domain - use IP)
API_EXTERNAL_URL=http://172.16.16.100:8000
SUPABASE_PUBLIC_URL=http://172.16.16.100:8000

# JWT Secrets
JWT_SECRET=<to-be-generated>
ANON_KEY=<to-be-generated>
SERVICE_ROLE_KEY=<to-be-generated>
```

---

## Firewall Configuration

### Proxmox Host Firewall
```bash
# Allow SSH from anywhere
ufw allow 22/tcp

# Allow Proxmox Web Interface
ufw allow 8006/tcp

# Allow access to VM services (if needed externally)
# MT5 Service
ufw allow 8000/tcp

# Supabase API
ufw allow 8001/tcp

# Supabase Studio
ufw allow 3000/tcp
```

### Windows Server 2025 Firewall
```powershell
# Allow MT5 FastAPI Service
New-NetFirewallRule -DisplayName "MT5 FastAPI Service" `
  -Direction Inbound `
  -LocalPort 8000 `
  -Protocol TCP `
  -Action Allow

# Allow RDP (usually enabled by default)
Enable-NetFirewallRule -DisplayGroup "Remote Desktop"
```

---

## Next Steps

### Phase 1: Windows Server 2025 Setup
- [ ] Install MT5 Terminal
- [ ] Configure Python 3.11+ environment
- [ ] Install FastAPI dependencies
- [ ] Create MT5 bridge service
- [ ] Test MT5 connectivity

### Phase 2: Docker VM Setup
- [ ] Configure Supabase environment variables
- [ ] Generate JWT secrets
- [ ] Start Supabase Docker Compose stack
- [ ] Create initial database schema
- [ ] Test Supabase connectivity

### Phase 3: Integration
- [ ] Update frontend for SSH tunnel URLs
- [ ] Test end-to-end connectivity
- [ ] Configure CORS properly
- [ ] Test authentication flow
- [ ] Test MT5 account linking

---

## Security Notes

### Development Phase (Current)
- ✅ All services on internal network (172.16.16.0/24)
- ✅ Access via SSH tunnels from Mac
- ✅ No services exposed to public internet directly
- ⚠️ Using IP addresses (no SSL yet)

### Production Phase (Future)
- 🔄 Add Nginx reverse proxy
- 🔄 Configure domain name
- 🔄 Install SSL certificates
- 🔄 Enable HTTPS everywhere
- 🔄 Harden firewall rules
- 🔄 Enable fail2ban

---

## Troubleshooting

### Cannot Reach Proxmox from Mac
```bash
# Test connectivity
ping 142.132.156.162

# Test SSH
ssh -v root@142.132.156.162

# Check if Proxmox firewall blocking
# Login to Proxmox web interface and check Firewall settings
```

### Cannot Access VMs from Mac
```bash
# SSH into Proxmox first
ssh root@142.132.156.162

# Then from Proxmox, test VM connectivity
ping 172.16.16.20  # Windows VM
ping 172.16.16.100 # Docker VM

# Check VM network configuration
pct list  # List containers
qm list   # List VMs
```

### SSH Tunnel Not Working
```bash
# Create tunnel with verbose output
ssh -v -L 8000:172.16.16.20:8000 root@142.132.156.162

# Test tunnel
curl http://localhost:8000/health

# Keep tunnel alive
ssh -L 8000:172.16.16.20:8000 root@142.132.156.162 -N
```

---

## Commands Reference

### Proxmox Management
```bash
# SSH into Proxmox
ssh root@142.132.156.162

# List all VMs
qm list

# List all containers
pct list

# Access VM console
qm terminal <vm-id>

# Access container shell
pct enter <container-id>

# Check VM status
qm status <vm-id>

# Start/Stop VM
qm start <vm-id>
qm stop <vm-id>
```

### Windows VM Management
```bash
# RDP via SSH tunnel
ssh -L 3389:172.16.16.20:3389 root@142.132.156.162
# Then connect to localhost:3389

# Or via Proxmox console
qm terminal <windows-vm-id>
```

### Docker VM Management
```bash
# SSH to Docker VM
ssh root@142.132.156.162 -t "ssh 172.16.16.100"

# Check Docker status
docker ps
docker compose ps

# View Supabase logs
cd /opt/supabase/docker
docker compose logs -f
```

---

**Last Updated:** December 4, 2025  
**Updated By:** System Configuration  
**Next Review:** After Phase 1 completion
