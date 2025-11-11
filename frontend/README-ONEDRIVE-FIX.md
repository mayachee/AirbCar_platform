# OneDrive/Next.js Fix Guide

## Problem
Next.js creates symlinks in the `.next` folder that OneDrive cannot sync properly, causing `EINVAL: invalid argument, readlink` errors.

## Solution Options

### Option 1: Exclude Project from OneDrive Sync (RECOMMENDED)

1. Click OneDrive icon in system tray
2. Click "Help & Settings" -> "Settings"
3. Go to "Sync and backup" tab
4. Click "Advanced settings"
5. Under "Files and folders", click "Choose folders"
6. Find and UNCHECK the "AirbCar" folder
7. Click "OK"

This will stop OneDrive from syncing your project, preventing the readlink errors.

### Option 2: Move Project Outside OneDrive

Move your project to a location outside OneDrive:
```
C:\Projects\AirbCar
```

This is the cleanest solution if you don't need the project in OneDrive.

### Option 3: Pause OneDrive Sync While Developing

1. Click OneDrive icon in system tray
2. Click "Pause syncing" -> "2 hours"
3. Develop your project
4. Resume syncing when done

### Option 4: Use Local Git Only

If you're using Git, you don't need OneDrive to sync your code:
1. Exclude project from OneDrive (Option 1)
2. Use Git for version control
3. Push to GitHub/GitLab for backup

## Already Applied Fixes

- ✅ Disabled symlinks in `next.config.js`
- ✅ Enabled file polling
- ✅ Memory cache instead of filesystem cache
- ✅ Updated reset password page to avoid SSR issues

## Testing

After applying one of the solutions above:

1. Restart your dev server:
   ```bash
   npm run dev:safe
   ```

2. Test the reset password route:
   ```
   http://localhost:3000/auth/reset-password?uid=test&token=test
   ```

The route should work now without readlink errors.

