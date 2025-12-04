#!/bin/bash
# SSH Tunnel Manager for Proxmox Development
# 
# Creates SSH tunnels from Mac to Proxmox VMs for local development
# 
# USAGE:
#   chmod +x mac-ssh-tunnels.sh
#   ./mac-ssh-tunnels.sh start    # Start all tunnels
#   ./mac-ssh-tunnels.sh stop     # Stop all tunnels
#   ./mac-ssh-tunnels.sh status   # Check tunnel status

# Configuration
PROXMOX_IP="142.132.156.162"
PROXMOX_USER="root"

# VM IPs
WINDOWS_VM="172.16.16.20"
DOCKER_VM="172.16.16.100"

# Ports
MT5_SERVICE_PORT=8000
SUPABASE_API_PORT=8000
SUPABASE_STUDIO_PORT=3000
WINDOWS_RDP_PORT=3389

# Local ports (on Mac)
LOCAL_MT5_PORT=8000
LOCAL_SUPABASE_API_PORT=8001
LOCAL_SUPABASE_STUDIO_PORT=3000
LOCAL_RDP_PORT=3389

# PID file locations
PID_DIR="$HOME/.tnm-tunnels"
MT5_PID_FILE="$PID_DIR/mt5-tunnel.pid"
SUPABASE_PID_FILE="$PID_DIR/supabase-tunnel.pid"
RDP_PID_FILE="$PID_DIR/rdp-tunnel.pid"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Create PID directory
mkdir -p "$PID_DIR"

# Function: Start tunnels
start_tunnels() {
    echo -e "${CYAN}==========================================================="
    echo "  Starting SSH Tunnels to Proxmox VMs"
    echo "===========================================================${NC}"
    echo ""
    
    # MT5 Service Tunnel
    echo -e "${YELLOW}Starting MT5 Service tunnel...${NC}"
    if [ -f "$MT5_PID_FILE" ] && kill -0 $(cat "$MT5_PID_FILE") 2>/dev/null; then
        echo -e "${GREEN}[✓] MT5 tunnel already running (PID: $(cat "$MT5_PID_FILE"))${NC}"
    else
        ssh -f -N -L $LOCAL_MT5_PORT:$WINDOWS_VM:$MT5_SERVICE_PORT $PROXMOX_USER@$PROXMOX_IP
        echo $! > "$MT5_PID_FILE"
        echo -e "${GREEN}[✓] MT5 tunnel started${NC}"
        echo "    Local:  http://localhost:$LOCAL_MT5_PORT"
        echo "    Remote: http://$WINDOWS_VM:$MT5_SERVICE_PORT"
    fi
    echo ""
    
    # Supabase Tunnel
    echo -e "${YELLOW}Starting Supabase tunnel...${NC}"
    if [ -f "$SUPABASE_PID_FILE" ] && kill -0 $(cat "$SUPABASE_PID_FILE") 2>/dev/null; then
        echo -e "${GREEN}[✓] Supabase tunnel already running (PID: $(cat "$SUPABASE_PID_FILE"))${NC}"
    else
        ssh -f -N -L $LOCAL_SUPABASE_API_PORT:$DOCKER_VM:$SUPABASE_API_PORT \
                   -L $LOCAL_SUPABASE_STUDIO_PORT:$DOCKER_VM:$SUPABASE_STUDIO_PORT \
                   $PROXMOX_USER@$PROXMOX_IP
        echo $! > "$SUPABASE_PID_FILE"
        echo -e "${GREEN}[✓] Supabase tunnel started${NC}"
        echo "    API:    http://localhost:$LOCAL_SUPABASE_API_PORT"
        echo "    Studio: http://localhost:$LOCAL_SUPABASE_STUDIO_PORT"
        echo "    Remote: http://$DOCKER_VM:$SUPABASE_API_PORT"
    fi
    echo ""
    
    # RDP Tunnel (optional)
    echo -e "${YELLOW}Starting RDP tunnel (optional)...${NC}"
    if [ -f "$RDP_PID_FILE" ] && kill -0 $(cat "$RDP_PID_FILE") 2>/dev/null; then
        echo -e "${GREEN}[✓] RDP tunnel already running (PID: $(cat "$RDP_PID_FILE"))${NC}"
    else
        ssh -f -N -L $LOCAL_RDP_PORT:$WINDOWS_VM:$WINDOWS_RDP_PORT $PROXMOX_USER@$PROXMOX_IP
        echo $! > "$RDP_PID_FILE"
        echo -e "${GREEN}[✓] RDP tunnel started${NC}"
        echo "    Connect to: localhost:$LOCAL_RDP_PORT"
    fi
    echo ""
    
    echo -e "${GREEN}==========================================================="
    echo "  All tunnels started successfully!"
    echo "===========================================================${NC}"
    echo ""
    echo "Test connectivity:"
    echo "  MT5:      curl http://localhost:$LOCAL_MT5_PORT/health"
    echo "  Supabase: curl http://localhost:$LOCAL_SUPABASE_API_PORT/health"
    echo "  Studio:   open http://localhost:$LOCAL_SUPABASE_STUDIO_PORT"
    echo ""
}

# Function: Stop tunnels
stop_tunnels() {
    echo -e "${CYAN}==========================================================="
    echo "  Stopping SSH Tunnels"
    echo "===========================================================${NC}"
    echo ""
    
    stopped=0
    
    # Stop MT5 tunnel
    if [ -f "$MT5_PID_FILE" ]; then
        PID=$(cat "$MT5_PID_FILE")
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            echo -e "${GREEN}[✓] MT5 tunnel stopped (PID: $PID)${NC}"
            stopped=$((stopped + 1))
        fi
        rm -f "$MT5_PID_FILE"
    fi
    
    # Stop Supabase tunnel
    if [ -f "$SUPABASE_PID_FILE" ]; then
        PID=$(cat "$SUPABASE_PID_FILE")
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            echo -e "${GREEN}[✓] Supabase tunnel stopped (PID: $PID)${NC}"
            stopped=$((stopped + 1))
        fi
        rm -f "$SUPABASE_PID_FILE"
    fi
    
    # Stop RDP tunnel
    if [ -f "$RDP_PID_FILE" ]; then
        PID=$(cat "$RDP_PID_FILE")
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            echo -e "${GREEN}[✓] RDP tunnel stopped (PID: $PID)${NC}"
            stopped=$((stopped + 1))
        fi
        rm -f "$RDP_PID_FILE"
    fi
    
    if [ $stopped -eq 0 ]; then
        echo -e "${YELLOW}[!] No tunnels were running${NC}"
    else
        echo ""
        echo -e "${GREEN}Stopped $stopped tunnel(s)${NC}"
    fi
    echo ""
}

# Function: Check tunnel status
check_status() {
    echo -e "${CYAN}==========================================================="
    echo "  SSH Tunnel Status"
    echo "===========================================================${NC}"
    echo ""
    
    # Check MT5 tunnel
    echo -e "${YELLOW}MT5 Service Tunnel:${NC}"
    if [ -f "$MT5_PID_FILE" ] && kill -0 $(cat "$MT5_PID_FILE") 2>/dev/null; then
        PID=$(cat "$MT5_PID_FILE")
        echo -e "  Status: ${GREEN}RUNNING${NC} (PID: $PID)"
        echo "  Local:  http://localhost:$LOCAL_MT5_PORT"
        echo "  Remote: http://$WINDOWS_VM:$MT5_SERVICE_PORT"
        
        # Test connectivity
        if curl -s -f -m 2 http://localhost:$LOCAL_MT5_PORT/health > /dev/null 2>&1; then
            echo -e "  Health: ${GREEN}✓ Responding${NC}"
        else
            echo -e "  Health: ${RED}✗ Not responding${NC}"
        fi
    else
        echo -e "  Status: ${RED}NOT RUNNING${NC}"
        rm -f "$MT5_PID_FILE"
    fi
    echo ""
    
    # Check Supabase tunnel
    echo -e "${YELLOW}Supabase Tunnel:${NC}"
    if [ -f "$SUPABASE_PID_FILE" ] && kill -0 $(cat "$SUPABASE_PID_FILE") 2>/dev/null; then
        PID=$(cat "$SUPABASE_PID_FILE")
        echo -e "  Status: ${GREEN}RUNNING${NC} (PID: $PID)"
        echo "  API:    http://localhost:$LOCAL_SUPABASE_API_PORT"
        echo "  Studio: http://localhost:$LOCAL_SUPABASE_STUDIO_PORT"
        echo "  Remote: http://$DOCKER_VM:$SUPABASE_API_PORT"
        
        # Test connectivity
        if curl -s -f -m 2 http://localhost:$LOCAL_SUPABASE_API_PORT/ > /dev/null 2>&1; then
            echo -e "  Health: ${GREEN}✓ Responding${NC}"
        else
            echo -e "  Health: ${RED}✗ Not responding${NC}"
        fi
    else
        echo -e "  Status: ${RED}NOT RUNNING${NC}"
        rm -f "$SUPABASE_PID_FILE"
    fi
    echo ""
    
    # Check RDP tunnel
    echo -e "${YELLOW}RDP Tunnel:${NC}"
    if [ -f "$RDP_PID_FILE" ] && kill -0 $(cat "$RDP_PID_FILE") 2>/dev/null; then
        PID=$(cat "$RDP_PID_FILE")
        echo -e "  Status: ${GREEN}RUNNING${NC} (PID: $PID)"
        echo "  Local:  localhost:$LOCAL_RDP_PORT"
        echo "  Remote: $WINDOWS_VM:$WINDOWS_RDP_PORT"
    else
        echo -e "  Status: ${RED}NOT RUNNING${NC}"
        rm -f "$RDP_PID_FILE"
    fi
    echo ""
}

# Function: Show help
show_help() {
    echo "TNM SSH Tunnel Manager"
    echo ""
    echo "Usage: $0 {start|stop|status|restart}"
    echo ""
    echo "Commands:"
    echo "  start    - Start all SSH tunnels"
    echo "  stop     - Stop all SSH tunnels"
    echo "  status   - Check tunnel status"
    echo "  restart  - Restart all tunnels"
    echo ""
    echo "Tunnels:"
    echo "  MT5 Service:     localhost:$LOCAL_MT5_PORT -> $WINDOWS_VM:$MT5_SERVICE_PORT"
    echo "  Supabase API:    localhost:$LOCAL_SUPABASE_API_PORT -> $DOCKER_VM:$SUPABASE_API_PORT"
    echo "  Supabase Studio: localhost:$LOCAL_SUPABASE_STUDIO_PORT -> $DOCKER_VM:$SUPABASE_STUDIO_PORT"
    echo "  RDP:             localhost:$LOCAL_RDP_PORT -> $WINDOWS_VM:$WINDOWS_RDP_PORT"
    echo ""
}

# Main script
case "$1" in
    start)
        start_tunnels
        ;;
    stop)
        stop_tunnels
        ;;
    status)
        check_status
        ;;
    restart)
        stop_tunnels
        sleep 2
        start_tunnels
        ;;
    *)
        show_help
        exit 1
        ;;
esac
