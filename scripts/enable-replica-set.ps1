# Elevate to Administrator if not already elevated
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Requesting Administrator privileges to update MongoDB configuration..." -ForegroundColor Cyan
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

$cfgPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg"
if (-not (Test-Path $cfgPath)) {
    $found = Get-ChildItem "C:\Program Files\MongoDB\Server" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name | Sort-Object -Descending
    if ($found) {
        $cfgPath = "C:\Program Files\MongoDB\Server\$($found[0])\bin\mongod.cfg"
    }
}

if (-not (Test-Path $cfgPath)) {
    Write-Host "MongoDB configuration file not found at $cfgPath" -ForegroundColor Red
    pause
    exit 1
}

$content = Get-Content $cfgPath -Raw

if ($content -match "replSetName:\s*rs0") {
    Write-Host "Replica set 'rs0' is already present in $cfgPath" -ForegroundColor Green
} else {
    Write-Host "Adding replication configuration to $cfgPath..." -ForegroundColor Yellow
    if ($content -match "#replication:") {
        $content = $content -replace "#replication:", "replication:`r`n  replSetName: rs0"
    } elseif ($content -match "replication:") {
        $content = $content -replace "replication:", "replication:`r`n  replSetName: rs0"
    } else {
        $content = $content + "`r`n`r`nreplication:`r`n  replSetName: rs0`r`n"
    }
}

# Ensure wiredTiger cache size is capped to prevent out of memory crashes
if ($content -notmatch "cacheSizeGB:") {
    Write-Host "Limiting WiredTiger cache size to 1GB to prevent out of memory..." -ForegroundColor Yellow
    $content = $content -replace "dbPath:\s*([^\r\n]+)", "dbPath: `$1`r`n  wiredTiger:`r`n    engineConfig:`r`n      cacheSizeGB: 1"
}

Set-Content -Path $cfgPath -Value $content
Write-Host "Configuration saved to $cfgPath" -ForegroundColor Green

Write-Host "Starting / Restarting MongoDB service..." -ForegroundColor Yellow
Restart-Service -Name MongoDB -Force
Start-Sleep -Seconds 3

$svc = Get-Service -Name MongoDB
if ($svc.Status -eq 'Running') {
    Write-Host "MongoDB service is RUNNING with replica set enabled!" -ForegroundColor Green
} else {
    Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
    Start-Service -Name MongoDB
    Start-Sleep -Seconds 2
}
Write-Host "Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
