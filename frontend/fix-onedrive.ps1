# PowerShell script to help fix OneDrive/Next.js issues
Write-Host "=== OneDrive/Next.js Fix Script ===" -ForegroundColor Cyan
Write-Host ""

# Kill all Node processes
Write-Host "1. Stopping all Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   ✓ Done" -ForegroundColor Green

# Remove .next folder
Write-Host "2. Removing .next folder..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Get-ChildItem ".next" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
    Remove-Item ".next" -Force -Recurse -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    if (Test-Path ".next") {
        Write-Host "   ⚠ .next folder still exists - OneDrive may be locking it" -ForegroundColor Red
        Write-Host "   Please manually delete it or pause OneDrive sync" -ForegroundColor Red
    } else {
        Write-Host "   ✓ Done" -ForegroundColor Green
    }
} else {
    Write-Host "   ✓ No .next folder found" -ForegroundColor Green
}

# Remove node_modules cache
Write-Host "3. Clearing node_modules cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.cache") {
    Remove-Item "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ Done" -ForegroundColor Green
} else {
    Write-Host "   ✓ No cache found" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "PERMANENT FIX (Choose one):" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option A: Exclude .next from OneDrive Sync" -ForegroundColor White
Write-Host "  1. Open File Explorer" -ForegroundColor Gray
Write-Host "  2. Navigate to: $(Get-Location)" -ForegroundColor Gray
Write-Host "  3. Right-click 'frontend' folder" -ForegroundColor Gray
Write-Host "  4. Properties -> Attributes -> Uncheck 'Read-only'" -ForegroundColor Gray
Write-Host "  5. Or use: attrib -r frontend /s /d" -ForegroundColor Gray
Write-Host ""
Write-Host "Option B: Move project outside OneDrive" -ForegroundColor White
Write-Host "  Move to: C:\Projects\AirbCar" -ForegroundColor Gray
Write-Host ""
Write-Host "Option C: Pause OneDrive sync while developing" -ForegroundColor White
Write-Host "  1. Click OneDrive icon in system tray" -ForegroundColor Gray
Write-Host "  2. Settings -> Pause syncing -> 2 hours" -ForegroundColor Gray
Write-Host ""
Write-Host "=== Starting Dev Server ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now run: npm run dev:safe" -ForegroundColor Green
Write-Host "Or: `$env:WATCHPACK_POLLING='true'; npm run dev" -ForegroundColor Green
Write-Host ""

