#!/bin/bash
# Supabase Docker VM Setup Script for Proxmox
# 
# PREREQUISITES:
# - Docker already installed
# - Supabase already cloned to /opt/supabase/
# - VM IP: 172.16.16.100/24
#
# USAGE:
#   chmod +x proxmox-docker-setup.sh
#   sudo ./proxmox-docker-setup.sh

set -e  # Exit on error

echo "==========================================================="
echo "  Supabase Stack - Proxmox Docker VM Setup"
echo "==========================================================="
echo ""

# Configuration
VM_IP="172.16.16.100"
SUPABASE_DIR="/opt/supabase"
DOCKER_DIR="$SUPABASE_DIR/docker"
ENV_FILE="$DOCKER_DIR/.env"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Step 1: Check if running as root
echo -e "${YELLOW}Step 1: Checking permissions...${NC}"
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}[ERROR] This script must be run as root${NC}"
    echo "Please run: sudo $0"
    exit 1
fi
echo -e "${GREEN}[✓] Running as root${NC}"
echo ""

# Step 2: Verify Docker installation
echo -e "${YELLOW}Step 2: Verifying Docker installation...${NC}"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}[✓] Docker installed: $DOCKER_VERSION${NC}"
else
    echo -e "${RED}[ERROR] Docker not found!${NC}"
    echo "Please install Docker first:"
    echo "  curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if command -v docker compose &> /dev/null; then
    echo -e "${GREEN}[✓] Docker Compose plugin installed${NC}"
else
    echo -e "${RED}[ERROR] Docker Compose plugin not found!${NC}"
    echo "Please install Docker Compose plugin"
    exit 1
fi
echo ""

# Step 3: Verify Supabase directory
echo -e "${YELLOW}Step 3: Verifying Supabase installation...${NC}"
if [ -d "$SUPABASE_DIR" ]; then
    echo -e "${GREEN}[✓] Supabase directory exists: $SUPABASE_DIR${NC}"
else
    echo -e "${YELLOW}[!] Supabase not found. Cloning repository...${NC}"
    git clone --depth 1 https://github.com/supabase/supabase "$SUPABASE_DIR"
    echo -e "${GREEN}[✓] Supabase cloned successfully${NC}"
fi

if [ -d "$DOCKER_DIR" ]; then
    echo -e "${GREEN}[✓] Docker directory exists: $DOCKER_DIR${NC}"
else
    echo -e "${RED}[ERROR] Docker directory not found: $DOCKER_DIR${NC}"
    exit 1
fi
echo ""

# Step 4: Generate secrets
echo -e "${YELLOW}Step 4: Generating secure secrets...${NC}"

# Generate strong passwords and keys
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
ANON_KEY=$(openssl rand -base64 32 | tr -d "=+/")
SERVICE_ROLE_KEY=$(openssl rand -base64 32 | tr -d "=+/")
DASHBOARD_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/")

echo -e "${GREEN}[✓] Secrets generated successfully${NC}"
echo -e "${GRAY}   (Secrets will be saved to .env file)${NC}"
echo ""

# Step 5: Create .env file
echo -e "${YELLOW}Step 5: Creating Supabase configuration...${NC}"

cat > "$ENV_FILE" << EOF
############
# Secrets
############
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD

############
# Database
############
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432
# Increased for better performance
POSTGRES_MAX_CONNECTIONS=200

############
# API
############
API_EXTERNAL_URL=http://$VM_IP:8000
SUPABASE_PUBLIC_URL=http://$VM_IP:8000

############
# Auth
############
SITE_URL=http://localhost:5173
ADDITIONAL_REDIRECT_URLS=http://localhost:3000,http://localhost:8080
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true

############
# Email (Development - Console logs)
############
SMTP_ADMIN_EMAIL=admin@tnm.local
SMTP_HOST=inbucket
SMTP_PORT=2500
SMTP_USER=
SMTP_PASS=
SMTP_SENDER_NAME=TNM AI Platform
ENABLE_EMAIL_DELIVERY=false

# For production, configure real SMTP:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# ENABLE_EMAIL_DELIVERY=true

############
# Storage
############
STORAGE_BACKEND=file
FILE_SIZE_LIMIT=52428800
STORAGE_FILE_PATH=/var/lib/storage

############
# Studio
############
STUDIO_DEFAULT_ORGANIZATION=TNM AI
STUDIO_DEFAULT_PROJECT=Production

############
# Logs
############
LOGFLARE_API_KEY=
LOGFLARE_SOURCE_TOKEN=

############
# Analytics
############
ANALYTICS_ENABLED=false

############
# Realtime
############
REALTIME_MAX_CONNECTIONS=100
REALTIME_MAX_CHANNELS_PER_CLIENT=100
EOF

echo -e "${GREEN}[✓] Configuration file created: $ENV_FILE${NC}"
echo ""

# Step 6: Save secrets to separate file for reference
SECRETS_FILE="$DOCKER_DIR/.secrets"
cat > "$SECRETS_FILE" << EOF
# Supabase Secrets - KEEP THIS FILE SECURE!
# Generated: $(date)

POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD

# Service URLs
API_URL=http://$VM_IP:8000
STUDIO_URL=http://$VM_IP:3000

# From Mac (via SSH tunnel):
# ssh -L 8001:$VM_IP:8000 -L 3000:$VM_IP:3000 root@142.132.156.162 -N
# API: http://localhost:8001
# Studio: http://localhost:3000
EOF

chmod 600 "$SECRETS_FILE"
echo -e "${GREEN}[✓] Secrets saved to: $SECRETS_FILE${NC}"
echo -e "${YELLOW}   IMPORTANT: Keep this file secure!${NC}"
echo ""

# Step 7: Pull Docker images
echo -e "${YELLOW}Step 6: Pulling Docker images (this may take 5-10 minutes)...${NC}"
cd "$DOCKER_DIR"
docker compose pull
echo -e "${GREEN}[✓] Docker images pulled successfully${NC}"
echo ""

# Step 8: Start Supabase stack
echo -e "${YELLOW}Step 7: Starting Supabase stack...${NC}"
docker compose up -d

# Wait for services to be ready
echo -e "${GRAY}   Waiting for services to start...${NC}"
sleep 10

echo -e "${GREEN}[✓] Supabase stack started${NC}"
echo ""

# Step 9: Verify services
echo -e "${YELLOW}Step 8: Verifying services...${NC}"
SERVICES=$(docker compose ps --services)
RUNNING_COUNT=$(docker compose ps --services --filter "status=running" | wc -l)
TOTAL_COUNT=$(echo "$SERVICES" | wc -l)

if [ "$RUNNING_COUNT" -eq "$TOTAL_COUNT" ]; then
    echo -e "${GREEN}[✓] All services running ($RUNNING_COUNT/$TOTAL_COUNT)${NC}"
else
    echo -e "${YELLOW}[!] Some services not running yet ($RUNNING_COUNT/$TOTAL_COUNT)${NC}"
    echo -e "${GRAY}   Check status with: docker compose ps${NC}"
fi
echo ""

# Step 10: Display service status
echo -e "${YELLOW}Step 9: Service status:${NC}"
docker compose ps
echo ""

# Verification Summary
echo "==========================================================="
echo "  SETUP COMPLETE - Configuration Summary"
echo "==========================================================="
echo ""

echo -e "${CYAN}Network Configuration:${NC}"
echo "  VM IP Address:     $VM_IP"
echo "  Subnet:            172.16.16.0/24"
echo "  Gateway:           172.16.16.1"
echo ""

echo -e "${CYAN}Service Endpoints (Internal):${NC}"
echo "  Supabase API:      http://$VM_IP:8000"
echo "  Supabase Studio:   http://$VM_IP:3000"
echo "  PostgreSQL:        $VM_IP:5432"
echo ""

echo -e "${CYAN}Service Endpoints (from Mac via SSH tunnel):${NC}"
echo "  Create tunnel:"
echo -e "    ${GRAY}ssh -L 8001:$VM_IP:8000 -L 3000:$VM_IP:3000 root@142.132.156.162 -N${NC}"
echo ""
echo "  Access URLs:"
echo "    Supabase API:    http://localhost:8001"
echo "    Supabase Studio: http://localhost:3000"
echo ""

echo -e "${CYAN}Credentials:${NC}"
echo "  Dashboard User:    admin"
echo "  Dashboard Pass:    $DASHBOARD_PASSWORD"
echo "  Anon Key:          $ANON_KEY"
echo "  Service Role Key:  $SERVICE_ROLE_KEY"
echo ""
echo -e "${YELLOW}  Full credentials saved in: $SECRETS_FILE${NC}"
echo ""

echo -e "${CYAN}Docker Commands:${NC}"
echo "  View logs:         cd $DOCKER_DIR && docker compose logs -f"
echo "  Stop services:     cd $DOCKER_DIR && docker compose down"
echo "  Restart services:  cd $DOCKER_DIR && docker compose restart"
echo "  Status:            cd $DOCKER_DIR && docker compose ps"
echo ""

echo "==========================================================="
echo "  Next Steps:"
echo "==========================================================="
echo ""
echo "1. From Mac, create SSH tunnel:"
echo -e "   ${CYAN}ssh -L 8001:$VM_IP:8000 -L 3000:$VM_IP:3000 root@142.132.156.162 -N${NC}"
echo ""
echo "2. Access Supabase Studio:"
echo -e "   ${CYAN}http://localhost:3000${NC}"
echo "   Login: admin / $DASHBOARD_PASSWORD"
echo ""
echo "3. Update Windows VM .env file with:"
echo "   SUPABASE_URL=http://$VM_IP:8000"
echo "   SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY"
echo ""
echo "4. Update Mac frontend .env.local with:"
echo "   VITE_SUPABASE_URL=http://localhost:8001"
echo "   VITE_SUPABASE_ANON_KEY=$ANON_KEY"
echo ""
echo "5. Test API connectivity:"
echo -e "   ${CYAN}curl http://localhost:8001/health${NC}"
echo ""

echo -e "${GREEN}[✓] Supabase Docker VM setup completed successfully!${NC}"
echo ""
