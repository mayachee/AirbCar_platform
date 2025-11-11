# 🚨 QUICK FIX: Google OAuth Origin Error

## The Problem
```
Error 400: origin_mismatch
The given origin is not allowed for the given client ID.
```

## ✅ Quick Fix (5 Steps)

### Step 1: Open Google Cloud Console
Go to: https://console.cloud.google.com/apis/credentials

### Step 2: Find Your Client ID
Look for this Client ID (from your docker-compose.yml):
```
712108051146-g9ksbf313hhl7n3nt69ot8np7gtvvd8o.apps.googleusercontent.com
```

Click on it to **Edit**.

### Step 3: Add Authorized JavaScript Origins
Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
```
http://localhost:3000
```
Click **+ ADD URI** again and add:
```
http://127.0.0.1:3000
```

### Step 4: Add Authorized Redirect URIs
Under **Authorized redirect URIs**, click **+ ADD URI** and add:
```
http://localhost:3000
```
Click **+ ADD URI** again and add:
```
http://127.0.0.1:3000
```

### Step 5: SAVE and Wait
1. Click **SAVE** at the bottom ⚠️ **IMPORTANT!**
2. Wait 1-2 minutes for changes to propagate
3. Clear your browser cache or use incognito mode
4. Try signing in again

## ✅ That's It!

After these steps, Google sign-in should work.

## 🔍 Verify It's Working

1. Go to `http://localhost:3000/auth`
2. Click "Continue with Google"
3. You should see the Google sign-in popup
4. After signing in, you should be logged in

## ⚠️ Important Notes

- **No trailing slash**: Use `http://localhost:3000` not `http://localhost:3000/`
- **Protocol matters**: Use `http://` for localhost, not `https://`
- **Port matters**: Make sure `:3000` is included
- **Save changes**: Don't forget to click SAVE in Google Console
- **Wait time**: Changes can take 1-2 minutes to propagate

## 🆘 Still Not Working?

1. **Double-check the URLs** - They must match exactly
2. **Check for typos** - One character off will cause the error
3. **Wait longer** - Sometimes it takes 2-3 minutes
4. **Clear browser cache** - Or use incognito mode
5. **Check Client ID** - Make sure it matches in docker-compose.yml
6. **Restart Docker** - `docker-compose restart app`

---

**Your Client ID**: `712108051146-g9ksbf313hhl7n3nt69ot8np7gtvvd8o.apps.googleusercontent.com`

**Add these exact URLs**:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

