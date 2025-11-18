import os
from supabase import create_client, Client

# Supabase configuration
supabase_url = "https://edzkorfdixvvvrkfzqzg.supabase.co"
supabase_service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkemtvcmZkaXh2dnZya2Z6cXpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzczMzE1NCwiZXhwIjoyMDczMzA5MTU0fQ.wXYZe0nVRfBxny9EnWxM1svAhWyHBs_CC7i_cwLBq1Q"

supabase: Client = create_client(supabase_url, supabase_service_key)

print("🔄 Reading migration file...")
migration_path = os.path.join(os.path.dirname(__file__), '../supabase/migrations/20251114155316_add_is_default_to_trading_accounts.sql')
with open(migration_path, 'r') as f:
    migration_sql = f.read()

print(f"📝 Migration SQL length: {len(migration_sql)} characters\n")

# Execute each major statement separately
statements = [
    # 1. Add column
    """ALTER TABLE public.trading_accounts 
    ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;""",
    
    # 2. Create index
    """CREATE INDEX IF NOT EXISTS idx_trading_accounts_is_default 
    ON public.trading_accounts(user_id, is_default) 
    WHERE is_default = true;""",
    
    # 3. Add comment
    """COMMENT ON COLUMN public.trading_accounts.is_default IS 'Indicates if this is the default account for positions display. Only one account per user should be default.';""",
    
    # 4. Create function
    """CREATE OR REPLACE FUNCTION ensure_single_default_account()
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
    $$ LANGUAGE plpgsql;""",
    
    # 5. Create trigger
    """DROP TRIGGER IF EXISTS enforce_single_default_account ON public.trading_accounts;
    CREATE TRIGGER enforce_single_default_account
      BEFORE INSERT OR UPDATE ON public.trading_accounts
      FOR EACH ROW
      EXECUTE FUNCTION ensure_single_default_account();"""
]

for i, statement in enumerate(statements, 1):
    print(f"\n[{i}/{len(statements)}] Executing:")
    print(f"  {statement[:80]}...")
    
    try:
        # Use the PostgREST API directly for DDL statements
        result = supabase.rpc('exec_sql', {'sql_query': statement}).execute()
        print("  ✅ Success")
    except Exception as e:
        # If RPC doesn't work, that's expected - Supabase doesn't expose raw SQL execution via REST API
        error_msg = str(e)
        if 'function public.exec_sql' in error_msg or 'Could not find the function' in error_msg:
            print("  ⚠️  Direct SQL execution not available via REST API")
            print("  ℹ️  Please apply migration manually via Supabase Dashboard > SQL Editor")
        else:
            print(f"  ❌ Error: {error_msg}")

print("\n" + "="*60)
print("📋 MIGRATION INSTRUCTIONS:")
print("="*60)
print("\nThe migration cannot be applied programmatically via the REST API.")
print("Please follow these steps:\n")
print("1. Go to: https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/sql/new")
print("2. Copy the entire content from:")
print("   d:\\tnm\\tnm_concept\\supabase\\migrations\\20251114155316_add_is_default_to_trading_accounts.sql")
print("3. Paste it into the SQL Editor")
print("4. Click 'Run' button")
print("\nOr use the Supabase CLI:")
print("   supabase db push")
print("\n" + "="*60)

# Try to verify if column already exists
print("\n🔍 Checking if migration already applied...")
try:
    result = supabase.table('trading_accounts').select('is_default').limit(1).execute()
    print("✅ SUCCESS! The 'is_default' column already exists!")
    print("   Migration has been applied successfully.")
except Exception as e:
    if 'does not exist' in str(e):
        print("⚠️  The 'is_default' column does not exist yet.")
        print("   Please apply the migration using the instructions above.")
    else:
        print(f"ℹ️  Could not verify: {str(e)}")
