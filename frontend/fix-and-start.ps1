# PowerShell script to fix and start Next.js dev server
Write-Host "🔧 Fixing Next.js Development Environment..." -ForegroundColor Green
Write-Host ""

# Stop any running Node processes
Write-Host "1. Stopping Node processes..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.Path -like "*nodejs*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   ✅ Stopped" -ForegroundColor Green
Write-Host ""

# Clean build files
Write-Host "2. Cleaning build files..." -ForegroundColor Yellow
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
    Write-Host "   ✅ Removed .next folder" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  .next folder doesn't exist" -ForegroundColor Cyan
}

if (Test-Path node_modules/.cache) {
    Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
    Write-Host "   ✅ Removed cache" -ForegroundColor Green
}
Write-Host ""

# Check if we're in the frontend directory
if (-not (Test-Path package.json)) {
    Write-Host "❌ Error: package.json not found. Please run this script from the frontend directory." -ForegroundColor Red
    exit 1
}

Write-Host "3. Starting Next.js dev server..." -ForegroundColor Yellow
Write-Host "   ⏳ Please wait for 'Ready in X.Xs' message..." -ForegroundColor Cyan
Write-Host "   🌐 Then open: http://localhost:3000 (or 3001 if 3000 is in use)" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Wait for compilation to finish before opening browser!" -ForegroundColor Yellow
Write-Host ""

# Start dev server
pnpm run dev

