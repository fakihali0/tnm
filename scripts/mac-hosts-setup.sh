#!/bin/bash
# Mac Hosts File Setup for MT5 Service Development
# Story 1.1: Configure hostname for Windows machine
#
# USAGE:
#   chmod +x scripts/mac-hosts-setup.sh
#   ./scripts/mac-hosts-setup.sh

set -e

# Configuration
WINDOWS_IP="10.4.0.180"
HOSTNAME="vms.tnm.local"
HOSTS_FILE="/etc/hosts"

echo "==========================================================="
echo "  MT5 Integration Service - Mac Hosts Configuration"
echo "==========================================================="
echo ""

# Check if running with sudo
if [ "$EUID" -eq 0 ]; then 
    echo "[WARNING] Running as root. This is OK." 
else
    echo "[INFO] This script will request sudo access to modify /etc/hosts"
fi
echo ""

# Check if hostname already exists
if grep -q "$HOSTNAME" "$HOSTS_FILE" 2>/dev/null; then
    echo "[✓] Hostname '$HOSTNAME' already exists in hosts file"
    echo ""
    echo "Current entry:"
    grep "$HOSTNAME" "$HOSTS_FILE"
    echo ""
    
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "[INFO] Updating hosts entry..."
        # Remove old entry and add new one
        sudo sed -i '' "/$HOSTNAME/d" "$HOSTS_FILE"
        echo "$WINDOWS_IP    $HOSTNAME" | sudo tee -a "$HOSTS_FILE" > /dev/null
        echo "[✓] Hosts entry updated"
    else
        echo "[INFO] Skipping update"
    fi
else
    echo "[INFO] Adding hostname to hosts file..."
    echo ""
    echo "# MT5 Integration Service" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo "$WINDOWS_IP    $HOSTNAME" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo "[✓] Hostname added successfully"
fi

echo ""
echo "==========================================================="
echo "  Configuration Complete"
echo "==========================================================="
echo ""
echo "Hostname:      $HOSTNAME"
echo "IP Address:    $WINDOWS_IP"
echo ""

# Flush DNS cache
echo "[INFO] Flushing DNS cache..."
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder 2>/dev/null || true
echo "[✓] DNS cache flushed"
echo ""

# Test connectivity
echo "==========================================================="
echo "  Testing Connectivity"
echo "==========================================================="
echo ""

echo "[INFO] Testing ping to $HOSTNAME..."
if ping -c 3 "$HOSTNAME" > /dev/null 2>&1; then
    echo "[✓] Ping successful!"
    ping -c 3 "$HOSTNAME"
else
    echo "[WARNING] Ping failed. Make sure Windows machine is online."
    echo "   IP: $WINDOWS_IP"
    echo ""
    echo "Try manual ping:"
    echo "   ping $WINDOWS_IP"
fi

echo ""
echo "==========================================================="
echo "  Next Steps"
echo "==========================================================="
echo ""
echo "1. Verify connectivity:"
echo "   ping $HOSTNAME"
echo ""
echo "2. Use in your code:"
echo "   VITE_MT5_SERVICE_URL=http://$HOSTNAME:8000"
echo ""
echo "3. Test service (after FastAPI is running):"
echo "   curl http://$HOSTNAME:8000/health"
echo ""
echo "4. View hosts file:"
echo "   cat /etc/hosts | grep $HOSTNAME"
echo ""
