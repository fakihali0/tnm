# Verify Migration Applied Successfully
# Checks that all schema changes are in place

param(
    [string]$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY
)

if (-not $ServiceRoleKey) {
    Write-Error "Service role key required."
    exit 1
}

$supabaseUrl = "https://edzkorfdixvvvrkfzqzg.supabase.co"
$headers = @{
    "apikey" = $ServiceRoleKey
    "Authorization" = "Bearer $ServiceRoleKey"
    "Content-Type" = "application/json"
}

Write-Host "================================" -ForegroundColor Cyan
Write-Host "VERIFYING MIGRATION" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Verify new columns in trading_accounts
Write-Host "Checking trading_accounts columns..." -ForegroundColor Yellow
$expectedColumns = @(
    'mt5_service_account_id',
    'last_connection_error',
    'last_successful_sync_at',
    'sync_failure_count',
    'broker_server_time_offset'
)

try {
    $accounts = Invoke-RestMethod `
        -Uri "$supabaseUrl/rest/v1/trading_accounts?select=*&limit=1" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    $accountProps = ($accounts | Select-Object -First 1).PSObject.Properties.Name
    
    foreach ($col in $expectedColumns) {
        if ($accountProps -contains $col) {
            Write-Host "  ✓ $col" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $col (MISSING)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "  ✗ Failed to check columns: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Check 2: Verify sync_logs table exists
Write-Host "Checking sync_logs table..." -ForegroundColor Yellow
try {
    $syncLogs = Invoke-RestMethod `
        -Uri "$supabaseUrl/rest/v1/sync_logs?select=*&limit=1" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "  ✓ sync_logs table exists" -ForegroundColor Green
} catch {
    Write-Host "  ✗ sync_logs table not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "VERIFICATION COMPLETE" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Test connect-mt5-account edge function" -ForegroundColor Gray
Write-Host "2. Test sync-trading-data edge function" -ForegroundColor Gray
Write-Host "3. Update sprint status (Story 4-3 complete)" -ForegroundColor Gray
