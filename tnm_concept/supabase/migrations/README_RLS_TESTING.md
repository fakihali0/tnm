# Story 4-4: RLS Policies Update - Testing Guide

## Overview

This document provides testing procedures to verify Row Level Security (RLS) policies for MT5 integration tables as per Story 4-4 acceptance criteria.

## Prerequisites

- Story 4-3 database schema applied
- Story 4-4 RLS migration applied
- Two test user accounts with different trading_accounts
- Supabase anon key and service role key available

## Test Environment Setup

### 1. Create Test Users (if not already exist)

```sql
-- Run in Supabase SQL Editor with service role

-- Test User 1
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test1@example.com',
  crypt('password123', gen_salt('bf')),
  now()
);

-- Test User 2  
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'test2@example.com',
  crypt('password123', gen_salt('bf')),
  now()
);
```

### 2. Create Test Trading Accounts

```sql
-- Test account for User 1
INSERT INTO public.trading_accounts (user_id, broker_name, login_number, server, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Test Broker',
  '12345',
  'TestServer-Demo',
  true
);

-- Test account for User 2
INSERT INTO public.trading_accounts (user_id, broker_name, login_number, server, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Test Broker',
  '67890',
  'TestServer-Demo',
  true
);
```

## Test Cases

### Test 1: Verify trading_accounts RLS (AC:1)

**Objective:** Users can only view/modify their own trading accounts

#### Test 1.1: SELECT with User 1

```bash
# Get User 1 JWT (use Supabase auth)
$user1Token = "USER_1_JWT_HERE"
$anonKey = "YOUR_ANON_KEY"
$url = "https://edzkorfdixvvvrkfzqzg.supabase.co/rest/v1/trading_accounts?select=*"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $user1Token"
}

Invoke-RestMethod -Uri $url -Method Get -Headers $headers | ConvertTo-Json -Depth 5
```

**Expected:** Returns only User 1's accounts (login_number: 12345)

#### Test 1.2: SELECT with User 2

```bash
# Repeat with User 2 JWT
$user2Token = "USER_2_JWT_HERE"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $user2Token"
}

Invoke-RestMethod -Uri $url -Method Get -Headers $headers | ConvertTo-Json -Depth 5
```

**Expected:** Returns only User 2's accounts (login_number: 67890)

#### Test 1.3: INSERT as wrong user (should fail)

```bash
# Try to insert account for User 2 while authenticated as User 1
$body = @{
    user_id = "00000000-0000-0000-0000-000000000002"
    broker_name = "Malicious Broker"
    login_number = "99999"
    server = "Hacked-Server"
    is_active = $true
} | ConvertTo-Json

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $user1Token"
    "Content-Type" = "application/json"
}

try {
    Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
    Write-Host "FAIL: Should have been rejected" -ForegroundColor Red
} catch {
    Write-Host "PASS: Correctly rejected cross-user insert" -ForegroundColor Green
}
```

**Expected:** 403 Forbidden or policy violation error

### Test 2: Verify trades RLS (AC:2)

**Objective:** Users can only view trades from accounts they own

#### Test 2.1: Create test trades

```sql
-- Create trades for both users' accounts
INSERT INTO public.trades (account_id, ticket, symbol, profit)
SELECT id, 1001, 'EURUSD', 100.00
FROM public.trading_accounts
WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

INSERT INTO public.trades (account_id, ticket, symbol, profit)
SELECT id, 2001, 'GBPUSD', 200.00
FROM public.trading_accounts
WHERE user_id = '00000000-0000-0000-0000-000000000002'::uuid
LIMIT 1;
```

#### Test 2.2: Query trades as User 1

```bash
$url = "https://edzkorfdixvvvrkfzqzg.supabase.co/rest/v1/trades?select=*"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $user1Token"
}

$result = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
Write-Host "User 1 sees $($result.Count) trades" -ForegroundColor Cyan
$result | ConvertTo-Json -Depth 5
```

**Expected:** Returns only trades with ticket 1001 (EURUSD)

#### Test 2.3: Query trades as User 2

```bash
$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $user2Token"
}

$result = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
Write-Host "User 2 sees $($result.Count) trades" -ForegroundColor Cyan
$result | ConvertTo-Json -Depth 5
```

**Expected:** Returns only trades with ticket 2001 (GBPUSD)

### Test 3: Verify sync_logs RLS (AC:3)

**Objective:** Users can view sync logs only for their accounts; only service role can insert

#### Test 3.1: Create test sync logs (using service role)

```sql
-- Insert sync logs for both users' accounts
INSERT INTO public.sync_logs (account_id, sync_type, status, trades_synced, duration_ms)
SELECT id, 'scheduled', 'success', 10, 1500
FROM public.trading_accounts
WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 1;

INSERT INTO public.sync_logs (account_id, sync_type, status, trades_synced, duration_ms)
SELECT id, 'scheduled', 'success', 20, 2000
FROM public.trading_accounts
WHERE user_id = '00000000-0000-0000-0000-000000000002'::uuid
LIMIT 1;
```

#### Test 3.2: Query sync_logs as User 1

```bash
$url = "https://edzkorfdixvvvrkfzqzg.supabase.co/rest/v1/sync_logs?select=*"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $user1Token"
}

$result = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
Write-Host "User 1 sees $($result.Count) sync logs" -ForegroundColor Cyan
$result | ConvertTo-Json -Depth 5
```

**Expected:** Returns only logs for User 1's accounts (trades_synced: 10)

#### Test 3.3: Try to insert sync log as user (should fail)

```bash
$body = @{
    account_id = "USER_1_ACCOUNT_ID"
    sync_type = "manual"
    status = "success"
    trades_synced = 99
} | ConvertTo-Json

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $user1Token"
    "Content-Type" = "application/json"
}

try {
    Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
    Write-Host "FAIL: Users should not be able to insert sync logs" -ForegroundColor Red
} catch {
    Write-Host "PASS: Correctly rejected user insert to sync_logs" -ForegroundColor Green
}
```

**Expected:** 403 Forbidden (only service role can insert)

### Test 4: Verify Service Role Bypass (AC:4)

**Objective:** Service role can access all data regardless of RLS

```bash
$serviceRoleKey = "YOUR_SERVICE_ROLE_KEY"
$url = "https://edzkorfdixvvvrkfzqzg.supabase.co/rest/v1/trading_accounts?select=*"

$headers = @{
    "apikey" = $serviceRoleKey
    "Authorization" = "Bearer $serviceRoleKey"
}

$result = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
Write-Host "Service role sees $($result.Count) accounts (all users)" -ForegroundColor Cyan
```

**Expected:** Returns all trading accounts (both User 1 and User 2)

### Test 5: Verify Edge Function Integration

**Objective:** Edge functions can operate on any user's data via service role

#### Test 5.1: Test connect-mt5-account (Story 4-1)

```bash
# Call edge function as User 1
$url = "https://edzkorfdixvvvrkfzqzg.supabase.co/functions/v1/connect-mt5-account"

$body = @{
    login = "12345"
    password = "test_password"
    server = "TestServer-Demo"
    broker = "Test Broker"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $user1Token"
    "Content-Type" = "application/json"
}

$result = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
$result | ConvertTo-Json -Depth 5
```

**Expected:** Edge function can update trading_accounts using service role

## Automated Test Script

Create `test-rls-policies.ps1`:

```powershell
# Story 4-4 RLS Testing Script
param(
    [string]$User1Token,
    [string]$User2Token,
    [string]$AnonKey,
    [string]$ServiceRoleKey
)

$baseUrl = "https://edzkorfdixvvvrkfzqzg.supabase.co/rest/v1"
$passCount = 0
$failCount = 0

function Test-Endpoint {
    param($Name, $Url, $Token, $ExpectedCount, $Method = "Get")
    
    Write-Host "`nTest: $Name" -ForegroundColor Cyan
    
    $headers = @{
        "apikey" = $AnonKey
        "Authorization" = "Bearer $Token"
    }
    
    try {
        $result = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers
        $count = if ($result -is [Array]) { $result.Count } else { 1 }
        
        if ($count -eq $ExpectedCount) {
            Write-Host "  ✓ PASS: Expected $ExpectedCount, got $count" -ForegroundColor Green
            $script:passCount++
        } else {
            Write-Host "  ✗ FAIL: Expected $ExpectedCount, got $count" -ForegroundColor Red
            $script:failCount++
        }
    } catch {
        Write-Host "  ✗ FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $script:failCount++
    }
}

Write-Host "================================" -ForegroundColor Cyan
Write-Host "STORY 4-4 RLS POLICY TESTS" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Test trading_accounts isolation
Test-Endpoint "User 1 can see own accounts" "$baseUrl/trading_accounts?select=*" $User1Token 1
Test-Endpoint "User 2 can see own accounts" "$baseUrl/trading_accounts?select=*" $User2Token 1

# Test trades isolation  
Test-Endpoint "User 1 can see own trades" "$baseUrl/trades?select=*" $User1Token 1
Test-Endpoint "User 2 can see own trades" "$baseUrl/trades?select=*" $User2Token 1

# Test sync_logs isolation
Test-Endpoint "User 1 can see own sync logs" "$baseUrl/sync_logs?select=*" $User1Token 1
Test-Endpoint "User 2 can see own sync logs" "$baseUrl/sync_logs?select=*" $User2Token 1

# Test service role bypass
$headers = @{
    "apikey" = $ServiceRoleKey
    "Authorization" = "Bearer $ServiceRoleKey"
}
$allAccounts = Invoke-RestMethod -Uri "$baseUrl/trading_accounts?select=*" -Method Get -Headers $headers
Write-Host "`nTest: Service role can see all accounts" -ForegroundColor Cyan
if ($allAccounts.Count -ge 2) {
    Write-Host "  ✓ PASS: Service role sees all accounts ($($allAccounts.Count))" -ForegroundColor Green
    $script:passCount++
} else {
    Write-Host "  ✗ FAIL: Service role should see all accounts" -ForegroundColor Red
    $script:failCount++
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "RESULTS" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
```

## Verification Checklist

- [ ] Test 1.1: User 1 sees only own trading_accounts
- [ ] Test 1.2: User 2 sees only own trading_accounts  
- [ ] Test 1.3: Cross-user INSERT blocked
- [ ] Test 2.2: User 1 sees only own trades
- [ ] Test 2.3: User 2 sees only own trades
- [ ] Test 3.2: User 1 sees only own sync_logs
- [ ] Test 3.3: User INSERT to sync_logs blocked
- [ ] Test 4: Service role sees all data
- [ ] Test 5.1: Edge functions work via service role

## Success Criteria

- All isolation tests pass (users see only their data)
- Cross-user operations rejected
- Service role can access all data
- Edge functions operate successfully

## Cleanup

```sql
-- Delete test data
DELETE FROM public.sync_logs WHERE account_id IN (
  SELECT id FROM public.trading_accounts 
  WHERE user_id IN (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid
  )
);

DELETE FROM public.trades WHERE account_id IN (
  SELECT id FROM public.trading_accounts 
  WHERE user_id IN (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid
  )
);

DELETE FROM public.trading_accounts WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid
);

DELETE FROM auth.users WHERE id IN (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid
);
```
