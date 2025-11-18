# Account Store Manual QA Guide

## Story 5.2: Update auth.ts State Management

### Test Environment Setup

**Prerequisites:**
- MT5 service running on Windows machine (vms.tnm.local:8000)
- ngrok tunnel active: `https://indeterminedly-crablike-dorinda.ngrok-free.dev`
- Supabase project: `edzkorfdixvvvrkfzqzg`
- Frontend dev server running
- Valid MT5 demo account credentials

**Test Account Credentials (Demo):**
- Login: 98839540
- Server: MetaQuotes-Demo
- Broker: MetaQuotes
- Platform: MT5

---

## Test Suite 1: addAccount Flow (AC1)

### Test 1.1: Successful Account Connection

**Steps:**
1. Navigate to Account Management page
2. Click "Connect New Account" button
3. Fill in form:
   - Platform: MT5
   - Broker: MetaQuotes
   - Server: MetaQuotes-Demo
   - Login: 98839540
   - Password: [valid password]
4. Click "Test Connection" button

**Expected Results:**
- `isConnecting` flag shows loading state in UI
- "Test Connection" button shows spinner
- Success toast appears: "Connection successful"
- No account persisted yet (test only)

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

### Test 1.2: Successful Account Persistence

**Steps:**
1. After successful test connection (Test 1.1)
2. Click "Connect Account" button

**Expected Results:**
- `isConnecting` flag shows loading state
- Edge function `connect-mt5-account` is invoked
- Account appears in LinkedAccountsList
- Success toast: "Account connected successfully"
- `accounts` array updated with new account
- `selectedAccount` set to newly added account
- `isConnecting` resets to false

**Verification:**
```javascript
// Open browser DevTools console
const store = useAccountStore.getState();
console.log('Accounts:', store.accounts);
console.log('Selected:', store.selectedAccount);
console.log('isConnecting:', store.isConnecting);
```

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

### Test 1.3: Invalid Credentials Error

**Steps:**
1. Fill in connection form with invalid password
2. Click "Test Connection"

**Expected Results:**
- Error toast appears with specific error message
- `isConnecting` resets to false
- No account added to store
- Form remains open with error displayed

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

### Test 1.4: Network Error Handling

**Steps:**
1. Stop ngrok tunnel or MT5 service
2. Attempt to connect account

**Expected Results:**
- Error toast appears
- `isConnecting` resets to false even on network failure
- No partial/corrupted state in store
- User can retry connection

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

## Test Suite 2: syncAccount Flow (AC2)

### Test 2.1: Successful Manual Sync

**Steps:**
1. Ensure at least one account is connected
2. Click "Sync" button on account card
3. Wait for sync to complete

**Expected Results:**
- Sync button shows loading spinner
- Edge function `sync-trading-data` invoked with `account_id`
- `lastSyncTime[accountId]` updated to current timestamp
- `syncErrors[accountId]` cleared (empty string)
- Account data refreshed (balance, equity, etc.)
- Success toast: "Account synced successfully"

**Verification:**
```javascript
const store = useAccountStore.getState();
const status = store.getAccountStatus('account-id-here');
console.log('Last sync:', status.lastSync);
console.log('Error:', status.error);
console.log('Is active:', status.isActive);
```

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

### Test 2.2: Sync Failure Handling

**Steps:**
1. Stop MT5 service
2. Attempt to sync account
3. Check error state

**Expected Results:**
- Error toast appears with meaningful message
- `syncErrors[accountId]` populated with error message
- `lastSyncTime[accountId]` NOT updated
- Previous account data remains (no corruption)
- Error badge visible in UI

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

### Test 2.3: Sync Error Recovery

**Steps:**
1. After Test 2.2 (with sync error)
2. Restart MT5 service
3. Click sync again

**Expected Results:**
- Previous error cleared before new sync attempt
- Sync succeeds this time
- `syncErrors[accountId]` cleared
- `lastSyncTime[accountId]` updated
- Success toast appears

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

## Test Suite 3: deleteAccount Flow (AC2)

### Test 3.1: Delete Non-Selected Account

**Steps:**
1. Have 2+ accounts connected
2. Select account A
3. Delete account B (different from selected)

**Expected Results:**
- Confirmation dialog appears
- Account B removed from `accounts` array
- Account B's `lastSyncTime` entry removed
- Account B's `syncErrors` entry removed
- `selectedAccount` remains account A (unchanged)
- Success toast appears

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

### Test 3.2: Delete Selected Account

**Steps:**
1. Have 2+ accounts connected
2. Select and delete account A
3. Observe new selection

**Expected Results:**
- Account A removed
- `selectedAccount` auto-switches to first remaining account
- Sync state for deleted account cleaned up
- No errors in console

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

### Test 3.3: Delete Last Account

**Steps:**
1. Delete all accounts until only one remains
2. Delete the final account

**Expected Results:**
- `accounts` array becomes empty
- `selectedAccount` becomes null
- `lastSyncTime` becomes empty object
- `syncErrors` becomes empty object
- UI shows "No accounts connected" state

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

## Test Suite 4: State Consistency (AC3, AC4)

### Test 4.1: getAccountStatus Accuracy

**Steps:**
1. Connect an account
2. Sync it successfully
3. Call `getAccountStatus(accountId)`
4. Trigger a sync error
5. Call `getAccountStatus(accountId)` again

**Expected Results:**
- After successful sync: `lastSync` is Date, `error` is empty, `isActive` is true
- After sync error: `error` is populated, `lastSync` unchanged, `isActive` still true

**Verification:**
```javascript
const store = useAccountStore.getState();
const status = store.getAccountStatus('account-id');
console.log(JSON.stringify(status, null, 2));
```

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

### Test 4.2: refreshAccountData Alias

**Steps:**
1. Call `refreshAccountData(accountId)`
2. Verify it behaves identically to `syncAccount(accountId)`

**Expected Results:**
- Same edge function invoked
- Same state updates
- Same error handling

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

## Test Suite 5: UI Integration (AC4)

### Test 5.1: AccountLinkForm Observes Store State

**Steps:**
1. Open AccountLinkForm
2. Observe `isConnecting` flag during connection
3. Check that form disables during connection

**Expected Results:**
- Form inputs disabled when `isConnecting` is true
- Submit button shows loading spinner
- Form re-enables after success/failure

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

### Test 5.2: LinkedAccountsList Shows Sync State

**Steps:**
1. In LinkedAccountsList component
2. Observe sync status badges for each account
3. Trigger sync and watch state updates

**Expected Results:**
- Last sync time displayed correctly
- Error badges appear when `syncErrors` populated
- Loading states visible during sync operations

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

## Test Suite 6: Error Edge Cases

### Test 6.1: Concurrent Operations

**Steps:**
1. Trigger sync on account A
2. Immediately trigger sync on account B (before A completes)
3. Observe both complete independently

**Expected Results:**
- Both syncs execute without interference
- Each account's sync state updated independently
- No race conditions or state corruption

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

### Test 6.2: Session Expiry During Operation

**Steps:**
1. Start account connection flow
2. Manually expire session (sign out in another tab)
3. Complete connection attempt

**Expected Results:**
- Authentication error handled gracefully
- User redirected to login or shown auth error
- No uncaught exceptions

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue):

---

## Test Results Summary

**Date Tested:** _______________  
**Tester:** _______________  
**Environment:** [ ] Local (ngrok) [ ] Staging [ ] Production

**Overall Results:**
- Tests Passed: ____ / ____
- Tests Failed: ____ / ____
- Blockers Found: ____

**Critical Issues:**
1. _______________________________
2. _______________________________
3. _______________________________

**Notes:**
_____________________________________
_____________________________________
_____________________________________

---

## Automated Test Coverage

Run automated tests before manual QA:

```bash
# Run account store tests
npm run test -- auth.account.test.ts

# Expected output:
# ✓ useAccountStore - Account Management
#   ✓ loadAccounts
#   ✓ addAccount - AC1
#   ✓ syncAccount - AC2
#   ✓ removeAccount (deleteAccount) - AC2
#   ✓ refreshAccountData - AC2
#   ✓ getAccountStatus - AC2, AC3
#   ✓ State Management - AC3
#   ✓ Error Handling - AC4
```

**Automated Test Results:**
- [ ] All tests passing
- [ ] Some tests failing (list below):

**Console Output:**
```
Paste test results here
```

---

## Debug Logging

Enable verbose logging during manual QA:

```javascript
// In browser console
localStorage.setItem('DEBUG', 'account:*');

// Observe logs during operations
// Look for:
// - 🔄 Calling sync-trading-data edge function
// - ✅ Sync successful
// - ❌ Error syncing account
// - 📦 Edge function response
```

**Debug Log Samples:**
Attach relevant logs for any failing tests in `docs/QA/logs/` directory.

---

## Sign-off

**Developer:** _______________  **Date:** _______________  
**QA Lead:** _______________  **Date:** _______________  
**Product Owner:** _______________  **Date:** _______________

**Ready for Production:** [ ] Yes [ ] No

**Deployment Notes:**
_____________________________________
_____________________________________
