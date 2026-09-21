# RESEARCH-HUB PowerShell Parallel Dev Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  RESEARCH-HUB - Starting Backend & Frontend" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting Backend on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\server'; npm start"

Start-Sleep -Seconds 2

Write-Host "Starting Frontend on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\FRONTEND'; npm start"

Write-Host ""
Write-Host "Both services launched in separate PowerShell windows!" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Green
