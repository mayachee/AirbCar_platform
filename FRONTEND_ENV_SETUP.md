# Frontend Environment Variable Setup

## 🔴 URGENT: Set This Environment Variable NOW

Your frontend is trying to connect to `http://localhost:8000` instead of your Render backend at `https://airbcar-backend.onrender.com`.

**This is why your website doesn't work!** You MUST set the environment variable below.

## ✅ Solution: Set Environment Variable

### If Frontend is on Vercel:

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add this variable:
   - **Name:** `NEXT_PUBLIC_DJANGO_API_URL`
   - **Value:** `https://airbcar-backend.onrender.com`
   - **Environment:** Production, Preview, Development (select all)
5. Click **Save**
6. **Redeploy** your frontend (Vercel will auto-redeploy or go to Deployments → Redeploy)

### If Frontend is on Render:

1. Go to your Render dashboard
2. Select your frontend service
3. Go to **Environment** tab
4. Add this variable:
   - **Key:** `NEXT_PUBLIC_DJANGO_API_URL`
   - **Value:** `https://airbcar-backend.onrender.com`
5. Click **Save Changes**
6. Service will automatically redeploy

### If Running Locally:

Create or update `.env.local` in your `frontend/` directory:

```env
NEXT_PUBLIC_DJANGO_API_URL=https://airbcar-backend.onrender.com
```

Then restart your dev server:
```bash
cd frontend
npm run dev
```

## ✅ What I Fixed in Code

I've updated these files to use the environment variable:
- ✅ `frontend/src/hooks/usePartners.js` - Now uses `API_BASE` from env
- ✅ `frontend/src/hooks/useListYourVehicle.js` - Now uses `API_BASE` from env
- ✅ All other files already use `process.env.NEXT_PUBLIC_DJANGO_API_URL`

## 🧪 Test After Setup

After setting the environment variable and redeploying:

1. Open your frontend website
2. Try to login
3. Check browser console - should see requests to `https://airbcar-backend.onrender.com` instead of `localhost:8000`
4. Login should work now!

## 📋 Quick Checklist

- [ ] Set `NEXT_PUBLIC_DJANGO_API_URL=https://airbcar-backend.onrender.com` in your hosting platform
- [ ] Redeploy frontend
- [ ] Test login functionality
- [ ] Verify API calls go to Render backend (check Network tab in browser)

## ⚠️ Important Notes

- The variable name **must** start with `NEXT_PUBLIC_` for Next.js to expose it to the browser
- After setting the variable, you **must redeploy** for changes to take effect
- The backend URL should be `https://airbcar-backend.onrender.com` (your actual Render URL)

