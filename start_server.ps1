# Startup Script for RBI AI Assistant Server
Write-Host ">>> Starting RBI AI Assistant Backend..." -ForegroundColor Green

$CurrentDir = Get-Location
$VenvScript = Join-Path $CurrentDir "rbi-ai-assistant\server\venv\Scripts\Activate.ps1"

if (Test-Path $VenvScript) {
    Write-Host ">>> Activating Virtual Environment..." -ForegroundColor Cyan
    & $VenvScript
}
else {
    Write-Host "!!! Virtual environment not found at standard path. Trying direct execution..." -ForegroundColor Yellow
}

# Change directory to server root
Set-Location "rbi-ai-assistant\server"

# Run Uvicorn
Write-Host ">>> Launching Uvicorn Server on Port 8000..." -ForegroundColor Green
python -m uvicorn main:app --reload --port 8000
