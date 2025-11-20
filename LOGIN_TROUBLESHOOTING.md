# Login Troubleshooting Guide

## 🔴 Problem: 401 Unauthorized Error on Login

If you're getting a 401 error when trying to log in after resetting your password, follow these steps:

## ✅ Step-by-Step Solution

### Step 1: Verify You're Using the NEW Password
- **Critical:** After resetting your password, you MUST use the **NEW password** (not the old one)
- The old password will **NOT work** anymore
- Make sure there are **no typos** in the password
- Check for:
  - Extra spaces before/after
  - Caps Lock enabled
  - Wrong keyboard layout

### Step 2: Check Backend Logs
After attempting to log in, check the logs to see what's failing:

```bash
docker-compose logs web | Select-String -Pattern "Login|password"
```

Look for messages like:
- `Login attempt for [email]: password_valid=True/False`
- `Password check failed for [email]`
- `Login blocked: Email not verified`
- `Login blocked: Account disabled`

### Step 3: Verify Email Address
- Make sure you're using the **exact same email** you used to reset the password
- Email is case-sensitive in some systems
- Check for typos

### Step 4: Check Account Status
The logs will show if your account is:
- **Not verified:** You need to verify your email first
- **Not active:** Account might be disabled
- **Password invalid:** Password doesn't match

## 🔍 Common Issues and Solutions

### Issue 1: "Invalid email or password"
**Possible causes:**
- Using the old password instead of the new one
- Typo in password
- Wrong email address
- Password wasn't saved correctly after reset

**Solution:**
1. **Request a NEW password reset link**
2. **Reset your password again** with a simple password (e.g., "test1234")
3. **Write down the new password** to avoid typos
4. **Try logging in immediately** after reset

### Issue 2: "Email not verified"
**Solution:**
- Check your email inbox for verification link
- Click the verification link
- Try logging in again

### Issue 3: Password Reset Shows Success But Login Fails
**Possible causes:**
- Password wasn't saved correctly
- Database connection issue during reset
- Token was used but password update failed

**Solution:**
1. **Request a NEW reset link** (old tokens are single-use)
2. **Reset password again**
3. **Check backend logs** for errors during reset
4. **Try logging in immediately** after reset

## 🧪 Testing Your Login

### Test 1: Simple Password Reset
```
1. Go to: http://172.18.240.1:3001/auth/forgot-password
2. Enter your email
3. Click "Send reset link"
4. Reset password to: "test1234" (simple, no special chars)
5. Try logging in with: email + "test1234"
```

### Test 2: Check Logs
```bash
# Watch logs in real-time
docker-compose logs -f web

# Then try to log in and watch for:
# - "Login attempt for [email]"
# - "password_valid=True/False"
# - Any error messages
```

### Test 3: Verify Password Was Saved
After resetting password, the logs should show:
```
Password successfully reset for user [email]
```

If you don't see this, the password wasn't saved.

## 🔧 Debugging Commands

### Check Recent Login Attempts
```bash
docker-compose logs web --tail 50 | Select-String -Pattern "Login|password|401"
```

### Check Password Reset Logs
```bash
docker-compose logs web --tail 50 | Select-String -Pattern "reset|Reset|Password"
```

### Watch Logs in Real-Time
```bash
docker-compose logs -f web
```
Then try to log in and watch the output.

## 📝 Important Notes

1. **Password is case-sensitive** - "Password123" ≠ "password123"
2. **No spaces allowed** - Check for leading/trailing spaces
3. **Minimum 6 characters** - Password must be at least 6 characters
4. **Use NEW password** - Always use the password you JUST set
5. **One-time tokens** - Reset links can only be used ONCE
6. **24-hour expiration** - Reset links expire after 24 hours

## 🆘 Still Having Issues?

### Option 1: Reset Password Again
1. Request a **NEW** password reset link
2. Use a **simple password** (e.g., "test1234")
3. **Write it down** to avoid typos
4. Try logging in **immediately**

### Option 2: Check Database Connection
If you see database errors in logs:
```bash
docker-compose logs web | Select-String -Pattern "timeout|connection|OperationalError"
```

Wait a few seconds and try again (Supabase might be having connection issues).

### Option 3: Verify User in Database
If you have database access, verify:
- User exists
- Password hash is set
- User is active
- User is verified

## ✅ Success Indicators

You'll know login worked when:
- ✅ No 401 error
- ✅ You receive access and refresh tokens
- ✅ You're redirected to dashboard
- ✅ Logs show "Login successful for [email]"

## 🔐 Security Reminders

- **Never share your password**
- **Use a strong password** (but start with a simple one for testing)
- **Reset links expire** after 24 hours
- **Old passwords don't work** after reset
- **Tokens are single-use** - can't reuse reset links

