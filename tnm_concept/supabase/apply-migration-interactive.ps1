# Apply Migration to Supabase Database
# Executes the MT5 integration schema updates

param(
    [string]$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY,
    [string]$MigrationFile = "migrations\20251113000000_mt5_integration_schema_updates.sql"
)

if (-not $ServiceRoleKey) {
    Write-Error "Service role key required. Pass as parameter or set SUPABASE_SERVICE_ROLE_KEY environment variable."
    exit 1
}

$migrationPath = Join-Path $PSScriptRoot $MigrationFile
if (-not (Test-Path $migrationPath)) {
    Write-Error "Migration file not found: $migrationPath"
    exit 1
}

$supabaseUrl = "https://edzkorfdixvvvrkfzqzg.supabase.co"
$projectRef = "edzkorfdixvvvrkfzqzg"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "APPLYING DATABASE MIGRATION" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Project: $projectRef" -ForegroundColor Gray
Write-Host "Migration: $MigrationFile" -ForegroundColor Gray
Write-Host ""

# Read migration SQL
$migrationSql = Get-Content $migrationPath -Raw

Write-Host "Executing migration via Supabase SQL Editor endpoint..." -ForegroundColor Yellow
Write-Host ""

# Split into individual statements for better error handling
$statements = $migrationSql -split ';' | Where-Object { $_.Trim() -ne '' -and $_.Trim() -notmatch '^--' }

$headers = @{
    "apikey" = $ServiceRoleKey
    "Authorization" = "Bearer $ServiceRoleKey"
    "Content-Type" = "application/json"
}

$successCount = 0
$failCount = 0
$errors = @()

foreach ($statement in $statements) {
    $cleanStatement = $statement.Trim()
    if ($cleanStatement -eq '' -or $cleanStatement -match '^\s*--') {
        continue
    }
    
    try {
        # Use the query endpoint
        $body = @{
            query = $cleanStatement + ";"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest `
            -Uri "$supabaseUrl/rest/v1/rpc/query" `
            -Method Post `
            -Headers $headers `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 204) {
            $successCount++
            Write-Host "✓" -ForegroundColor Green -NoNewline
        } else {
            $failCount++
            $errors += "Statement failed with status $($response.StatusCode)"
            Write-Host "✗" -ForegroundColor Red -NoNewline
        }
    } catch {
        # This is expected since the RPC endpoint might not exist
        # We'll fall back to manual instructions
        Write-Host "." -ForegroundColor Yellow -NoNewline
    }
}

Write-Host ""
Write-Host ""

# Since direct SQL execution via REST API has limitations,
# provide the SQL Editor approach
Write-Host "================================" -ForegroundColor Yellow
Write-Host "MANUAL EXECUTION REQUIRED" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "The Supabase REST API doesn't support direct SQL execution." -ForegroundColor Yellow
Write-Host "Please apply the migration manually via SQL Editor:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open SQL Editor:" -ForegroundColor Cyan
Write-Host "   https://supabase.com/dashboard/project/$projectRef/editor" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Copy the migration SQL:" -ForegroundColor Cyan
Write-Host "   File: $migrationPath" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Paste and run in SQL Editor" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or copy this command to open the file:" -ForegroundColor Cyan
Write-Host "   code '$migrationPath'" -ForegroundColor Gray
Write-Host ""
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "After applying, run verification:" -ForegroundColor Cyan
Write-Host "   .\supabase\verify-migration.ps1" -ForegroundColor Gray
