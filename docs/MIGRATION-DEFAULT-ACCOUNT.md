# How to Apply the Default Account Migration

## Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/20251114155316_add_is_default_to_trading_accounts.sql`
5. Click **Run** to execute the migration

## Option 2: Supabase CLI (If installed)

```powershell
cd d:\tnm\tnm_concept
supabase db push
```

## What the Migration Does

- ✅ Adds `is_default` column to `trading_accounts` table
- ✅ Creates database index for optimized queries
- ✅ Implements trigger to ensure only one default account per user
- ✅ Adds column documentation

## Verification

After applying the migration, verify it worked:

```sql
-- Check if column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'trading_accounts' 
AND column_name = 'is_default';

-- Check if trigger exists
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'trading_accounts' 
AND trigger_name = 'enforce_single_default_account';
```

## Testing the Feature

1. Open the TNM app
2. Navigate to Settings → Linked Accounts
3. Hover over any account card
4. Click the star icon ⭐ to set as default
5. Verify the "Default" badge appears
6. Check LivePositionsPanel shows the default account's data
7. Try setting a different account as default
8. Verify only one account has the "Default" badge at a time

## Rollback (If Needed)

If you need to undo the migration:

```sql
-- Remove the trigger
DROP TRIGGER IF EXISTS enforce_single_default_account ON public.trading_accounts;
DROP FUNCTION IF EXISTS ensure_single_default_account();

-- Remove the index
DROP INDEX IF EXISTS idx_trading_accounts_is_default;

-- Remove the column
ALTER TABLE public.trading_accounts DROP COLUMN IF EXISTS is_default;
```
