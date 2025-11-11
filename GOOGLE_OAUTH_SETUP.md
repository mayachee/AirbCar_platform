# 🔐 Google OAuth Setup Guide

## ✅ What I've Implemented

1. **Backend Endpoint**: `/api/auth/google/` - Verifies Google ID tokens and creates/authenticates users
2. **Frontend Integration**: Google sign-in button that triggers Google OAuth flow
3. **Automatic User Creation**: New users are automatically created when they sign in with Google
4. **JWT Token Generation**: Users receive JWT tokens just like regular login

## 🔧 Setup Instructions

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Identity Services API** (or Google+ API)
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth client ID** (or edit existing one)
6. Choose **Web application**
7. **IMPORTANT**: Add authorized JavaScript origins (click **+ ADD URI** for each):
   - `http://localhost:3000` ⚠️ **REQUIRED**
   - `http://127.0.0.1:3000` ⚠️ **REQUIRED** (if you use this URL)
   - `https://yourdomain.com` (for production)
8. **IMPORTANT**: Add authorized redirect URIs (click **+ ADD URI** for each):
   - `http://localhost:3000` ⚠️ **REQUIRED**
   - `http://127.0.0.1:3000` ⚠️ **REQUIRED** (if you use this URL)
   - `https://yourdomain.com` (for production)
9. **Click SAVE** ⚠️ **DON'T FORGET THIS STEP!**
10. Copy the **Client ID**

**⚠️ Common Error**: If you get `origin_mismatch` error, it means you haven't added the origins correctly. Make sure:
- URLs are exact (no trailing slash)
- Protocol matches (`http://` for localhost, not `https://`)
- Port number is included (`:3000`)
- You clicked **SAVE** after adding origins

### Step 2: Configure Frontend

Add the Google Client ID to your environment variables:

**For Development (`.env.local`):**
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**For Docker (`docker-compose.yml`):**
```yaml
app:
  environment:
    - NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Step 3: Rebuild Docker Containers

```bash
# Rebuild backend to include the new endpoint
docker-compose up -d --build web

# Rebuild frontend to include Google OAuth
docker-compose up -d --build app
```

### Step 4: Test

1. Go to the auth page: `http://localhost:3000/auth`
2. Click "Continue with Google"
3. Sign in with your Google account
4. You should be redirected to the dashboard

## 📝 How It Works

1. **User clicks "Continue with Google"**
   - Frontend loads Google Identity Services
   - Google sign-in popup appears

2. **User signs in with Google**
   - Google returns an ID token
   - Frontend sends the ID token to `/api/auth/google/`

3. **Backend verifies the token**
   - Verifies the token with Google's servers
   - Extracts user information (email, name, picture)
   - Creates a new user if they don't exist
   - Updates existing user information if they do exist

4. **Backend returns JWT tokens**
   - Access token and refresh token
   - User information

5. **Frontend stores tokens and redirects**
   - Tokens are stored in localStorage
   - User is redirected based on their role

## 🔍 Troubleshooting

### "Google OAuth is not configured"

**Solution**: Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` environment variable

### "Invalid ID token"

**Solutions**:
- Check that the Client ID is correct
- Verify authorized origins and redirect URIs in Google Console
- Make sure the domain matches exactly (including http/https and port)

### "Failed to load Google Identity Services"

**Solutions**:
- Check your internet connection
- Verify the script is loading: Check browser console for errors
- Try refreshing the page

### Users not being created

**Solutions**:
- Check backend logs: `docker-compose logs web`
- Verify the backend endpoint is working: `curl http://localhost:8000/api/auth/google/`
- Check database connection

## 🎯 Features

- ✅ Automatic user creation
- ✅ Profile picture from Google
- ✅ Email verification (if verified by Google)
- ✅ Name synchronization
- ✅ JWT token generation
- ✅ Role-based redirection
- ✅ Error handling
- ✅ Loading states

## 🔒 Security Notes

- ID tokens are verified with Google's servers
- Users are created automatically but can't sign in with password (OAuth only)
- Email is used as the unique identifier
- Profile information is synced from Google

## 📚 Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

---

**Next Steps**: 
1. Get Google OAuth credentials
2. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` environment variable
3. Rebuild Docker containers
4. Test the sign-in flow

