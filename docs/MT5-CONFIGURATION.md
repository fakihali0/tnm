# MT5 Terminal Configuration

**Installation Date:** November 12, 2025  
**Status:** ✅ Installed and Connected

---

## Installation Details

### MT5 Terminal
- **Installation Path:** `C:\Program Files\MetaTrader 5\`
- **Executable:** `terminal64.exe`
- **File Size:** 126.4 MB
- **Install Date:** November 12, 2025

### Broker Configuration
- **Server:** MetaQuotes-Demo
- **Broker:** MetaQuotes Ltd.
- **Server Address:** demo.metaquotes.net

---

## Demo Account Credentials

**⚠️ IMPORTANT: These are demo credentials for development only**

```
Name:           AF FA
Account Type:   Forex Hedged USD
Server:         MetaQuotes-Demo
Login:          98839540
Password:       !4MhMzCe
Investor Pass:  _1DkDmRq
```

**Usage in Python:**
```python
import MetaTrader5 as mt5

# Initialize connection
if not mt5.initialize():
    print("MT5 initialization failed")
    mt5.shutdown()
    quit()

# Login to account
authorized = mt5.login(98839540, password="!4MhMzCe", server="MetaQuotes-Demo")
if not authorized:
    print("Login failed")
    mt5.shutdown()
    quit()

# Get account info
account_info = mt5.account_info()
print(f"Balance: ${account_info.balance}")
print(f"Equity: ${account_info.equity}")

mt5.shutdown()
```

---

## Command-Line Startup

### Standard Mode (with GUI)
```powershell
& "C:\Program Files\MetaTrader 5\terminal64.exe"
```

### Headless/Portable Mode (no GUI)
```powershell
& "C:\Program Files\MetaTrader 5\terminal64.exe" /portable
```

### With Configuration File
```powershell
& "C:\Program Files\MetaTrader 5\terminal64.exe" /portable /config:"C:\mt5-config\config.ini"
```

---

## Verification Commands

### Check Installation
```powershell
Test-Path "C:\Program Files\MetaTrader 5\terminal64.exe"
# Expected: True
```

### Check MT5 Process
```powershell
Get-Process terminal64 -ErrorAction SilentlyContinue
# Expected: terminal64 process running
```

### Python Connection Test (requires Python + MetaTrader5 package from Story 1.3)
```python
import MetaTrader5 as mt5
print(mt5.initialize())  # Expected: True
print(mt5.terminal_info().connected)  # Expected: True
mt5.shutdown()
```

---

## Important Notes

### Security
- **Demo Account:** Safe for development - no real money at risk
- **Credentials:** Store in environment variables for production (Story 1.7)
- **Investor Password:** Read-only access password (_1DkDmRq)

### Dependencies
- ✅ **Story 1.1:** Windows machine with static IP (10.4.0.180)
- ✅ **Story 1.2:** MT5 Terminal installed ← **Current Story**
- ⏳ **Story 1.3:** Python 3.11+ with MetaTrader5 package (next)

### Known Limitations
- MT5 Terminal is Windows-only (no Mac/Linux native support)
- Initial setup requires GUI (cannot be fully automated)
- MT5 must be running for Python library to connect
- Broker connection requires internet access

---

## Next Steps

After Story 1.3 (Python setup), you'll be able to:
1. Connect to MT5 via Python: `mt5.initialize()`
2. Query account info: `mt5.account_info()`
3. Fetch market data: `mt5.copy_rates_from_pos()`
4. Place demo trades for testing

---

## Troubleshooting

### MT5 won't start
- Check Windows Firewall allows terminal64.exe
- Verify internet connection for broker server access
- Try running as administrator

### Python can't connect
- Ensure MT5 Terminal is running (check Task Manager)
- Verify MetaTrader5 package installed: `pip show MetaTrader5`
- Check mt5.last_error() for error details

### Broker connection failed
- Verify MetaQuotes-Demo server is selected in MT5
- Check account credentials match this document
- Ensure firewall allows outbound connections to demo.metaquotes.net

---

**Last Updated:** November 12, 2025  
**Story:** 1.2 - MT5 Terminal Installation and Headless Configuration
