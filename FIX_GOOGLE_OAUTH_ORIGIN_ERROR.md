# 🔧 Fix Google OAuth "origin_mismatch" Error

## ❌ The Error

```
Error 400: origin_mismatch
The given origin is not allowed for the given client ID.
```

This error means the origin (your website URL) is not authorized in Google Cloud Console.

## ✅ Solution: Add Authorized Origins

### Step 1: Go to Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Go to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** (or create one if you haven't)
5. Click **Edit** (pencil icon)

### Step 2: Add Authorized JavaScript Origins

In the **Authorized JavaScript origins** section, click **+ ADD URI** and add:

**For Development:**
```
http://localhost:3000
http://127.0.0.1:3000
```

**For Production (when deployed):**
```
https://yourdomain.com
https://www.yourdomain.com
```

### Step 3: Add Authorized Redirect URIs

In the **Authorized redirect URIs** section, click **+ ADD URI** and add:

**For Development:**
```
http://localhost:3000
http://127.0.0.1:3000
http://localhost:3000/auth
http://127.0.0.1:3000/auth
```

**For Production:**
```
https://yourdomain.com
https://yourdomain.com/auth
https://www.yourdomain.com
https://www.yourdomain.com/auth
```

### Step 4: Save Changes

1. Click **SAVE** at the bottom
2. Wait a few seconds for changes to propagate

### Step 5: Test Again

1. Clear your browser cache (or use incognito mode)
2. Go to `http://localhost:3000/auth`
3. Click "Continue with Google"
4. It should work now!

## 📝 Important Notes

### Exact URLs Matter
- ✅ `http://localhost:3000` (correct)
- ❌ `http://localhost:3000/` (trailing slash - might cause issues)
- ✅ Include both `localhost` and `127.0.0.1` if you use both

### Protocol Matters
- ✅ `http://` for development (localhost)
- ✅ `https://` for production
- ❌ Don't mix them - use the correct protocol for each environment

### Port Matters
- Make sure the port matches exactly
- If your frontend runs on port 3000, use `:3000`
- If it runs on a different port, update accordingly

## 🔍 Verify Your Setup

### Check Your Frontend URL
1. Look at your browser's address bar when you're on the auth page
2. The URL should be exactly what you added to Google Console
3. For example: `http://localhost:3000/auth`

### Check Your Client ID
1. In Google Cloud Console, copy your Client ID
2. Make sure it matches what's in your environment variables
3. Check `docker-compose.yml` or `.env.local`:
   ```yaml
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

### Check Docker Configuration
If using Docker, make sure the environment variable is set:

```yaml
app:
  environment:
    - NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Then rebuild:
```bash
docker-compose up -d --build app
```

## 🚨 Common Mistakes

### Mistake 1: Wrong Origin
- ❌ Added `https://localhost:3000` (should be `http://` for localhost)
- ✅ Use `http://localhost:3000` for development

### Mistake 2: Missing Port
- ❌ Added `http://localhost` (missing port)
- ✅ Use `http://localhost:3000` (with port)

### Mistake 3: Trailing Slash
- ❌ Added `http://localhost:3000/` (trailing slash)
- ✅ Use `http://localhost:3000` (no trailing slash)

### Mistake 4: Wrong Client ID
- ❌ Using Client ID from different project
- ✅ Make sure Client ID matches your project

### Mistake 5: Changes Not Saved
- ❌ Forgot to click SAVE in Google Console
- ✅ Always click SAVE after adding origins

## 🔄 After Making Changes

1. **Wait 1-2 minutes** for Google's servers to update
2. **Clear browser cache** or use incognito mode
3. **Restart your frontend** if needed
4. **Test again**

## 📸 Step-by-Step Visual Guide

1. **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Click on your **OAuth 2.0 Client ID**
3. Under **Authorized JavaScript origins**, click **+ ADD URI**
4. Enter: `http://localhost:3000`
5. Click **+ ADD URI** again and add: `http://127.0.0.1:3000`
6. Under **Authorized redirect URIs**, add the same URLs
7. Click **SAVE**
8. Wait 1-2 minutes
9. Test in your browser

## 🆘 Still Not Working?

### Check 1: Verify Client ID
```bash
# Check if Client ID is set in Docker
docker-compose exec app env | grep GOOGLE_CLIENT_ID
```

### Check 2: Check Browser Console
- Open browser DevTools (F12)
- Look for any errors in the Console tab
- Check the Network tab for failed requests

### Check 3: Verify URL in Browser
- Make sure you're accessing `http://localhost:3000`
- Not `https://localhost:3000` or a different port

### Check 4: Check Google Console
- Go back to Google Cloud Console
- Verify the origins are exactly as shown above
- Make sure there are no typos

### Check 5: Try Different Browser
- Sometimes browser cache causes issues
- Try incognito/private mode
- Or try a different browser

## ✅ Quick Checklist

- [ ] Added `http://localhost:3000` to Authorized JavaScript origins
- [ ] Added `http://127.0.0.1:3000` to Authorized JavaScript origins
- [ ] Added same URLs to Authorized redirect URIs
- [ ] Clicked SAVE in Google Cloud Console
- [ ] Waited 1-2 minutes for changes to propagate
- [ ] Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in environment variables
- [ ] Rebuilt Docker containers (if using Docker)
- [ ] Cleared browser cache or used incognito mode
- [ ] Tested the sign-in button

---

**After completing these steps, the Google sign-in should work!** 🎉

