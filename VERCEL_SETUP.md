# Vercel Deployment Setup Guide

## ⚠️ IMPORTANT: Root Directory Configuration

Your Next.js app is in the `frontend` folder, but Vercel needs to be configured to use this as the root directory.

## Steps to Fix Deployment:

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Select your project: **AirbCar_platform**

### 2. Configure Root Directory
1. Go to **Settings** → **General**
2. Scroll down to **Root Directory**
3. Click **Edit**
4. Set it to: `frontend`
5. Click **Save**

### 3. Update Build Settings (if needed)
1. Go to **Settings** → **General**
2. Scroll to **Build & Development Settings**
3. Ensure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (should be auto-detected)
   - **Output Directory**: `.next` (should be auto-detected)
   - **Install Command**: `npm install` (should be auto-detected)

### 4. Redeploy
After saving the root directory setting, Vercel will automatically trigger a new deployment.

## Why This Is Needed

Your project structure is:
```
AirbCar/
├── backend/          # Django backend
├── frontend/         # Next.js frontend (this is what Vercel needs)
└── ...
```

Vercel needs to know that the Next.js app is in the `frontend` folder, not at the root level.

## Alternative: Move vercel.json to Root

If you prefer to configure via code, you can create a `vercel.json` at the root level, but the dashboard setting is more reliable.

## Current Status

✅ Build is working correctly  
✅ All pages are generating successfully  
❌ Deployment failing - needs root directory configuration

After setting the root directory in the Vercel dashboard, the deployment should complete successfully.

