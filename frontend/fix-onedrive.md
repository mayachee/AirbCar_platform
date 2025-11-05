# Fixing OneDrive File Lock Issues

If you're encountering `EBUSY: resource busy or locked` errors, follow these steps:

## Quick Fix

1. **Stop the dev server** (Ctrl+C in the terminal)
2. **Run the cleanup script:**
   ```bash
   node clear-build.js
   ```
   Or use npm script:
   ```bash
   npm run clean
   ```
3. **Restart the dev server:**
   ```bash
   npm run dev
   ```

## Permanent Solution: Exclude from OneDrive

### Option 1: Exclude the entire project folder
1. Right-click on `AirbCar` folder
2. Choose "Always keep on this device" or "Free up space"
3. Or exclude from OneDrive sync entirely

### Option 2: Exclude specific directories
1. Open OneDrive settings
2. Go to "Sync and backup" > "Advanced settings"
3. Add these paths to exclusions:
   - `frontend/.next-local/`
   - `frontend/.next/`
   - `frontend/node_modules/`
   - `frontend/out/`

### Option 3: Use OneDrive Selective Sync
1. Right-click OneDrive icon in system tray
2. Settings > Account > Choose folders
3. Uncheck the AirbCar project or specific subfolders

## Why This Happens

- OneDrive continuously syncs files
- Next.js builds write many files quickly
- Windows locks files being synced
- This causes conflicts during development

## Alternative: Move Project Outside OneDrive

For best performance, consider:
- Moving the project to `C:\dev\AirbCar` or `D:\projects\AirbCar`
- This avoids OneDrive sync issues entirely

