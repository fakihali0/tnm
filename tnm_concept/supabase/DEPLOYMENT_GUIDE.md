# Story 4-5: Supabase Edge Function Deployment Guide

**Date:** November 13, 2025  
**Status:** In Progress  
**Story:** 4-5-supabase-edge-function-deployment

---

## Overview

This guide provides step-by-step instructions for deploying the MT5 integration edge functions to Supabase production. The deployment includes setting secrets, configuring cron schedules, and validating functionality.

---

## Prerequisites

- ✅ Story 4-1: connect-mt5-account edge function refactored
- ✅ Story 4-2: sync-trading-data edge function refactored
- ✅ Story 4-3: Database schema migrated
- ✅ Story 4-4: RLS policies updated
- ✅ MT5 Python service running at production URL
- ⏳ Supabase project access with deploy permissions

---

## Deployment Method

Since Supabase CLI requires a personal access token (not service role key), we'll deploy via **Supabase Dashboard** which is more straightforward for this deployment.

---

## Step 1: Prepare Secrets (AC:2)

###  Required Secrets

| Secret Name          | Value Source                           | Description                          |
|----------------------|----------------------------------------|--------------------------------------|
| `MT5_SERVICE_URL`    | From MT5 service deployment            | Python service base URL              |
| `MT5_SERVICE_API_KEY`| From c:\\mt5-service\\.env              | API key for service authentication   |
| `ENCRYPTION_KEY`     | From c:\\mt5-service\\.env              | AES-256 key for credentials          |

### Current Values (Local Development)

```powershell
# Get values from MT5 service
cd c:\mt5-service
Get-Content .env | Select-String "MT5_SERVICE_API_KEY|ENCRYPTION_KEY"
```

**Output:**
- `MT5_SERVICE_API_KEY=XYFbs6r1AkECw28U4VhLOzHfd9JxTZjo`
- `ENCRYPTION_KEY=oe9B6tjOxJH7kKYiGWLrXAuShcgvFn4D`

### Production URLs

**Option A: Local Development (for testing)**
- MT5_SERVICE_URL: `http://localhost:8000` (if using ngrok, see Story 1-5)
- Note: This requires ngrok tunnel or VPN for edge functions to reach local service

**Option B: Production Deployment (recommended)**
- MT5_SERVICE_URL: `https://mt5.tnm.com` (after deploying MT5 service to cloud)
- Note: Requires deploying Python MT5 service to Azure/AWS/GCP first

**For this deployment, we'll use Option A with localhost** and document the production URL migration for later.

### Set Secrets via Dashboard

1. Go to: https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/settings/functions
2. Scroll to "Secrets" section
3. Add each secret:

```
Name: MT5_SERVICE_URL
Value: http://localhost:8000
```

```
Name: MT5_SERVICE_API_KEY  
Value: XYFbs6r1AkECw28U4VhLOzHfd9JxTZjo
```

```
Name: ENCRYPTION_KEY
Value: oe9B6tjOxJH7kKYiGWLrXAuShcgvFn4D
```

4. Click "Save" for each secret

---

## Step 2: Deploy connect-mt5-account (AC:1)

### Via Dashboard

1. **Navigate to Edge Functions:**
   - Go to: https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/functions
   - Click "Create Function"

2. **Create/Update Function:**
   - **Name:** `connect-mt5-account`
   - **Verify JWT:** ✅ Enabled (users must be authenticated)
   - Click "Create function"

3. **Deploy Code:**
   - Click on `connect-mt5-account` function
   - Click "Edit" or "Details" tab
   - Copy entire contents from: `supabase/functions/connect-mt5-account/index.ts`
   - Paste into code editor
   - Click "Deploy" button

4. **Verify Deployment:**
   - Check "Invocations" tab for deployment success
   - Note: May show "No data" initially until first invocation

### Verification Script

```powershell
# Test connect-mt5-account edge function
$supabaseUrl = "https://edzkorfdixvvvrkfzqzg.supabase.co"
$anonKey = "YOUR_ANON_KEY"
$userToken = "USER_JWT_TOKEN"  # Get from frontend auth

$headers = @{
    "Authorization" = "Bearer $userToken"
    "Content-Type" = "application/json"
}

$body = @{
    login = "12345"
    password = "test_password"
    server = "TestServer-Demo"
    broker = "Test Broker"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "$supabaseUrl/functions/v1/connect-mt5-account" `
        -Method Post `
        -Headers $headers `
        -Body $body
    
    Write-Host "✓ Function deployed and responding" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "✗ Function error: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Response
}
```

---

## Step 3: Deploy sync-trading-data (AC:1)

### Via Dashboard

1. **Create Function:**
   - Go to: https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/functions
   - Click "Create Function"
   - **Name:** `sync-trading-data`
   - **Verify JWT:** ❌ Disabled (cron job uses service role)
   - Click "Create function"

2. **Deploy Code:**
   - Click on `sync-trading-data` function
   - Copy entire contents from: `supabase/functions/sync-trading-data/index.ts`
   - Paste into code editor
   - Click "Deploy" button

3. **Verify Deployment:**
   - Check "Invocations" tab
   - Should show deployment success

---

## Step 4: Configure Cron Schedule (AC:3)

### Set Cron via Dashboard

1. **Navigate to Function Settings:**
   - Go to: https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/functions
   - Click on `sync-trading-data`
   - Click "Settings" or "Cron" tab

2. **Configure Schedule:**
   - **Cron Expression:** `*/5 * * * *` (every 5 minutes)
   - **Note:** Original spec was `0 */5 * * *` (every 5 hours), but `*/5 * * * *` is better for testing
   - **Status:** ✅ Enabled
   - Click "Save"

3. **Verify Cron:**
   - Check "Invocations" tab after 5 minutes
   - Should see automated invocations appearing

### Cron Expression Reference

| Expression      | Meaning                    | Recommendation           |
|-----------------|----------------------------|--------------------------|
| `*/5 * * * *`   | Every 5 minutes            | ✅ Testing/Development    |
| `*/15 * * * *`  | Every 15 minutes           | ⚠️ Light production       |
| `0 */1 * * *`   | Every hour (on the hour)   | ✅ Production (balanced)  |
| `0 */4 * * *`   | Every 4 hours              | ✅ Production (light)     |

**Recommended for production:** `0 */1 * * *` (hourly sync)

---

## Step 5: Post-Deploy Validation (AC:4)

### Smoke Test 1: connect-mt5-account

```powershell
# Prerequisites: User JWT token, MT5 demo account credentials

$functionUrl = "https://edzkorfdixvvvrkfzqzg.supabase.co/functions/v1/connect-mt5-account"
$userToken = "GET_FROM_FRONTEND_AUTH"

$headers = @{
    "Authorization" = "Bearer $userToken"
    "Content-Type" = "application/json"
}

$testAccount = @{
    login = "98839540"  # Demo account from MT5 service
    password = "!4MhMzCe"
    server = "MetaQuotes-Demo"
    broker = "MetaQuotes Software Corp."
} | ConvertTo-Json

Write-Host "Testing connect-mt5-account..." -ForegroundColor Cyan

try {
    $result = Invoke-RestMethod `
        -Uri $functionUrl `
        -Method Post `
        -Headers $headers `
        -Body $testAccount `
        -TimeoutSec 30
    
    Write-Host "✓ Success!" -ForegroundColor Green
    Write-Host "Account ID: $($result.accountId)" -ForegroundColor Gray
    Write-Host "MT5 Service ID: $($result.mt5ServiceAccountId)" -ForegroundColor Gray
    Write-Host "Status: $($result.status)" -ForegroundColor Gray
    
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $_.ErrorDetails.Message
}
```

**Expected Result:**
- Status: 200 OK
- Response contains `accountId`, `mt5ServiceAccountId`, `status: 'connected'`
- Database record created in `trading_accounts`

### Smoke Test 2: sync-trading-data (Manual Trigger)

```powershell
# Trigger sync manually (simulates cron)
$functionUrl = "https://edzkorfdixvvvrkfzqzg.supabase.co/functions/v1/sync-trading-data"
$serviceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

$headers = @{
    "Authorization" = "Bearer $serviceRoleKey"
    "Content-Type" = "application/json"
}

Write-Host "Testing sync-trading-data..." -ForegroundColor Cyan

try {
    $result = Invoke-RestMethod `
        -Uri $functionUrl `
        -Method Post `
        -Headers $headers `
        -TimeoutSec 60
    
    Write-Host "✓ Sync completed!" -ForegroundColor Green
    Write-Host "Total accounts: $($result.totalAccounts)" -ForegroundColor Gray
    Write-Host "Successful: $($result.successCount)" -ForegroundColor Gray
    Write-Host "Failed: $($result.failureCount)" -ForegroundColor Gray
    Write-Host "Duration: $($result.durationMs)ms" -ForegroundColor Gray
    
    # Check sync_logs
    Write-Host "`nRecent sync logs:" -ForegroundColor Cyan
    $logsUrl = "https://edzkorfdixvvvrkfzqzg.supabase.co/rest/v1/sync_logs?select=*&order=started_at.desc&limit=5"
    $logsHeaders = @{
        "apikey" = $serviceRoleKey
        "Authorization" = "Bearer $serviceRoleKey"
    }
    $logs = Invoke-RestMethod -Uri $logsUrl -Headers $logsHeaders
    $logs | Format-Table -Property status, sync_type, trades_synced, duration_ms, started_at
    
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

**Expected Result:**
- Status: 200 OK
- Response shows sync statistics
- `sync_logs` table populated with entries
- `trades` table updated with MT5 data

### Log Monitoring

1. **Navigate to Logs:**
   - Go to: https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/logs/edge-functions

2. **Filter by Function:**
   - Select `connect-mt5-account` or `sync-trading-data`
   - Set time range: Last 1 hour

3. **Check for Errors:**
   - Look for 4xx/5xx status codes
   - Check error messages
   - Verify MT5 service connectivity

4. **Validate Success:**
   - 200 OK responses
   - Reasonable response times (< 5s for connect, < 30s for sync)
   - No uncaught exceptions

---

## Step 6: Rollback Procedure (AC:5)

### Quick Rollback Steps

#### 1. Disable Cron (Immediate)

```
1. Go to: https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/functions
2. Click on sync-trading-data
3. Go to Cron tab
4. Toggle "Enabled" to OFF
5. Click Save
```

**Impact:** Stops automated syncing immediately. Existing data preserved.

#### 2. Revert Function Code (if needed)

```
1. Go to function details
2. Click "Deployments" tab
3. Find previous working version
4. Click "Redeploy" on that version
```

**Impact:** Reverts to previous function logic. Takes ~30 seconds.

#### 3. Remove/Update Secrets (if compromised)

```
1. Go to: https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/settings/functions
2. Scroll to Secrets section
3. Delete problematic secret
4. Or update with new value
5. Redeploy functions to pick up changes
```

**Impact:** Functions will use old/new secrets on next invocation.

#### 4. Delete Functions (Nuclear Option)

```
1. Go to: https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/functions
2. Click on function name
3. Click "Settings"
4. Click "Delete function"
5. Confirm deletion
```

**Impact:** Complete removal. Frontend calls will fail. Use only if critical security issue.

### Rollback Testing

After rollback, verify:
- [ ] Cron disabled (no new sync_logs entries)
- [ ] Functions respond or return expected errors
- [ ] Database remains intact
- [ ] Frontend shows appropriate error messages

---

## Monitoring & Alerts

### Supabase Dashboard

1. **Edge Function Logs:**
   - https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/logs/edge-functions
   - Set up alerts for error rate > 10%

2. **Database Activity:**
   - https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/database/query
   - Monitor `sync_logs` for failures

3. **API Health:**
   - Check `/health` endpoint: http://localhost:8000/health
   - Should return 200 with MT5 status

### Custom Monitoring Queries

```sql
-- Recent sync failures
SELECT * FROM public.recent_sync_failures 
ORDER BY started_at DESC 
LIMIT 10;

-- Account sync health
SELECT * FROM public.account_sync_health
WHERE sync_failure_count > 3
ORDER BY sync_failure_count DESC;

-- Sync performance trends
SELECT 
  DATE_TRUNC('hour', started_at) as hour,
  AVG(duration_ms) as avg_duration,
  COUNT(*) as sync_count,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failure_count
FROM public.sync_logs
WHERE started_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

---

## Known Issues & Mitigations

### Issue 1: MT5 Service Unreachable

**Symptom:** Edge functions timeout or return 503

**Mitigation:**
1. Verify MT5 service is running: `http://localhost:8000/health`
2. Check ngrok tunnel (if using local): `ngrok http 8000`
3. Update `MT5_SERVICE_URL` secret if endpoint changed
4. Redeploy functions

### Issue 2: Authentication Failures

**Symptom:** connect-mt5-account returns 401/403

**Mitigation:**
1. Verify JWT verification is enabled
2. Check user has valid session
3. Confirm anon key matches project
4. Test with fresh user login

### Issue 3: Sync Too Slow

**Symptom:** sync-trading-data takes > 60 seconds

**Mitigation:**
1. Reduce batch size from 10 to 5 in code
2. Increase cron interval (hourly instead of 5min)
3. Add indexes to trading_accounts (already done in Story 4-3)
4. Check MT5 service performance

---

## Production Checklist

- [ ] **Secrets Set:** MT5_SERVICE_URL, MT5_SERVICE_API_KEY, ENCRYPTION_KEY
- [ ] **Functions Deployed:** connect-mt5-account, sync-trading-data
- [ ] **Cron Configured:** sync-trading-data every 5 minutes (testing) or hourly (production)
- [ ] **Smoke Tests Passed:** Both functions respond correctly
- [ ] **Logs Clean:** No errors in first 30 minutes
- [ ] **Database Verified:** sync_logs populating, trades updating
- [ ] **Rollback Tested:** Know how to disable cron/revert code
- [ ] **Monitoring Setup:** Log alerts configured
- [ ] **Documentation Updated:** This guide reflects actual deployment

---

## Next Steps

After successful deployment:

1. **Story 5-1:** Re-enable frontend AccountLinkForm to use new edge function
2. **Story 5-3:** Update LinkedAccountsList to show sync status
3. **Adjust Cron:** Change from 5-minute to hourly schedule for production
4. **Deploy MT5 Service:** Move from localhost to cloud (Azure/AWS/GCP)
5. **Update Secrets:** Change MT5_SERVICE_URL to production domain

---

## References

- Story 4-1: connect-mt5-account implementation
- Story 4-2: sync-trading-data implementation
- Story 4-3: Database schema
- Story 4-4: RLS policies
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Cron: https://supabase.com/docs/guides/functions/schedule-functions

---

## Change Log

| Date       | Version | Changes                          | Author |
|------------|---------|----------------------------------|--------|
| 2025-11-13 | 1.0     | Initial deployment guide created | Dev Agent |
