# Verifying Newsletter Route

## Steps to Verify the Route is Working

### 1. Restart the Django Server
**IMPORTANT**: After adding the route, you MUST restart the Django server:

```bash
# Stop the server (Ctrl+C)
# Then restart it:
cd backend/airbcar_backend
python manage.py runserver
```

### 2. Check Server Logs
When the server starts, check for any import errors. You should see:
- No errors about `NewsletterSubscriptionView`
- No errors about `newsletter_subscribe`

### 3. Test with GET Request (Simple Test)
Open your browser or use curl:
```bash
# Test GET request
curl http://127.0.0.1:8000/api/newsletter/subscribe/

# Or open in browser:
# http://127.0.0.1:8000/api/newsletter/subscribe/
```

You should see:
```json
{"message": "Newsletter subscription endpoint. Use POST to subscribe."}
```

### 4. Test with POST Request
```bash
curl -X POST http://127.0.0.1:8000/api/newsletter/subscribe/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 5. Check Django URL Resolution
If the route still doesn't work, run:
```bash
cd backend/airbcar_backend
python manage.py shell
```

Then in the shell:
```python
from django.urls import reverse
try:
    url = reverse('newsletter_subscribe')
    print(f"Route found: {url}")
except Exception as e:
    print(f"Route NOT found: {e}")
```

### 6. Common Issues

**Issue**: 404 Not Found
- **Solution**: Restart the Django server
- **Solution**: Check for import errors in server logs
- **Solution**: Verify the view is imported in `urls.py`

**Issue**: Import Error
- **Solution**: Check that `NewsletterSubscriptionView` is defined in `core/views.py`
- **Solution**: Verify all imports are correct
- **Solution**: Check for syntax errors in `views.py`

**Issue**: Method Not Allowed (405)
- **Solution**: This is actually good - it means the route is found but the method is wrong
- **Solution**: Make sure you're using POST method

## Expected Behavior

✅ **Working**: GET request returns 200 with message
✅ **Working**: POST request with valid email returns 200 with success message
✅ **Working**: POST request with invalid email returns 400 with error message
❌ **Not Working**: Any request returns 404

