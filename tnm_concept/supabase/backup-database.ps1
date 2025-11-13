# Full Supabase Database Backup Script
# Creates JSON backups of all tables

param(
    [string]$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY
)

if (-not $ServiceRoleKey) {
    Write-Error "Service role key required. Pass as parameter or set SUPABASE_SERVICE_ROLE_KEY environment variable."
    exit 1
}

$supabaseUrl = "https://edzkorfdixvvvrkfzqzg.supabase.co"
$headers = @{
    "apikey" = $ServiceRoleKey
    "Authorization" = "Bearer $ServiceRoleKey"
    "Content-Type" = "application/json"
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = Join-Path $PSScriptRoot "backups" "full_backup_$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Write-Host "================================" -ForegroundColor Cyan
Write-Host "FULL DATABASE BACKUP" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Timestamp: $timestamp" -ForegroundColor Gray
Write-Host "Location: $backupDir" -ForegroundColor Gray
Write-Host ""

# List of all tables to backup
$tables = @(
    'trading_accounts',
    'profiles', 
    'trades',
    'notifications',
    'user_settings'
)

$totalRecords = 0
$successCount = 0
$failCount = 0

foreach ($table in $tables) {
    try {
        Write-Host "Backing up: $table..." -ForegroundColor Yellow -NoNewline
        
        $data = Invoke-RestMethod `
            -Uri "$supabaseUrl/rest/v1/$table`?select=*&limit=10000" `
            -Method Get `
            -Headers $headers `
            -ErrorAction Stop
        
        $backupFile = Join-Path $backupDir "$table.json"
        $data | ConvertTo-Json -Depth 10 | Out-File -FilePath $backupFile -Encoding UTF8
        
        $recordCount = if ($data -is [Array]) { $data.Count } else { 1 }
        $totalRecords += $recordCount
        $successCount++
        
        Write-Host " ✓ $recordCount records" -ForegroundColor Green
        
    } catch {
        $failCount++
        Write-Host " ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "BACKUP COMPLETE" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Tables backed up: $successCount/$($tables.Count)" -ForegroundColor Gray
Write-Host "Total records: $totalRecords" -ForegroundColor Gray
Write-Host "Location: $backupDir" -ForegroundColor Gray
Write-Host ""

# List backup files with sizes
Write-Host "Backup files:" -ForegroundColor Cyan
Get-ChildItem $backupDir -File | ForEach-Object {
    $sizeKB = [math]::Round($_.Length / 1KB, 2)
    Write-Host "  - $($_.Name) ($sizeKB KB)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✓ Ready to proceed with migration" -ForegroundColor Green
