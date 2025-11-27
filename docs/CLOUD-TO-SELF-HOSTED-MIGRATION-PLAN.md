# Cloud to Self-Hosted Migration Plan

**Project:** TNM AI Trading Platform  
**Migration:** Supabase Cloud → Self-Hosted Infrastructure  
**Target Server:** 256GB RAM Server with Proxmox VE  
**Timeline:** 5-7 weeks  
**Status:** Planning Phase  

---

## Executive Summary

### Current State
- **Frontend:** React/Vite (likely on Vercel/Netlify)
- **Backend:** Supabase Cloud (https://edzkorfdixvvvrkfzqzg.supabase.co)
- **MT5 Service:** Self-hosted (already on local server)
- **Users:** Early stage, growing
- **Cost:** ~$25-100/month for Supabase

### Target State
- **All services on one 256GB RAM Server with Proxmox VE:**
  - Proxmox VE hypervisor (~2GB RAM)
  - Supabase stack in LXC containers (native Linux Docker)
  - 10 Windows VMs for MT5 terminals (40GB RAM total)
  - Nginx reverse proxy (LXC container)
  - Frontend static files served by Nginx
  - Zero monthly cloud costs

### Benefits
- ✅ **Cost savings:** $25-100/month → $0/month (no Windows Server licenses needed)
- ✅ **Full control:** Complete data ownership
- ✅ **Better performance:** Native Linux containers, lower overhead
- ✅ **Scalability:** Can handle 1,000+ concurrent users
- ✅ **Data sovereignty:** All data on your hardware
- ✅ **Enterprise features:** Snapshots, backups, live migration, clustering
- ✅ **Resource efficiency:** ~30% less RAM usage vs Docker-in-Windows

### Risks & Mitigation
- ⚠️ **Downtime during migration** → Use blue-green deployment
- ⚠️ **Data loss risk** → Multiple backups, verify before cutover
- ⚠️ **Complexity increase** → Comprehensive documentation & monitoring
- ⚠️ **No managed backups** → Implement automated backup system

---

## Phase 0: Proxmox Installation (Week 1)

### 0.1 Download Proxmox VE

#### Download ISO:
```powershell
# Download Proxmox VE ISO (latest version)
# Visit: https://www.proxmox.com/en/downloads
# Download: proxmox-ve_X.X-X.iso

Invoke-WebRequest -Uri "https://www.proxmox.com/en/downloads" `
    -OutFile "C:\Downloads\proxmox-ve.iso"
```

#### Create Bootable USB:
```powershell
# Use Rufus or Etcher to create bootable USB
# Download Rufus: https://rufus.ie/

# Or use PowerShell (requires admin):
$USBDrive = "D:"  # Change to your USB drive
Mount-DiskImage -ImagePath "C:\Downloads\proxmox-ve.iso" -PassThru | 
    Get-Volume | 
    Copy-Item -Destination $USBDrive -Recurse
```

#### Deliverables:
- Proxmox VE ISO downloaded
- Bootable USB created
- Server ready for installation

---

### 0.2 Install Proxmox VE

#### Installation Steps:
```
1. Boot server from USB
2. Select "Install Proxmox VE (Graphical)"
3. Accept EULA
4. Select target disk (2TB+ NVMe recommended)
5. Configure:
   - Country: [Your country]
   - Timezone: [Your timezone]
   - Keyboard layout: [Your layout]
6. Set password for root user (SAVE THIS!)
7. Configure network:
   - Management interface: First NIC
   - Hostname: pve.yourdomain.com
   - IP Address: 192.168.1.100/24 (static)
   - Gateway: 192.168.1.1
   - DNS: 8.8.8.8
8. Confirm and install (takes 5-10 minutes)
9. Reboot
```

#### Post-Installation Configuration:
```bash
# Access web interface: https://192.168.1.100:8006
# Login: root / [your-password]

# Update system
apt update && apt upgrade -y

# Remove subscription nag (optional, for non-enterprise)
sed -Ezi.bak "s/(Ext.Msg.show\(\{[^}]*)*\}\/\*\)//g" \
    /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js
systemctl restart pveproxy
```

#### Deliverables:
- Proxmox VE installed and accessible
- System updated to latest version
- Web interface accessible at https://192.168.1.100:8006

---

### 0.3 Configure Storage

#### Create Storage Directories:
```bash
# SSH into Proxmox host (or use web shell)

# Create directories for different storage types
mkdir -p /mnt/tnm-data/postgres
mkdir -p /mnt/tnm-data/storage
mkdir -p /mnt/tnm-data/backups
mkdir -p /mnt/tnm-data/containers
mkdir -p /mnt/tnm-data/vms

# Set permissions
chown -R root:root /mnt/tnm-data
chmod -R 755 /mnt/tnm-data
```

#### Add Storage to Proxmox:
```bash
# Add directory storage for containers and VMs
pvesm add dir tnm-data \
    --path /mnt/tnm-data \
    --content images,rootdir,vztmpl,backup,iso

# Verify storage
pvesm status
```

#### Deliverables:
- Storage directories created
- Proxmox storage configured
- Ready for VM/container deployment

---

### 0.4 Network Configuration

#### Create Linux Bridge for VMs:
```bash
# Edit network configuration
vi /etc/network/interfaces

# Add bridge for VM network
auto vmbr1
iface vmbr1 inet static
    address 10.0.0.1/24
    bridge-ports none
    bridge-stp off
    bridge-fd 0
    post-up echo 1 > /proc/sys/net/ipv4/ip_forward
    post-up iptables -t nat -A POSTROUTING -s '10.0.0.0/24' -o vmbr0 -j MASQUERADE
    post-down iptables -t nat -D POSTROUTING -s '10.0.0.0/24' -o vmbr0 -j MASQUERADE

# Restart networking
systemctl restart networking
```

#### Configure Firewall:
```bash
# Enable firewall
pve-firewall start

# Allow web interface
pve-firewall localnet add 192.168.1.0/24

# Allow specific ports
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 8006/tcp  # Proxmox web
ufw allow 5432/tcp  # PostgreSQL (if needed externally)
```

#### Deliverables:
- Network bridge configured for VMs
- NAT enabled for VM internet access
- Firewall configured

---

## Phase 1: Pre-Migration Preparation (Week 2)

### 1.1 Current State Assessment

#### Action Items:
- [ ] **Document current Supabase usage**
  ```bash
  # Get database size
  SELECT pg_size_pretty(pg_database_size('postgres'));
  
  # Count tables
  SELECT count(*) FROM information_schema.tables 
  WHERE table_schema = 'public';
  
  # Count users
  SELECT count(*) FROM auth.users;
  ```

- [ ] **Inventory all Supabase features in use**
  - [ ] Authentication (email, social login, etc.)
  - [ ] Database (Postgres tables, RLS policies)
  - [ ] Realtime subscriptions
  - [ ] Storage (files/images)
  - [ ] Edge Functions
  - [ ] PostgREST API endpoints

- [ ] **Document current architecture**
  ```
  Current URLs:
  - Supabase API: https://edzkorfdixvvvrkfzqzg.supabase.co
  - Supabase Anon Key: eyJhb...
  - MT5 Service: [Document current URL]
  - Frontend: [Document current hosting]
  ```

- [ ] **Measure current performance baselines**
  - API response times
  - Database query performance
  - Concurrent user capacity
  - Storage usage

#### Deliverables:
- `CURRENT-ARCHITECTURE.md` - Full system documentation
- `SUPABASE-FEATURE-INVENTORY.md` - All features being used
- `PERFORMANCE-BASELINE.md` - Current metrics

---

### 1.2 Server Preparation

#### Hardware Verification:
```
Server Specs Required:
├── RAM: 256GB ✅ (You have this)
├── CPU: 16+ cores recommended
├── Disk: 2TB+ NVMe SSD recommended
├── Network: 1 Gbps minimum
└── Hypervisor: Proxmox VE 8.x ✅ (Installed in Phase 0)
```

#### Resource Allocation Plan:
```
Total: 256GB RAM, All CPU cores

Proxmox Host (GUI): 2GB RAM, 2 cores (reserved)
├── LXC 100: Supabase Stack (Docker Compose) (48GB RAM, 12 cores)
│   ├── Postgres (32GB)
│   ├── Kong/PostgREST (4GB)
│   ├── Auth/GoTrue (2GB)
│   ├── Realtime (4GB)
│   ├── Storage (4GB)
│   └── Studio (2GB)
├── LXC 101: Nginx Reverse Proxy (1GB RAM, 1 core)
├── LXC 102: Monitoring (Grafana/Prometheus) (4GB RAM, 2 cores)
├── LXC 103: MT5 Coordinator Service (4GB RAM, 2 cores)
├── VM 201-210: Windows Server 2025 Core MT5 Terminals (30GB RAM total, 20 cores)
│   └── 3GB per VM (Core = 50-60% less RAM vs GUI)
└── Buffer: 167GB RAM available for scaling (65% headroom!)
```

#### Deliverables:
- Resource allocation documented
- Proxmox ready for container/VM creation
- Storage and networking configured

---

### 1.3 Backup Strategy

#### Create Full Supabase Backup:
```bash
# 1. Database backup
pg_dump -h db.edzkorfdixvvvrkfzqzg.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f "supabase_backup_$(date +%Y%m%d_%H%M%S).dump"

# 2. Schema only backup (for reference)
pg_dump -h db.edzkorfdixvvvrkfzqzg.supabase.co \
  -U postgres \
  -d postgres \
  --schema-only \
  -f "supabase_schema_$(date +%Y%m%d_%H%M%S).sql"

# 3. Auth users backup
psql -h db.edzkorfdixvvvrkfzqzg.supabase.co -U postgres -d postgres -c \
  "COPY (SELECT * FROM auth.users) TO STDOUT WITH CSV HEADER" > auth_users_backup.csv
```

#### Backup Verification:
- [ ] **Verify backup integrity**
  ```bash
  # Test restore to temporary database
  pg_restore --list supabase_backup_*.dump
  ```

- [ ] **Document all storage files**
  ```javascript
  // List all files in Supabase Storage
  const { data: buckets } = await supabase.storage.listBuckets();
  for (const bucket of buckets) {
    const { data: files } = await supabase.storage.from(bucket.name).list();
    console.log(`Bucket: ${bucket.name}, Files: ${files.length}`);
  }
  ```

#### Deliverables:
- `supabase_backup_YYYYMMDD.dump` - Full database backup
- `supabase_schema.sql` - Schema documentation
- `auth_users_backup.csv` - User accounts backup
- Storage files inventory

---

## Phase 2: Self-Hosted Infrastructure Setup (Week 3)

### 2.1 Create Supabase LXC Container

#### Download Debian Template:
```bash
# In Proxmox web shell or SSH
pveam update
pveam download local debian-12-standard_12.2-1_amd64.tar.zst
```

#### Create Supabase Container (LXC 100):
```bash
# Single container for entire Supabase Docker Compose stack
pct create 100 local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst \
    --hostname supabase \
    --memory 49152 \
    --cores 12 \
    --rootfs local-lvm:150 \
    --net0 name=eth0,bridge=vmbr1,ip=10.0.0.10/24,gw=10.0.0.1 \
    --nameserver 8.8.8.8 \
    --features nesting=1 \
    --unprivileged 1

# Start container
pct start 100

# Enter container and install Docker
pct enter 100
apt update && apt upgrade -y
apt install -y curl gnupg lsb-release git
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker
```

#### Create Additional Support Containers:
```bash
# Nginx Reverse Proxy (LXC 101)
pct create 101 local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst \
    --hostname nginx-proxy \
    --memory 1024 --cores 1 \
    --rootfs local-lvm:10 \
    --net0 name=eth0,bridge=vmbr0,ip=192.168.1.105/24,gw=192.168.1.1 \
    --nameserver 8.8.8.8 --unprivileged 1
pct start 101

# Install Nginx
pct exec 101 -- bash -c 'apt update && apt install -y nginx certbot python3-certbot-nginx'

# Monitoring (LXC 102)
pct create 102 local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst \
    --hostname monitoring \
    --memory 4096 --cores 2 \
    --rootfs local-lvm:30 \
    --net0 name=eth0,bridge=vmbr1,ip=10.0.0.16/24,gw=10.0.0.1 \
    --nameserver 8.8.8.8 --features nesting=1 --unprivileged 1
pct start 102

# Install Docker for monitoring stack
pct exec 102 -- bash -c '
    apt update && apt install -y curl gnupg lsb-release && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list && \
    apt update && \
    apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin && \
    systemctl enable --now docker
'

# MT5 Coordinator (LXC 103)
pct create 103 local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst \
    --hostname mt5-coordinator \
    --memory 4096 --cores 2 \
    --rootfs local-lvm:20 \
    --net0 name=eth0,bridge=vmbr1,ip=10.0.0.20/24,gw=10.0.0.1 \
    --nameserver 8.8.8.8 --unprivileged 1
pct start 103

# Install Python for MT5 service
pct exec 103 -- bash -c 'apt update && apt install -y python3 python3-pip python3-venv git'
```

#### Deploy Supabase Stack:
```bash
# Enter Supabase container (LXC 100)
pct enter 100

# Clone official Supabase repository
cd /opt
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Copy example environment file
cp .env.example .env

# Generate secrets
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
ANON_KEY=$(openssl rand -base64 32)
SERVICE_ROLE_KEY=$(openssl rand -base64 32)

# Update .env file
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
sed -i "s/ANON_KEY=.*/ANON_KEY=$ANON_KEY/" .env
sed -i "s/SERVICE_ROLE_KEY=.*/SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY/" .env
```
############
# Secrets
############
POSTGRES_PASSWORD=<your-super-secret-postgres-password>
JWT_SECRET=<your-super-secret-jwt-token-with-at-least-32-characters>
ANON_KEY=<generate-via-supabase.com/docs/guides/hosting/overview#api-keys>
SERVICE_ROLE_KEY=<generate-via-supabase.com/docs/guides/hosting/overview#api-keys>

############
# Database
############
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432

############
# API
############
API_EXTERNAL_URL=https://yourdomain.com
SUPABASE_PUBLIC_URL=https://yourdomain.com

############
# Auth
############
SITE_URL=https://yourdomain.com
ADDITIONAL_REDIRECT_URLS=
JWT_EXPIRY=3600
DISABLE_SIGNUP=false

############
# Email (SMTP)
############
SMTP_ADMIN_EMAIL=admin@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SENDER_NAME=TNM AI Platform

############
# Storage
############
STORAGE_BACKEND=file
FILE_SIZE_LIMIT=52428800
```

#### Start Supabase Stack:
```bash
# In LXC 100 (/opt/supabase/docker)
docker compose up -d
```

#### Verify Services:
```bash
# Check all services are running
docker compose ps

# Expected services:
# - supabase-db (Postgres)
# - supabase-auth (GoTrue)
# - supabase-rest (PostgREST)
# - supabase-realtime
# - supabase-storage
# - supabase-kong (API Gateway)
# - supabase-studio (Admin UI)
```

#### Access Supabase Studio:
```
URL: http://10.0.0.10:8000 (from Proxmox network)
Or: http://192.168.1.100:8000 (if port forwarded)
Default credentials: Check .env file
```

#### Deliverables:
- All LXC containers created and running
- Docker installed in each container
- Supabase stack running in LXC 100
- All services healthy
- Admin access confirmed

---

### 2.2 Restore Database

#### Import Schema:
```bash
# Copy backup to container (from Proxmox host)
pct push 100 /path/to/supabase_backup_*.dump /tmp/supabase_backup.dump

# Or upload via SCP to Proxmox first, then push
# Enter container
pct enter 100

# Restore database
docker exec -i supabase-db pg_restore \
  -U postgres \
  -d postgres \
  -v \
  /tmp/supabase_backup.dump
```

#### Verify Data Integrity:
```sql
-- Connect to database
docker exec -it supabase-db psql -U postgres

-- Verify tables
\dt

-- Count records in key tables
SELECT 'users' as table_name, count(*) FROM auth.users
UNION ALL
SELECT 'trading_accounts', count(*) FROM public.trading_accounts
UNION ALL
SELECT 'trades', count(*) FROM public.trades;

-- Verify schema matches
\d trading_accounts
\d trades
```

#### Fix Sequences (if needed):
```sql
-- Reset sequences after restore
SELECT setval('trading_accounts_id_seq', 
  (SELECT MAX(id) FROM trading_accounts));
SELECT setval('trades_id_seq', 
  (SELECT MAX(id) FROM trades));
```

#### Deliverables:
- Database fully restored
- All tables present
- Record counts match backup
- Sequences reset

---

### 2.3 Configure MT5 Terminals

#### Download Windows Server 2025 ISO:
```bash
# On Proxmox host, download Windows Server 2025 ISO
cd /var/lib/vz/template/iso
wget https://software-download.microsoft.com/... # Your licensed ISO link
# Or upload via web interface: Datacenter > local > ISO Images > Upload

# Note: Use Windows Server 2025 Standard/Datacenter Core edition
# Core = No GUI, 50-60% less RAM, better for 24/7 operations
```

#### Create Windows Server 2025 Core VMs:
```bash
# Create first VM (201) - 3GB RAM for Core edition
qm create 201 \
    --name mt5-terminal-1 \
    --memory 3072 \
    --cores 2 \
    --sockets 1 \
    --cpu host \
    --net0 virtio,bridge=vmbr1 \
    --scsihw virtio-scsi-pci \
    --scsi0 local-lvm:40 \
    --ide2 local:iso/windows-server-2025.iso,media=cdrom \
    --boot order=scsi0;ide2 \
    --ostype win11 \
    --agent 1

# Clone for other 9 terminals
for i in {202..210}; do
    # Create VM (will need Windows install on each)
    qm create $i \
        --name mt5-terminal-$((i-200)) \
        --memory 3072 --cores 2 --sockets 1 --cpu host \
        --net0 virtio,bridge=vmbr1 \
        --scsihw virtio-scsi-pci \
        --scsi0 local-lvm:40 \
        --ide2 local:iso/windows-server-2025.iso,media=cdrom \
        --boot order=scsi0;ide2 \
        --ostype win11 --agent 1
done

# Start first VM for installation
qm start 201

# Access console via web interface or:
qm terminal 201
```

#### Install Windows Server 2025 Core in Each VM:
```
1. Access VM console via Proxmox web interface
2. Follow Windows Server installation wizard
3. Choose "Windows Server 2025 Standard/Datacenter (Desktop Experience)" - CORE option
4. After install, Server Core boots to command prompt (no GUI)
5. Configure via PowerShell:
   - Rename-Computer -NewName "MT5-TERMINAL-1" -Restart
   - New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress 10.0.0.201 -PrefixLength 24
   - Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses 8.8.8.8
6. Enable Remote Desktop (already enabled by default in Server):
   - Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name "fDenyTSConnections" -Value 0
   - Enable-NetFirewallRule -DisplayGroup "Remote Desktop"
7. Install VirtIO drivers if needed
8. Windows Update and activate
```

#### Install MT5 in Each VM (Server Core):
```powershell
# PowerShell script to run inside each VM
# RDP into each VM from Proxmox host or use noVNC console

# Create temp directory
New-Item -Path "C:\Temp" -ItemType Directory -Force

# Download MT5
Invoke-WebRequest -Uri "https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe" `
    -OutFile "C:\Temp\mt5setup.exe"

# Silent install (works on Server Core without GUI)
Start-Process "C:\Temp\mt5setup.exe" -ArgumentList "/auto" -Wait

# Install Python
Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.11.0/python-3.11.0-amd64.exe" `
    -OutFile "C:\Temp\python-installer.exe"
Start-Process "C:\Temp\python-installer.exe" -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1" -Wait

# Install MetaTrader5 package (Python API works headless on Core)
pip install MetaTrader5

# Install FastAPI bridge
pip install fastapi uvicorn

# NOTE: MT5 Python API runs headless on Server Core
# Only RDP in when initial MT5 account configuration needed
# After setup, MT5 runs 24/7 without GUI
```

#### Configure MT5 Bridge Service:
```python
# C:\MT5-Bridge\app.py in each VM
import MetaTrader5 as mt5
from fastapi import FastAPI, HTTPException
import uvicorn

app = FastAPI()

@app.on_event("startup")
async def startup():
    if not mt5.initialize():
        raise Exception("MT5 initialization failed")
    print(f"✅ MT5 initialized: {mt5.version()}")

@app.get("/health")
async def health():
    account_info = mt5.account_info()
    return {
        "status": "ok" if account_info else "error",
        "version": mt5.version()
    }

@app.post("/login")
async def login(account: int, password: str, server: str):
    success = mt5.login(account, password, server)
    if not success:
        raise HTTPException(400, detail=f"Login failed: {mt5.last_error()}")
    return {"status": "success", "account": account}

@app.get("/positions")
async def get_positions():
    positions = mt5.positions_get()
    return {"positions": [p._asdict() for p in (positions or [])]}

if __name__ == "__main__":
    # Run on unique port per VM
    uvicorn.run(app, host="0.0.0.0", port=9000)
```

#### Create Windows Service:
```powershell
# Install Chocolatey (if not already installed on Core)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install NSSM (Non-Sucking Service Manager)
choco install nssm -y

# Create service
nssm install MT5Bridge "C:\Python311\python.exe" "C:\MT5-Bridge\app.py"
nssm set MT5Bridge AppDirectory "C:\MT5-Bridge"
nssm set MT5Bridge Start SERVICE_AUTO_START
nssm start MT5Bridge

# BENEFIT: Server Core services are more stable
# No GUI means no explorer.exe crashes, no user logoff issues
# Perfect for 24/7 MT5 terminal operations
```

#### Deliverables:
- 10 VMs running Windows Server 2025 Core (30GB RAM total vs 45-50GB with GUI)
- MT5 installed and configured in each (headless operation)
- FastAPI bridge running on each VM as Windows Service
- All services auto-start on boot
- RDP access configured for management when needed
- 50-60% RAM savings per VM = 17GB freed for scaling!

---

### 2.4 Setup Nginx Reverse Proxy

#### Configure Nginx in LXC 105:
```bash
# Enter Nginx container
pct enter 105

# Create Nginx configuration
cat > /etc/nginx/sites-available/tnm << 'EOF'
upstream supabase_api {
    server 10.0.0.10:8000;  # LXC 100 - Supabase Docker Compose stack
}

upstream mt5_coordinator {
    server 10.0.0.20:8001;  # LXC 103 - MT5 Coordinator
}

server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    
    # Supabase API
    location /api/ {
        proxy_pass http://supabase_api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Supabase Realtime
    location /realtime/ {
        proxy_pass http://supabase_api/realtime/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
    
    # MT5 Service
    location /mt5/ {
        proxy_pass http://mt5_coordinator/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Frontend static files
    location / {
        root /var/www/tnm/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/tnm /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Create web root
mkdir -p /var/www/tnm/dist

# Restart Nginx
systemctl restart nginx
systemctl enable nginx
```

#### Setup SSL with Let's Encrypt:
```bash
# Still in LXC 105
# Obtain certificate
certbot --nginx -d yourdomain.com \
    --non-interactive \
    --agree-tos \
    --email admin@yourdomain.com

# Verify auto-renewal
systemctl status certbot.timer
certbot renew --dry-run
```

#### Port Forwarding on Proxmox Host:
```bash
# On Proxmox host, forward ports to Nginx container
iptables -t nat -A PREROUTING -i vmbr0 -p tcp --dport 80 -j DNAT --to 192.168.1.105:80
iptables -t nat -A PREROUTING -i vmbr0 -p tcp --dport 443 -j DNAT --to 192.168.1.105:443

# Save iptables rules
apt install iptables-persistent
netfilter-persistent save
```

#### Deliverables:
- Nginx configured in LXC 105
- SSL certificates installed
- Port forwarding configured
- All services accessible via domain

---

## Phase 3: Application Migration (Week 4)

### 3.1 Update MT5 Service Configuration

#### Update Environment Variables:
```bash
# MT5 service runs in LXC 103 (created in Phase 2.1)
# Install MT5 service
pct exec 103 -- bash -c '
    cd /opt && \
    git clone <your-mt5-service-repo> mt5-service && \
    cd mt5-service && \
    python3 -m venv venv && \
    source venv/bin/activate && \
    pip install -r requirements.txt
'
```

#### Update .env Configuration:
```python
# /opt/mt5-service/.env

# OLD (Supabase Cloud)
SUPABASE_URL=https://edzkorfdixvvvrkfzqzg.supabase.co
SUPABASE_KEY=eyJhbGc...

# NEW (Self-hosted on Proxmox)
SUPABASE_URL=http://10.0.0.10:8000
SUPABASE_KEY=<your-new-service-role-key>

# MT5 Terminal Pool Configuration (VM IP addresses)
MT5_TERMINALS=[
    {"host": "10.0.0.201", "port": 9000},
    {"host": "10.0.0.202", "port": 9000},
    {"host": "10.0.0.203", "port": 9000},
    {"host": "10.0.0.204", "port": 9000},
    {"host": "10.0.0.205", "port": 9000},
    {"host": "10.0.0.206", "port": 9000},
    {"host": "10.0.0.207", "port": 9000},
    {"host": "10.0.0.208", "port": 9000},
    {"host": "10.0.0.209", "port": 9000},
    {"host": "10.0.0.210", "port": 9000}
]
```

#### Test MT5 Service Connectivity:
```bash
# In LXC 103
cd /opt/mt5-service
source venv/bin/activate

# Test database connection
python -c "
from app.config import settings
from supabase import create_client
client = create_client(settings.supabase_url, settings.supabase_service_role_key)
result = client.table('trading_accounts').select('*').limit(1).execute()
print(f'✅ Database connected: {len(result.data)} records')
"

# Test MT5 terminal pool
for i in {201..210}; do
    curl http://10.0.0.$i:9000/health && echo " - Terminal $((i-200)): OK" || echo " - Terminal $((i-200)): FAIL"
done
```

#### Create systemd Service:
```bash
# Create service file
cat > /etc/systemd/system/mt5-coordinator.service << 'EOF'
[Unit]
Description=MT5 Coordinator Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/mt5-service
Environment="PATH=/opt/mt5-service/venv/bin"
ExecStart=/opt/mt5-service/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable mt5-coordinator
systemctl start mt5-coordinator
systemctl status mt5-coordinator
```
```

#### Deliverables:
- MT5 service configured for self-hosted Supabase
- All 10 MT5 terminals accessible
- Connection tests passing
- Service running as systemd unit

---

### 3.2 Update Frontend Configuration

#### Update Environment Variables:
```env
# On your development machine: d:\tnm\tnm_concept\.env

# OLD (Supabase Cloud)
VITE_SUPABASE_URL=https://edzkorfdixvvvrkfzqzg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NEW (Self-hosted)
VITE_SUPABASE_URL=https://yourdomain.com/api
VITE_SUPABASE_ANON_KEY=<your-new-anon-key>

# MT5 Service URL
VITE_MT5_SERVICE_URL=https://yourdomain.com/mt5
VITE_MT5_SERVICE_API_KEY=<your-mt5-api-key>
```

#### Build Frontend for Production:
```powershell
# On Windows development machine
cd d:\tnm\tnm_concept

# Install dependencies
npm install

# Build for production
npm run build

# The dist folder is ready to deploy
```

#### Deploy to Nginx Container:
```powershell
# Option 1: SCP from Windows to Proxmox
scp -r dist/* root@192.168.1.100:/tmp/tnm-dist/

# Then on Proxmox host:
pct exec 105 -- bash -c '
    rm -rf /var/www/tnm/dist/*
    mkdir -p /var/www/tnm/dist
'
pct push 105 /tmp/tnm-dist /var/www/tnm/dist/ -recursive

# Option 2: Use WinSCP or FileZilla GUI
# Connect to 192.168.1.100:22
# Navigate to /var/www/tnm/dist/
# Upload contents of local dist folder
```

#### Test Frontend:
```bash
# From any machine, access:
https://yourdomain.com

# Verify:
# - [ ] Login works
# - [ ] Can see accounts
# - [ ] Can sync accounts
# - [ ] Positions load
# - [ ] Real-time updates work
```

#### Deliverables:
- Frontend built for production
- Deployed to Nginx container
- All features working with self-hosted backend
- SSL already configured (from Phase 2.4)

---

## Phase 4: Data Migration & Sync (Week 5)

### 4.1 Database Sync Strategy

#### Option A: One-Time Migration (Downtime Required)
```bash
# 1. Enable maintenance mode on old system
# 2. Stop all writes to Supabase Cloud
# 3. Final database backup
pg_dump -h db.edzkorfdixvvvrkfzqzg.supabase.co \
  -U postgres -d postgres > final_backup.sql

# 4. Restore to self-hosted
docker exec -i supabase-db psql -U postgres < final_backup.sql

# 5. Switch DNS to new server
# 6. Disable maintenance mode
```

**Downtime:** 2-4 hours

---

#### Option B: Blue-Green Deployment (Zero Downtime)
```bash
# 1. Set up replication from Cloud to Self-hosted
# Keep both systems in sync for testing period

# 2. Test self-hosted extensively
# Run both systems in parallel

# 3. Enable "read-only" mode on cloud
# Users can view but not modify

# 4. Final sync
# Sync last few changes

# 5. Switch DNS
# Point to self-hosted

# 6. Monitor for 24 hours
# Keep cloud running as backup
```

**Downtime:** Near zero (read-only period only)

---

### 4.2 User Migration

#### Migrate Auth Users:
```sql
-- Export from Supabase Cloud
COPY (
  SELECT id, email, encrypted_password, email_confirmed_at, 
         created_at, updated_at, raw_user_meta_data
  FROM auth.users
) TO '/tmp/auth_users.csv' CSV HEADER;

-- Import to self-hosted
COPY auth.users (id, email, encrypted_password, email_confirmed_at, 
                created_at, updated_at, raw_user_meta_data)
FROM '/tmp/auth_users.csv' CSV HEADER;
```

#### Test User Authentication:
```javascript
// Test login with existing user
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'test-password'
});

console.log('Login test:', error ? 'FAILED' : 'SUCCESS');
```

#### Deliverables:
- All users migrated
- Authentication working
- Passwords preserved (hashed)

---

### 4.3 Storage Migration

#### Copy Storage Files:
```javascript
// Script to copy all storage buckets
const { createClient } = require('@supabase/supabase-js');

const oldClient = createClient(OLD_URL, OLD_KEY);
const newClient = createClient(NEW_URL, NEW_KEY);

async function migrateStorage() {
  const { data: buckets } = await oldClient.storage.listBuckets();
  
  for (const bucket of buckets) {
    // Create bucket on new server
    await newClient.storage.createBucket(bucket.name, {
      public: bucket.public
    });
    
    // List all files
    const { data: files } = await oldClient.storage
      .from(bucket.name)
      .list();
    
    // Copy each file
    for (const file of files) {
      const { data: fileData } = await oldClient.storage
        .from(bucket.name)
        .download(file.name);
      
      await newClient.storage
        .from(bucket.name)
        .upload(file.name, fileData);
      
      console.log(`✅ Copied: ${bucket.name}/${file.name}`);
    }
  }
}

migrateStorage();
```

#### Deliverables:
- All storage buckets created
- All files copied
- File permissions preserved

---

## Phase 5: Testing & Validation (Week 6)

### 5.1 Functional Testing

#### Test Checklist:
- [ ] **Authentication**
  - [ ] Email/password login
  - [ ] Password reset
  - [ ] Email verification
  - [ ] Social login (if used)

- [ ] **Database Operations**
  - [ ] Read operations
  - [ ] Write operations
  - [ ] Real-time subscriptions
  - [ ] Row-level security (RLS) policies

- [ ] **MT5 Integration**
  - [ ] Account linking
  - [ ] Position sync
  - [ ] Historical data fetch
  - [ ] Multi-account switching
  - [ ] Session pooling

- [ ] **Frontend Features**
  - [ ] Dashboard loads
  - [ ] Trading journal works
  - [ ] AI features functional
  - [ ] Real-time position updates
  - [ ] Notifications work

---

### 5.2 Performance Testing

#### Load Testing Script:
```python
# load_test.py
import asyncio
import aiohttp
import time

async def test_endpoint(session, url):
    start = time.time()
    async with session.get(url) as response:
        await response.text()
        return time.time() - start

async def run_load_test(url, concurrent_requests):
    async with aiohttp.ClientSession() as session:
        tasks = [test_endpoint(session, url) for _ in range(concurrent_requests)]
        times = await asyncio.gather(*tasks)
        
        print(f"Concurrent requests: {concurrent_requests}")
        print(f"Average response time: {sum(times)/len(times):.3f}s")
        print(f"Min: {min(times):.3f}s, Max: {max(times):.3f}s")

# Test with increasing load
asyncio.run(run_load_test("https://yourdomain.com/api/health", 10))
asyncio.run(run_load_test("https://yourdomain.com/api/health", 50))
asyncio.run(run_load_test("https://yourdomain.com/api/health", 100))
```

#### Performance Targets:
| Metric | Target | Acceptable |
|--------|--------|------------|
| API Response Time | <100ms | <500ms |
| Database Query | <50ms | <200ms |
| Page Load Time | <2s | <5s |
| Realtime Latency | <100ms | <300ms |

---

### 5.3 Security Audit

#### Security Checklist:
- [ ] **SSL/TLS**
  - [ ] HTTPS enabled
  - [ ] HTTP redirects to HTTPS
  - [ ] Strong cipher suites
  - [ ] Certificate valid

- [ ] **Database Security**
  - [ ] Strong passwords
  - [ ] Limited port exposure
  - [ ] RLS policies enabled
  - [ ] Regular backups

- [ ] **API Security**
  - [ ] API keys rotated
  - [ ] JWT secrets strong
  - [ ] Rate limiting enabled
  - [ ] CORS configured correctly

- [ ] **Server Security**
  - [ ] Firewall configured
  - [ ] Windows updates current
  - [ ] Antivirus active
  - [ ] Access logs enabled

---

## Phase 6: Cutover & Go-Live (Week 7)

### 6.1 Pre-Cutover Checklist

#### 48 Hours Before:
- [ ] **Final data sync** from cloud to self-hosted
- [ ] **Verify all data** migrated correctly
- [ ] **Test all critical paths** one more time
- [ ] **Prepare rollback plan** (keep cloud active)
- [ ] **Notify users** of maintenance window (if needed)
- [ ] **Snapshot all Proxmox VMs and containers**

```bash
# Create snapshots on Proxmox
# Containers
for i in 100 101 102 103; do
    pct snapshot $i pre-cutover --description "Before production cutover"
done

# VMs
for i in {201..210}; do
    qm snapshot $i pre-cutover --description "Before production cutover"
done
```

#### 24 Hours Before:
- [ ] **Monitor cloud usage** patterns
- [ ] **Prepare monitoring dashboards** for self-hosted
- [ ] **Brief team** on cutover process
- [ ] **Have emergency contacts** ready

---

### 6.2 Cutover Execution

#### Blue-Green Cutover (Recommended):
```bash
# T-0: Start cutover
echo "Starting cutover at $(date)"

# T+5min: Enable read-only mode on cloud
# Update Supabase Cloud RLS policies to block writes

# T+10min: Final data sync
pg_dump cloud > final_sync.sql
psql self-hosted < final_sync.sql

# T+20min: Update DNS
# Change A record from cloud IP to self-hosted IP

# T+30min: Monitor traffic
# Watch for users hitting new server

# T+1hr: Verify all systems
# Check metrics, logs, errors

# T+4hr: Disable cloud (if all good)
# Or keep as backup for 24 hours
```

#### DNS Update:
```
Old: yourdomain.com → Supabase Cloud IP
New: yourdomain.com → Your Server IP

TTL: Set to 300 (5 minutes) before cutover
After cutover: Set back to 3600 (1 hour)
```

---

### 6.3 Post-Cutover Monitoring

#### First 24 Hours - Monitor Closely:
```bash
# On Proxmox host - Monitor all containers
for i in 100 101 102 103; do
    echo "=== Container $i ==="
    pct exec $i -- docker stats --no-stream 2>/dev/null || pct exec $i -- ps aux
done

# Monitor VMs
for i in {201..210}; do
    echo "=== VM $i ==="
    qm status $i
done

# Monitor host resources
proxmox-status
top
df -h

# Monitor application logs
pct exec 100 -- docker compose -f /opt/supabase/docker/docker-compose.yml logs -f --tail=100
pct exec 103 -- journalctl -u mt5-coordinator -f
pct exec 101 -- tail -f /var/log/nginx/access.log
```

#### Metrics to Watch:
- **Response times** - Should be similar or better than cloud
- **Error rates** - Should be <1%
- **Memory usage** - Should stay <80%
- **CPU usage** - Should stay <70%
- **Disk I/O** - Should be reasonable
- **Active users** - Track concurrent sessions

---

### 6.4 Rollback Plan (If Needed)

#### If Critical Issues Arise:
```bash
# 1. Update DNS back to cloud
# Point yourdomain.com back to Supabase Cloud

# 2. Enable writes on cloud again
# Remove read-only RLS policies

# 3. Communicate to users
# "Brief maintenance complete, service restored"

# 4. Diagnose issues on self-hosted
# Fix problems offline

# 5. Retry cutover when ready
# After fixes verified
```

---

## Phase 7: Post-Migration (Ongoing)

### 7.1 Monitoring Setup

#### Setup Monitoring Stack (LXC 102):
```bash
# Monitoring container already created in Phase 2.1
# Enter monitoring container
pct enter 102

# Create docker-compose file
mkdir -p /opt/monitoring
cd /opt/monitoring

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=
    volumes:
      - grafana-data:/var/lib/grafana

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"

volumes:
  prometheus-data:
  grafana-data:
EOF

# Create Prometheus config
mkdir prometheus
cat > prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'supabase-db'
    static_configs:
      - targets: ['10.0.0.10:5432']

  - job_name: 'mt5-coordinator'
    static_configs:
      - targets: ['10.0.0.20:8001']
EOF

# Start monitoring stack
docker compose up -d
```

#### Access Dashboards:
```
Prometheus: http://192.168.1.100:9090 (or port forward from LXC 106)
Grafana: http://192.168.1.100:3000 (or port forward from LXC 106)
Default login: admin / admin
```

#### Configure Dashboards:
- System resources (CPU, RAM, Disk)
- Docker container health
- Database connections
- API response times
- Active users
- MT5 terminal status

---

### 7.2 Backup Strategy

#### Automated Daily Backups:
```bash
# On Proxmox host: /root/scripts/daily-backup.sh

cat > /root/scripts/daily-backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/mnt/tnm-data/backups"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$BACKUP_DIR/backup_$DATE.log"

echo "Starting backup at $(date)" | tee -a $LOG_FILE

# Backup all LXC containers
for i in 100 101 102 103; do
    echo "Backing up container $i..." | tee -a $LOG_FILE
    vzdump $i --storage local --mode snapshot --compress zstd --dumpdir $BACKUP_DIR | tee -a $LOG_FILE
done

# Backup all VMs
for i in {201..210}; do
    echo "Backing up VM $i..." | tee -a $LOG_FILE
    vzdump $i --storage local --mode snapshot --compress zstd --dumpdir $BACKUP_DIR | tee -a $LOG_FILE
done

# Database backup from Supabase container
echo "Backing up PostgreSQL database..." | tee -a $LOG_FILE
pct exec 100 -- docker exec supabase-db pg_dump -U postgres -F c -f /tmp/db_$DATE.dump postgres
pct pull 100 /tmp/db_$DATE.dump $BACKUP_DIR/db_$DATE.dump
pct exec 100 -- rm /tmp/db_$DATE.dump

# Delete old backups (keep 30 days)
find $BACKUP_DIR -name "*.vma.zst" -mtime +30 -delete
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete
find $BACKUP_DIR -name "*.log" -mtime +30 -delete

echo "Backup completed at $(date)" | tee -a $LOG_FILE
EOF

chmod +x /root/scripts/daily-backup.sh
```

#### Schedule Backup with Cron:
```bash
# Add to crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /root/scripts/daily-backup.sh

# Or use Proxmox built-in backup system via web interface:
# Datacenter > Backup > Add
# Select containers/VMs, schedule, retention
```

---

### 7.3 Disaster Recovery

#### Recovery Procedures:

**Scenario 1: Database Corruption**
```bash
# Stop Supabase services
pct exec 100 -- docker compose -f /opt/supabase/docker/docker-compose.yml down

# Restore from latest backup
pct push 100 /mnt/tnm-data/backups/db_latest.dump /tmp/db_restore.dump
pct exec 100 -- docker compose -f /opt/supabase/docker/docker-compose.yml up -d db
pct exec 100 -- docker exec -i supabase-db pg_restore -U postgres -d postgres -c /tmp/db_restore.dump

# Restart all services
pct exec 100 -- docker compose -f /opt/supabase/docker/docker-compose.yml up -d
```

**Scenario 2: Container Failure**
```bash
# Stop failed container
pct stop <container-id>

# Restore from latest snapshot
pct rollback <container-id> <snapshot-name>

# Or restore from backup
pct restore <container-id> /mnt/tnm-data/backups/vzdump-lxc-<id>-<date>.vma.zst

# Start container
pct start <container-id>
```

**Scenario 3: VM Failure (MT5 Terminal)**
```bash
# Stop VM
qm stop <vm-id>

# Restore from snapshot
qm rollback <vm-id> <snapshot-name>

# Or restore from backup
qmrestore /mnt/tnm-data/backups/vzdump-qemu-<id>-<date>.vma.zst <vm-id>

# Start VM
qm start <vm-id>
```

**Scenario 4: Complete Proxmox Failure**
```
1. Reinstall Proxmox VE on replacement hardware
2. Restore from offsite backup (if configured)
3. Import all container/VM backups:
   - pct restore <id> /path/to/backup.vma.zst
   - qmrestore /path/to/backup.vma.zst <vm-id>
4. Update network configuration
5. Update DNS to point to new server
6. Verify all services running

Recovery Time Objective (RTO): 4-6 hours
Recovery Point Objective (RPO): 24 hours (daily backups)
```

**Offsite Backup Strategy:**
```bash
# Sync backups to remote server (rsync over SSH)
cat > /root/scripts/offsite-sync.sh << 'EOF'
#!/bin/bash
rsync -avz --delete \
    /mnt/tnm-data/backups/ \
    backup-user@remote-server:/backups/tnm/ \
    --exclude '*.log'
EOF

chmod +x /root/scripts/offsite-sync.sh

# Run daily after local backup (add to cron)
30 2 * * * /root/scripts/offsite-sync.sh
```

---

### 7.4 Maintenance Schedule

#### Weekly Tasks:
- [ ] Review Proxmox host and container logs for errors
- [ ] Check disk space usage (`df -h`, `pvesm status`)
- [ ] Verify backup completion in `/mnt/tnm-data/backups`
- [ ] Review performance metrics in Grafana
- [ ] Update Docker images if needed (`docker compose pull && docker compose up -d`)
- [ ] Check VM status (`qm list`)

#### Monthly Tasks:
- [ ] Proxmox VE updates (`apt update && apt upgrade`)
- [ ] SSL certificate check (auto-renewed by certbot)
- [ ] Database optimization:
  ```bash
  pct exec 100 -- docker exec supabase-db psql -U postgres -c "VACUUM ANALYZE;"
  pct exec 100 -- docker exec supabase-db psql -U postgres -c "REINDEX DATABASE postgres;"
  ```
- [ ] Review user accounts and access
- [ ] Test disaster recovery procedure (restore one container from backup)
- [ ] Review resource allocation (RAM/CPU usage per container/VM)

#### Quarterly Tasks:
- [ ] Full security audit (ports, access, passwords)
- [ ] Capacity planning review (project growth)
- [ ] Performance benchmarking (compare to baseline)
- [ ] Documentation update
- [ ] Review and update backup retention policy
- [ ] Test complete disaster recovery (full system restore)

---

## Phase 8: Optimization (Ongoing)

### 8.1 Performance Tuning

#### Database Optimization:
```sql
-- Analyze query performance
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Add indexes for slow queries
CREATE INDEX idx_trades_user_account ON trades(user_id, account_id);
CREATE INDEX idx_trading_accounts_user ON trading_accounts(user_id);

-- Regular maintenance
VACUUM ANALYZE;
REINDEX DATABASE postgres;
```

#### Docker Resource Limits:
```yaml
# docker-compose.yml
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '8'
          memory: 32G
        reservations:
          cpus: '4'
          memory: 16G
```

---

### 8.2 Scaling Strategy

#### When to Scale:

**Add More MT5 Terminals When:**
- Pro users > 800
- MT5 terminals consistently at >80% capacity

**Upgrade Server When:**
- RAM usage > 200GB consistently
- CPU usage > 80% for extended periods
- Response times degrading

**Add Second Server When:**
- Total users > 30,000
- Pro users > 2,000
- Single server at capacity

---

## Success Criteria

### Migration Complete When:
- ✅ All data migrated successfully
- ✅ All users can authenticate
- ✅ All features working
- ✅ Performance meets targets
- ✅ Backups automated
- ✅ Monitoring in place
- ✅ Zero critical issues for 7 days
- ✅ Team trained on new system
- ✅ Documentation complete

---

## Cost Savings Analysis

### Before (Cloud):
```
Supabase Pro: $25/month
Vercel Pro (if used): $20/month
Domain: $12/year
Total: ~$552/year
```

### After (Self-Hosted on Proxmox):
```
Domain: $12/year
Electricity (256GB server): ~$50/month = $600/year
Windows Server 2025 licenses: $0 (using existing licenses)
Proxmox VE: $0 (free, open-source)
Total: ~$612/year

BUT: Can support 30,000+ users vs limited on cloud
Effective cost per 1,000 users: $20/year vs $500+/year on cloud

ROI: Positive after 1 month with >100 users

### Additional Benefits:
- Proxmox GUI host for easy management via web interface
- Windows Server 2025 Core guests = 50-60% less RAM per VM
- 167GB RAM buffer (vs 157GB with GUI guests) = 65% headroom
- Lower overhead (~30% less RAM vs Docker-in-Windows)
- Enterprise features: snapshots, backups, clustering (free)
- Scalable to multiple Proxmox nodes for HA
- Faster boot times, better stability with Server Core
- Smaller attack surface with Core (no GUI vulnerabilities)
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data loss during migration | Low | Critical | Multiple backups, verification |
| Extended downtime | Medium | High | Blue-green deployment |
| Performance degradation | Low | Medium | Load testing before cutover |
| Security breach | Low | Critical | Security audit, monitoring |
| User confusion | Medium | Low | Communication, rollback plan |
| Hardware failure | Low | High | Redundant backups, DR plan |

---

## Timeline Summary

| Phase | Duration | Key Milestones |
|-------|----------|----------------|
| **Week 1** | Proxmox Setup | Install Proxmox VE, configure storage, networking |
| **Week 2** | Pre-Migration | Backups, assessment, planning |
| **Week 3** | Infrastructure | Supabase LXC containers, MT5 VMs, Nginx proxy |
| **Week 4** | Application | Frontend/backend updated, tested |
| **Week 5** | Data Migration | Full sync, storage migration |
| **Week 6** | Testing | Load tests, security audit |
| **Week 7** | Cutover | DNS switch, go-live |
| **Ongoing** | Operations | Monitoring, backups, optimization |

**Total: 7 weeks to production + ongoing operations**

---

## Team Responsibilities

### During Migration:
- **You:** Overall coordination, decision making
- **DevOps/You:** Infrastructure setup, Docker configuration
- **Database Admin/You:** Data migration, verification
- **QA/You:** Testing all features thoroughly

### After Migration:
- **Daily:** Monitor dashboards, check logs
- **Weekly:** Review metrics, update backups
- **Monthly:** System maintenance, updates
- **Quarterly:** Capacity planning, audits

---

## Emergency Contacts

```
Primary: [Your contact]
Backup: [Backup contact]

Critical Vendor Support:
- Domain Registrar: [Contact info]
- ISP: [Contact info]
- Hardware Vendor: [Contact info]

Escalation Path:
1. Check monitoring dashboards
2. Review logs
3. Attempt standard fixes
4. Rollback if necessary
5. Escalate to vendor if hardware issue
```

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Get approval** for 6-week timeline
3. **Schedule kick-off** meeting
4. **Start Week 1** pre-migration tasks
5. **Set up project tracking** (use this document as checklist)

---

**Document Version:** 1.0  
**Last Updated:** November 21, 2025  
**Next Review:** Start of each phase  
**Owner:** [Your Name]  

---

## Appendix

### A. Useful Commands

#### Proxmox Management:
```bash
# List all containers
pct list

# List all VMs
qm list

# Enter container
pct enter <container-id>

# Execute command in container
pct exec <container-id> -- <command>

# Start/stop/restart container
pct start <container-id>
pct stop <container-id>
pct restart <container-id>

# Start/stop/restart VM
qm start <vm-id>
qm stop <vm-id>
qm reset <vm-id>

# Monitor resources
pvesh get /nodes/pve/status
top
htop

# Storage status
pvesm status
df -h

# Network status
ip addr show
brctl show
```

#### Container Management:
```bash
# Check Docker status in container
pct exec 100 -- docker ps
pct exec 100 -- docker stats --no-stream

# View logs
pct exec 100 -- docker compose -f /opt/supabase/docker/docker-compose.yml logs -f
pct exec 110 -- journalctl -u mt5-coordinator -f
pct exec 105 -- tail -f /var/log/nginx/access.log

# Database backup
pct exec 100 -- docker exec supabase-db pg_dump -U postgres postgres > /tmp/backup.sql

# Restart services
pct exec 100 -- docker compose -f /opt/supabase/docker/docker-compose.yml restart
pct exec 110 -- systemctl restart mt5-coordinator
pct exec 105 -- systemctl restart nginx
```

### B. Troubleshooting Guide

**Issue:** Container won't start  
**Solution:** 
```bash
pct start <id> --debug
journalctl -u pve-container@<id> -n 50
# Check storage space, configuration, or restore from snapshot
```

**Issue:** Supabase containers won't start  
**Solution:** 
```bash
pct enter 100
cd /opt/supabase/docker
docker compose logs
# Check .env configuration, ports, resources
```

**Issue:** Database connection errors  
**Solution:** 
```bash
pct exec 100 -- docker ps | grep postgres
pct exec 100 -- docker exec supabase-db psql -U postgres -c "SELECT 1;"
# Verify PostgreSQL is running, check credentials in .env
```

**Issue:** MT5 terminals not responding  
**Solution:** 
```bash
# Check VM status
qm status <vm-id>
qm start <vm-id>

# Access VM console
qm terminal <vm-id>
# Or via web interface

# Verify FastAPI bridge running inside Windows VM
# Check Windows Services or Task Manager
```

**Issue:** Frontend can't reach backend  
**Solution:** 
```bash
pct exec 105 -- nginx -t  # Test Nginx configuration
pct exec 105 -- tail -f /var/log/nginx/error.log
# Verify upstream servers are accessible
# Check CORS settings in Supabase
```

**Issue:** Network connectivity between containers  
**Solution:** 
```bash
# Test connectivity
pct exec 105 -- ping 10.0.0.10  # Ping Supabase from Nginx
pct exec 110 -- curl http://10.0.0.10:8000/health  # Test API

# Check bridge configuration
brctl show vmbr1
ip route
```

### C. Configuration Templates

All configuration files available in:
- `/mnt/tnm-data/config-templates/` (on Proxmox host)
- Version controlled in Git
- Document any changes

**Key Files:**
- Supabase: `/opt/supabase/docker/.env` (in LXC 100)
- Nginx: `/etc/nginx/sites-available/tnm` (in LXC 101)
- MT5 Service: `/opt/mt5-service/.env` (in LXC 103)
- Monitoring: `/opt/monitoring/docker-compose.yml` (in LXC 102)

---

**END OF MIGRATION PLAN**
