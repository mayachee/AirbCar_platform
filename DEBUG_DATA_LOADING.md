# Debug Guide: Data Not Loading from Database

## ✅ What We Know

1. **Database has data:**
   - User: `mayache`
   - Email: `yassinepro764@gmail.com`
   - First Name: `mohamed yassine`
   - Phone: `0696145103`
   - Profile Picture: `profiles/hq720.jpg`

2. **Backend serializer returns data:**
   - All fields are correctly serialized
   - URLs are generated (relative paths)

3. **Frontend has logging:**
   - Console logs added to track data flow
   - Error handling improved

## 🔍 Debug Steps

### Step 1: Check Browser Console

1. Open your browser (F12)
2. Go to the Account page
3. Look for these logs:
   ```
   🔄 Loading user data from backend...
   📥 Raw response: {...}
   📦 User data: {...}
   🔄 Mapped data: {...}
   ✅ Updated accountData: {...}
   ✅ User data loaded successfully
   ```

### Step 2: Check Network Tab

1. Open Network tab (F12 → Network)
2. Filter by "users/me"
3. Check:
   - Is the request being made?
   - What's the response status? (200, 401, 404?)
   - What's in the response body?

### Step 3: Check Authentication

1. Check if you're logged in:
   ```javascript
   // In browser console
   localStorage.getItem('access_token')
   ```
2. If token exists, check if it's valid
3. If no token, you need to log in first

### Step 4: Check API Endpoint

Test the endpoint directly:
```bash
# Get your token first (from browser console)
# Then test:
curl -H "Authorization: Bearer YOUR_TOKEN" http://127.0.0.1:8000/users/me/
```

### Step 5: Check Backend Logs

```bash
docker-compose logs web --tail 50 | grep -i "users/me\|error\|UserMeView"
```

## 🐛 Common Issues

### Issue 1: No Token / Not Authenticated
**Symptoms:**
- 401 Unauthorized
- No user data loaded

**Solution:**
- Log in first
- Check if token is in localStorage
- Verify token hasn't expired

### Issue 2: CORS Error
**Symptoms:**
- "Failed to fetch"
- CORS error in console

**Solution:**
- Check `CORS_ALLOWED_ORIGINS` in backend
- Verify frontend URL is allowed

### Issue 3: Wrong Endpoint
**Symptoms:**
- 404 Not Found
- Endpoint not found

**Solution:**
- Verify endpoint: `/users/me/`
- Check `API_ENDPOINTS.AUTH.PROFILE` in constants

### Issue 4: Data Not Mapped Correctly
**Symptoms:**
- Response received but fields empty
- Data structure mismatch

**Solution:**
- Check `mapBackendToFrontend()` function
- Verify field names match (snake_case → camelCase)

### Issue 5: Response Structure Mismatch
**Symptoms:**
- Data in response but not extracted correctly

**Solution:**
- Check if response is `{ data: {...} }` or just `{...}`
- Verify `response?.data || response` logic

## 🔧 Quick Fixes

### Fix 1: Force Reload Data
```javascript
// In browser console
window.location.reload()
```

### Fix 2: Clear Cache and Reload
```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
window.location.reload()
```

### Fix 3: Check User Context
```javascript
// In browser console (if you have access to React DevTools)
// Or check the component state
```

## 📋 Checklist

- [ ] User is logged in
- [ ] Token exists in localStorage
- [ ] Token is not expired
- [ ] Backend is running (`docker-compose ps`)
- [ ] API endpoint is accessible
- [ ] Network request is made
- [ ] Response status is 200
- [ ] Response contains data
- [ ] Data is mapped correctly
- [ ] accountData state is updated
- [ ] UI displays the data

## 🧪 Test Commands

### Test Backend Directly
```bash
# Check if user exists
docker-compose exec web python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print(User.objects.count())"

# Check serializer output
docker-compose exec web python manage.py shell -c "from django.contrib.auth import get_user_model; from core.serializers import UserSerializer; User = get_user_model(); u = User.objects.first(); s = UserSerializer(u); print(s.data)"
```

### Test Frontend API Call
```javascript
// In browser console
import { authService } from '@/services/api';
authService.getCurrentUser().then(console.log).catch(console.error);
```

## 📞 Next Steps

If data still doesn't load:
1. Share the browser console logs
2. Share the Network tab response
3. Share backend logs
4. Check if the issue is specific to certain fields

