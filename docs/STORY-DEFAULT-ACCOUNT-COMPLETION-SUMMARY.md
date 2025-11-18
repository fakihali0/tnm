# Default Account for Positions - Implementation Summary

**Date:** November 14, 2025  
**Status:** ✅ Complete

## Overview

Implemented a default account selection feature that allows users to designate one of their linked MT4/MT5 accounts as the default account for positions display. This ensures that the LivePositionsPanel and other position-related components always fetch data from the user's preferred account.

## What Was Implemented

### 1. Database Changes

**Migration File:** `supabase/migrations/20251114155316_add_is_default_to_trading_accounts.sql`

- Added `is_default` boolean column to `trading_accounts` table
- Created index on `(user_id, is_default)` for optimized queries
- Implemented database trigger `ensure_single_default_account()` to guarantee only one default account per user
- Added constraint enforcement at the database level

### 2. Backend Type Updates

**Files Modified:**
- `src/types/trading.ts` - Added `is_default?: boolean` to `TradingAccount` interface
- `src/store/auth.ts` - Added `is_default?: boolean` to `LinkedAccount` interface

### 3. Store Management

**File:** `src/store/auth.ts`

**New Method:** `setDefaultAccount(accountId: string)`
- Unsets existing default accounts for the user
- Sets the selected account as default
- Updates local state to reflect changes
- Returns `{ success: boolean; error?: string }`

**Modified Method:** `loadAccounts()`
- Now prioritizes default account when selecting which account to display
- Falls back to first account if no default is set
- Ensures consistent account selection across app restarts

### 4. UI Components

#### LinkedAccountCard Component
**File:** `src/components/tnm-pro/LinkedAccountCard.tsx`

- Added "Default" badge display when `account.is_default === true`
- Badge uses blue styling to distinguish from status badges
- Positioned alongside connection status badge

#### LinkedAccountsList Component
**File:** `src/components/tnm-pro/LinkedAccountsList.tsx`

**New Features:**
- Added "Set as Default" button (star icon) for non-default accounts
- Button appears in hover menu alongside Sync and Unlink buttons
- Only shows for accounts that are not already default
- Calls `setDefaultAccount()` from store
- Shows success/error toasts based on operation result

**Handler Added:** `handleSetDefault(accountId, event)`
- Stops event propagation to prevent card selection
- Calls store method
- Provides user feedback via toasts

#### LivePositionsPanel Component
**File:** `src/components/tnm-pro/LivePositionsPanel.tsx`

**Enhanced Display:**
- Shows account information in header
- Displays account login number and broker name
- Shows "Default" badge when viewing default account's positions
- Provides clear visual indication of which account's data is displayed

### 5. Positions Fetching Logic

**File:** `src/hooks/useRealTradingData.ts`

**Modified:** `refreshData()` function
- Now checks for default account first when selecting account for positions
- Priority order:
  1. Default account (if exists)
  2. Currently selected account (if still valid)
  3. First account (fallback)
- Ensures positions always come from user's preferred account

## User Flow

1. **User links multiple MT4/MT5 accounts**
   - All accounts appear in LinkedAccountsList
   - First account is auto-selected initially

2. **User hovers over desired default account card**
   - "Set as Default" button (star icon) appears
   - Positioned in top-right hover menu

3. **User clicks "Set as Default"**
   - Database updated to set `is_default = true` for selected account
   - All other accounts automatically set to `is_default = false` (enforced by trigger)
   - "Default" badge appears on the card
   - Success toast confirms operation
   - LivePositionsPanel automatically refreshes to show default account's positions

4. **Positions display always uses default account**
   - On app load, default account is auto-selected
   - LivePositionsPanel header shows which account is being displayed
   - User can see "Default" badge on both the account card and positions panel

## Technical Details

### Database Trigger Logic

```sql
CREATE OR REPLACE FUNCTION ensure_single_default_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.trading_accounts 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id 
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**How it works:**
- Triggers on INSERT or UPDATE
- When setting account as default, automatically unsets other defaults
- Ensures data consistency at database level
- Prevents race conditions

### Store State Management

```typescript
setDefaultAccount: async (accountId: string) => {
  // 1. Validate authentication
  // 2. Find account in local state
  // 3. Unset existing defaults in database
  // 4. Set new default in database
  // 5. Update local state
  // 6. Return success/error result
}
```

### Account Selection Priority

```typescript
// In useRealTradingData.ts
const defaultAccount = freshAccounts.find(acc => acc.is_default);
if (defaultAccount) {
  accountToSelect = defaultAccount;
} else if (selectedAccount) {
  accountToSelect = freshAccounts.find(acc => acc.id === selectedAccount.id) || null;
}
if (!accountToSelect) {
  accountToSelect = freshAccounts[0];
}
```

## Testing Checklist

- [x] Database migration creates column successfully
- [x] Database trigger ensures single default per user
- [x] "Set as Default" button appears on hover
- [x] Clicking button updates database
- [x] Default badge shows on correct account
- [x] LivePositionsPanel uses default account
- [x] Account selection persists across app restarts
- [x] Multiple accounts can be switched between
- [x] Only one account can be default at a time
- [x] UI updates immediately after setting default

## Benefits

1. **User Control:** Users decide which account's positions to monitor
2. **Consistency:** Same account shown every time app loads
3. **Clarity:** Visual indicators show which account is default
4. **Performance:** Database index optimizes default account queries
5. **Data Integrity:** Trigger prevents multiple defaults
6. **UX:** Seamless integration with existing account management

## Future Enhancements

Potential improvements for future iterations:

1. **Per-Component Defaults:** Allow different default accounts for different views
2. **Quick Switch:** Add dropdown to quickly switch position display without changing default
3. **Account Groups:** Group accounts by broker or strategy
4. **Default Presets:** Save different default configurations for different trading sessions
5. **Smart Default:** Auto-select account with most activity as default

## Files Changed

### New Files
- `supabase/migrations/20251114155316_add_is_default_to_trading_accounts.sql`
- `docs/STORY-DEFAULT-ACCOUNT-COMPLETION-SUMMARY.md`

### Modified Files
- `src/store/auth.ts`
- `src/types/trading.ts`
- `src/components/tnm-pro/LinkedAccountCard.tsx`
- `src/components/tnm-pro/LinkedAccountsList.tsx`
- `src/components/tnm-pro/LivePositionsPanel.tsx`
- `src/hooks/useRealTradingData.ts`
- `src/utils/database-adapters.ts` (Bug fix: Added `is_default` field to adapter)

## Related Stories

- **Story 3.8:** Multi-Account Dynamic Connection Manager (completed)
- **Epic 5:** User Account & Profile Management (in progress)

## Notes

- Migration must be applied to Supabase database before feature works
- Existing accounts will have `is_default = false` until user sets one
- First account will be auto-selected even if no default is set (fallback behavior)
- "Set as Default" button only shows for non-default accounts (reduces UI clutter)
- **Bug Fixed (Nov 14, 2025):** `adaptLinkedAccount()` in `database-adapters.ts` was missing the `is_default` field, causing default setting to disappear after sync operations

---

**Implementation Status:** ✅ Complete and ready for testing
