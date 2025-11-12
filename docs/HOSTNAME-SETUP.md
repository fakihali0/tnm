# Hostname Configuration Guide

## Quick Setup

### On Windows (PowerShell as Admin)
```powershell
cd C:\tnm
.\scripts\windows-setup.ps1
```

### On Mac
```bash
cd ~/Desktop/tnm
chmod +x scripts/mac-hosts-setup.sh
./scripts/mac-hosts-setup.sh
```

## What This Does

- **Windows machine** gets hostname: `vms.tnm.local`
- Both machines map `vms.tnm.local` → `10.4.0.180` in their hosts files
- You can now use `http://vms.tnm.local:8000` everywhere instead of IP

## Benefits

✅ **Single Source of Truth**: IP address is only in hosts files  
✅ **Easy Updates**: Change IP in one place (hosts file) instead of all configs  
✅ **Readable Code**: `vms.tnm.local` is clearer than `10.4.0.180`  
✅ **Professional**: Mimics production hostname-based architecture  

## Usage Examples

### Environment Variables (.env)
```bash
VITE_MT5_SERVICE_URL=http://vms.tnm.local:8000
```

### Frontend Code
```typescript
const response = await fetch('http://vms.tnm.local:8000/health');
```

### Testing
```bash
# Ping test
ping vms.tnm.local

# Health check
curl http://vms.tnm.local:8000/health

# API documentation
open http://vms.tnm.local:8000/docs
```

## When IP Changes

If Windows IP changes from `10.4.0.180` to something else:

### Windows
```powershell
notepad C:\Windows\System32\drivers\etc\hosts
# Update the line with new IP
```

### Mac
```bash
sudo nano /etc/hosts
# Update the line with new IP

# Flush DNS
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

**No code changes needed!** Everything using `vms.tnm.local` will work automatically.

## Verification

### Check Hosts File

**Windows:**
```powershell
Get-Content C:\Windows\System32\drivers\etc\hosts | Select-String "vms.tnm.local"
```

**Mac:**
```bash
cat /etc/hosts | grep vms.tnm.local
```

### Test Resolution

**Both machines:**
```bash
ping vms.tnm.local
```

Should show `10.4.0.180` in the ping output.

## Troubleshooting

### "Could not resolve hostname"

**On Mac:**
```bash
# Flush DNS cache
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Verify hosts entry
cat /etc/hosts | grep vms.tnm.local
```

**On Windows:**
```powershell
# Flush DNS cache
ipconfig /flushdns

# Verify hosts entry
Get-Content C:\Windows\System32\drivers\etc\hosts | Select-String "vms.tnm.local"
```

### Hostname works on Windows but not Mac (or vice versa)

Make sure the hosts file entry exists on **both** machines:
- Windows: `C:\Windows\System32\drivers\etc\hosts`
- Mac: `/etc/hosts`

Both should have:
```
10.4.0.180    vms.tnm.local
```

## Files Reference

- **Network Config:** `docs/NETWORK-CONFIG.md`
- **Windows Setup:** `scripts/windows-setup.ps1`
- **Mac Setup:** `scripts/mac-hosts-setup.sh`
