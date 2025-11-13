# Apply Supabase Migration Script
# This script applies the MT5 integration schema updates to your Supabase database

param(
    [Parameter(Mandatory=$false)]
    [string]$ServiceRoleKey,
    
    [Parameter(Mandatory=$false)]
    [switch]$Rollback
)

# Load environment variables
$envFile = Join-Path $PSScriptRoot ".." ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^VITE_SUPABASE_URL="(.+)"$') {
            $supabaseUrl = $matches[1]
        }
    }
}

if (-not $supabaseUrl) {
    Write-Error "VITE_SUPABASE_URL not found in .env file"
    exit 1
}

# Check for service role key
if (-not $ServiceRoleKey) {
    if ($env:SUPABASE_SERVICE_ROLE_KEY) {
        $ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY
        Write-Host "Using service role key from environment variable" -ForegroundColor Green
    } else {
        Write-Host @"
SERVICE ROLE KEY REQUIRED
========================

To apply this migration, you need the Supabase Service Role Key.

You can find it in your Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg
2. Navigate to: Settings > API
3. Look for: 'service_role' key (NOT the 'anon' key)
4. Copy the key

Then run this script with:
  .\apply-migration.ps1 -ServiceRoleKey "your-service-role-key-here"

OR set it as an environment variable:
  `$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key-here"
  .\apply-migration.ps1

ALTERNATIVE METHOD (Manual):
===========================
1. Go to: https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/editor
2. Click "SQL Editor"
3. Copy the contents of:
   - migrations\20251113000000_mt5_integration_schema_updates.sql
4. Paste and run in the SQL Editor

"@ -ForegroundColor Yellow
        exit 1
    }
}

# Determine which migration to apply
if ($Rollback) {
    $migrationFile = Join-Path $PSScriptRoot "migrations" "20251113000001_mt5_integration_schema_rollback.sql"
    $action = "Rolling back"
} else {
    $migrationFile = Join-Path $PSScriptRoot "migrations" "20251113000000_mt5_integration_schema_updates.sql"
    $action = "Applying"
}

if (-not (Test-Path $migrationFile)) {
    Write-Error "Migration file not found: $migrationFile"
    exit 1
}

Write-Host "$action migration..." -ForegroundColor Cyan
Write-Host "Migration file: $migrationFile" -ForegroundColor Gray
Write-Host "Supabase URL: $supabaseUrl" -ForegroundColor Gray
Write-Host ""

# Read migration SQL
$migrationSql = Get-Content $migrationFile -Raw

# Apply migration using Supabase REST API
$apiUrl = "$supabaseUrl/rest/v1/rpc/exec_sql"
$headers = @{
    "apikey" = $ServiceRoleKey
    "Authorization" = "Bearer $ServiceRoleKey"
    "Content-Type" = "application/json"
}

# Since direct SQL execution via REST API isn't available, we need to use PostgREST
# Let's try using the pgadmin connection string approach instead

Write-Host "NOTE: Direct SQL execution via REST API requires additional setup." -ForegroundColor Yellow
Write-Host "Using alternative approach with psql..." -ForegroundColor Yellow
Write-Host ""

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if ($psqlPath) {
    Write-Host "Found psql, attempting to connect..." -ForegroundColor Green
    
    # Extract database details from Supabase URL
    $projectRef = ([Uri]$supabaseUrl).Host.Split('.')[0]
    $dbHost = "db.$projectRef.supabase.co"
    $dbPort = "5432"
    $dbName = "postgres"
    $dbUser = "postgres"
    
    Write-Host "Database Host: $dbHost" -ForegroundColor Gray
    Write-Host ""
    Write-Host "You will be prompted for the database password." -ForegroundColor Yellow
    Write-Host "Find it in: Supabase Dashboard > Settings > Database > Connection String" -ForegroundColor Yellow
    Write-Host ""
    
    # Set environment variable for password (will be prompted if not set)
    $env:PGPASSWORD = Read-Host "Enter database password" -AsSecureString | ConvertFrom-SecureString -AsPlainText
    
    # Execute migration
    $psqlCommand = "psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f `"$migrationFile`""
    Invoke-Expression $psqlCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Migration applied successfully!" -ForegroundColor Green
        
        # Run verification queries
        Write-Host ""
        Write-Host "Running verification queries..." -ForegroundColor Cyan
        
        $verifyFile = Join-Path $PSScriptRoot "migrations" "verify-migration.sql"
        @"
-- Verify MT5 integration schema updates

-- Check trading_accounts columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trading_accounts' 
  AND column_name IN ('mt5_service_account_id', 'last_connection_error', 'last_successful_sync_at', 'sync_failure_count', 'broker_server_time_offset')
ORDER BY column_name;

-- Check sync_logs table exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'sync_logs'
) as sync_logs_exists;

-- Check views exist
SELECT table_name 
FROM information_schema.views 
WHERE table_name IN ('recent_sync_failures', 'account_sync_health');
"@ | Out-File -FilePath $verifyFile -Encoding UTF8
        
        $env:PGPASSWORD = $env:PGPASSWORD
        Invoke-Expression "psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f `"$verifyFile`""
        
    } else {
        Write-Error "Migration failed with exit code: $LASTEXITCODE"
        exit 1
    }
} else {
    Write-Host @"
PSQL NOT FOUND
==============

PostgreSQL client (psql) is not installed or not in PATH.

OPTION 1: Install PostgreSQL
- Download from: https://www.postgresql.org/download/windows/
- Or use: winget install PostgreSQL.PostgreSQL

OPTION 2: Manual Application (Easiest)
1. Go to: https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/editor
2. Click "SQL Editor" in the left sidebar
3. Open file: $migrationFile
4. Copy ALL contents
5. Paste into SQL Editor
6. Click "Run" button

OPTION 3: Use Supabase CLI
- Install: npm install -g supabase
- Link project: supabase link --project-ref edzkorfdixvvvrkfzqzg
- Apply: supabase db push

"@ -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Migration process complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Verify the changes in Supabase Dashboard > Table Editor" -ForegroundColor Gray
Write-Host "2. Test edge functions (connect-mt5-account, sync-trading-data)" -ForegroundColor Gray
Write-Host "3. Check deployment status: supabase functions deploy" -ForegroundColor Gray
