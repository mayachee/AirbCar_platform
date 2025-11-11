# 🔄 RESTART DJANGO SERVER - REQUIRED!

## ⚠️ IMPORTANT: The newsletter route will NOT work until you restart the Django server!

The route has been added to the code, but Django needs to reload the URL configuration.

## Steps to Fix the 404 Error:

### 1. **Stop the Django Server**
   - Find the terminal/command prompt where Django is running
   - Press `Ctrl+C` to stop the server
   - Wait for it to fully stop

### 2. **Verify the Server Stopped**
   - Make sure you see the command prompt again
   - No process should be using port 8000

### 3. **Start the Django Server Again**
   ```bash
   cd backend/airbcar_backend
   python manage.py runserver
   ```

### 4. **Check for Errors**
   When the server starts, check the output for:
   - ✅ No import errors about `NewsletterSubscriptionView`
   - ✅ No syntax errors
   - ✅ Server should start on `http://127.0.0.1:8000/`

### 5. **Test the Endpoint**
   Open your browser and go to:
   ```
   http://127.0.0.1:8000/api/newsletter/subscribe/
   ```
   
   You should see:
   ```json
   {"message": "Newsletter subscription endpoint. Use POST to subscribe."}
   ```

### 6. **If You Still Get 404**

   Run this verification script:
   ```bash
   cd backend/airbcar_backend
   python verify_server_running.py
   ```

   This will check if:
   - Django can import the view
   - The route is registered in URL patterns
   - The URL can be reversed

## Why This Happens

Django loads URL patterns when the server starts. When you add a new route:
1. The code is saved to disk ✅
2. But Django's URL resolver is already loaded in memory ❌
3. Django's auto-reload doesn't always catch URL changes ❌
4. **You MUST restart the server** to reload URL patterns ✅

## Quick Test

After restarting, test with curl:
```bash
curl http://127.0.0.1:8000/api/newsletter/subscribe/
```

Or test with POST:
```bash
curl -X POST http://127.0.0.1:8000/api/newsletter/subscribe/ \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test@example.com\"}"
```

## Still Having Issues?

1. Check server logs for import errors
2. Verify the server is running on the correct port
3. Make sure you're accessing `http://127.0.0.1:8000` (not `localhost`)
4. Check that no other process is using port 8000

