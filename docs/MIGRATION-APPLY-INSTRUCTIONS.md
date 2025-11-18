# Apply Default Account Migration to Supabase

## Quick Steps

Since Supabase doesn't allow direct SQL execution via REST API for security reasons, follow these simple steps:

### Option 1: Supabase Dashboard (Recommended - 2 minutes)

1. **Open SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/sql/new
   - Or navigate: Supabase Dashboard → Your Project → SQL Editor → New Query

2. **Copy Migration SQL:**
   - Open file: `d:\tnm\tnm_concept\supabase\migrations\20251114155316_add_is_default_to_trading_accounts.sql`
   - Select all content (Ctrl+A)
   - Copy (Ctrl+C)

3. **Execute:**
   - Paste into SQL Editor
   - Click "Run" button (or Ctrl+Enter)
   - Wait for success message

4. **Verify:**
   - Run this query to verify:
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'trading_accounts' AND column_name = 'is_default';
   ```
   - Should show one row with column details

---

### Option 2: PowerShell Script (Alternative)

If you have PostgreSQL client tools installed, run:

```powershell
$env:PGPASSWORD = "your-database-password"
psql -h aws-0-us-east-1.pooler.supabase.com -p 6543 -d postgres -U postgres.edzkorfdixvvvrkfzqzg -f "d:\tnm\tnm_concept\supabase\migrations\20251114155316_add_is_default_to_trading_accounts.sql"
```

---

### Option 3: Supabase CLI (If Installed)

```powershell
cd d:\tnm\tnm_concept
supabase db push
```

---

## Migration Content Preview

The migration will:

1. ✅ Add `is_default` column to `trading_accounts` table
2. ✅ Create index for optimized queries
3. ✅ Add column documentation
4. ✅ Create trigger function to ensure single default per user
5. ✅ Create trigger to automatically enforce the rule

---

## After Migration

Once applied, the frontend will automatically:

- Show "Set as Default" button (star icon) on account cards
- Display "Default" badge on the default account
- Use the default account for positions display
- Persist the selection across app restarts

No code changes needed - everything is already implemented and ready to use!

---

## Need Help?

If you encounter any errors:

1. **Error: column already exists**
   - ✅ Migration was already applied - you're good!

2. **Error: permission denied**
   - Check you're logged into the correct Supabase project

3. **Error: syntax error**
   - Make sure you copied the entire SQL file content

---

## Quick Test After Migration

1. Open your app
2. Go to Linked Accounts section
3. Hover over any account card
4. Click the star icon ⭐
5. See "Default" badge appear
6. Check LivePositionsPanel shows that account's positions

Done! 🎉
