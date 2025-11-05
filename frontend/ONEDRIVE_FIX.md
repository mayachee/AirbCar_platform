# Quick Fix for OneDrive File Lock Errors

## Immediate Solution

When you see `EBUSY: resource busy or locked` errors:

1. **Stop the dev server** (Ctrl+C)

2. **Run cleanup script:**
   ```bash
   npm run clean
   ```
   Or:
   ```bash
   node clear-build.js
   ```

3. **Start with clean build:**
   ```bash
   npm run dev:clean
   ```

## Why This Happens

- OneDrive continuously syncs files in the background
- Next.js creates many files during build/dev
- Windows locks files being synced by OneDrive
- This causes conflicts during file operations

## Permanent Solutions

### Option 1: Exclude Build Directory from OneDrive (Recommended)

1. Open File Explorer
2. Navigate to: `C:\Users\Dima D'origine\OneDrive\Bureau\AirbCar\frontend`
3. Right-click `.next-local` folder
4. Choose "Always keep on this device" 
5. Or exclude it from OneDrive sync entirely

### Option 2: Pause OneDrive During Development

1. Right-click OneDrive icon in system tray
2. Click "Pause syncing"
3. Choose "2 hours" or "24 hours"
4. Resume after development session

### Option 3: Move Project Outside OneDrive

Move the entire project to:
- `C:\dev\AirbCar` 
- `D:\projects\AirbCar`
- Any non-OneDrive location

This completely avoids sync conflicts.

### Option 4: OneDrive Selective Sync

1. Right-click OneDrive icon in system tray
2. Settings > Account > Choose folders
3. Uncheck `AirbCar` or `frontend` folder

## Development Commands

- `npm run dev` - Normal development
- `npm run dev:clean` - Clean build directory then start
- `npm run clean` - Just clean build directory
- `npm run build:clean` - Clean then build for production

