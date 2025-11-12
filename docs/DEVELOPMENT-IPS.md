# Development IP Addresses

**Windows Machine (MT5 Service):** 10.4.0.180 → vms.tnm.local  
**Mac Machine (Frontend):** [Auto-assigned by DHCP]

**Router Gateway:** 10.4.0.1  
**DNS Servers:** 8.8.8.8, 8.8.4.4

Last updated: November 12, 2025

---

## Network Configuration Details

### Windows Machine
- **Adapter:** Wi-Fi
- **IP Assignment:** Static (Manual)
- **IPv4 Address:** 10.4.0.180
- **Subnet Mask:** 255.255.255.0 (Prefix: /24)
- **Default Gateway:** 10.4.0.1
- **DNS Primary:** 8.8.8.8 (Google Public DNS)
- **DNS Secondary:** 8.8.4.4 (Google Public DNS)

### Hostname Resolution
The hostname `vms.tnm.local` should resolve to `10.4.0.180` via:
- Mac hosts file entry: `/etc/hosts`
- Or local DNS/mDNS resolution

### Firewall Configuration
- **Port 8000:** Inbound allowed (FastAPI service)
- **Profiles:** Private, Domain (not Public)
- **Rule Name:** MT5 FastAPI Local Dev

---

## Connectivity Test Results

- Ping Mac → Windows: ✅ Success
- Hostname: vms.tnm.local resolves correctly to 10.4.0.180
- Tested: November 12, 2025
- Status: Mac can successfully reach Windows machine via hostname
