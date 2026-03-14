# Email Verification for Password Reset - Implementation Guide

**Status**: ✅ **IMPLEMENTED AND READY TO TEST**
**Date**: 2024
**Feature**: Two-Factor Email Verification for Forgot Password

---

## Overview

The forgot password feature now includes **email verification** similar to the 2FA OTP system. Users must verify their email address with a 6-digit code before they can reset their password. This adds an extra security layer to prevent unauthorized password resets.

### Why Email Verification?

1. **Security**: Prevents attackers from resetting passwords of accounts they don't have access to
2. **Spam Prevention**: Reduces automated password reset attacks
3. **Account Recovery Confirmation**: Users verify they have access to the registered email
4. **User Familiarity**: Similar to 2FA OTP that users already understand

---

## System Architecture

### Backend Flow

```
User Request Password Reset
  ↓
POST /api/password-reset/ {email}
  ↓
Backend generates:
  - PasswordReset token (24hr expiry)
  - EmailVerification code (15min expiry)
  ↓
Send email with:
  - 6-digit verification code
  - Reset link with token
  ↓
User verifies code
  ↓
POST /api/password-reset/verify-email/ {email, code}
  ↓
Verify EmailVerification record is valid
Get corresponding PasswordReset token
Mark EmailVerification as used
  ↓
Return reset_token to frontend
  ↓
User enters new password
POST /api/password-reset/confirm/ {token, new_password}
  ↓
Check EmailVerification is marked as used
Update password
Mark PasswordReset as used
```

### Frontend Flow

```
Start: /auth/forgot-password
  ↓ (enter email)
Request password reset
  ↓ (email sent with code)
Redirect to: /auth/verify-reset-email?email=...
  ↓ (enter 6-digit code)
Verify email code
  ↓ (code valid)
Redirect to: /auth/reset-password?token=...
  ↓ (enter new password)
Reset password successful
  ↓
Redirect to: /auth/signin
```

---

## Backend Implementation

### 1. Database Models

**PasswordReset** (existing - unchanged):
```python
class PasswordReset(models.Model):
    user = ForeignKey(User)
    token = CharField(max_length=64, unique=True)
    expires_at = DateTimeField()  # 24 hours
    is_used = BooleanField(default=False)
```

**EmailVerification** (existing - now used for password reset):
```python
class EmailVerification(models.Model):
    user = ForeignKey(User)
    token = CharField(max_length=64, unique=True)  # 6-digit hex code
    expires_at = DateTimeField()  # 15 minutes
    is_used = BooleanField(default=False)
```

### 2. Updated Functions

**send_password_reset_email()** (in `core/utils.py`):
```python
def send_password_reset_email(user):
    """
    Send password reset email with verification code.
    Returns: tuple (password_reset, verification)
    """
    import secrets
    
    # Delete old verification codes (prevent accumulation)
    EmailVerification.objects.filter(
        user=user,
        expires_at__gt=timezone.now(),
        is_used=False
    ).delete()
    
    # Generate tokens
    token = PasswordReset.generate_token()
    verification_code = secrets.token_hex(3)  # 6-digit hex
    
    # Create records
    password_reset = PasswordReset.objects.create(...)
    verification = EmailVerification.objects.create(...)
    
    # Send email with code + link
    # ...
    
    return password_reset, verification
```

### 3. New API Endpoint

**Endpoint**: `POST /api/password-reset/verify-email/`

**Request**:
```json
{
  "email": "user@example.com",
  "code": "a3f2c1"
}
```

**Response (Success - 200)**:
```json
{
  "message": "Email verified successfully",
  "verified": true,
  "reset_token": "token_value_here",
  "code": "EMAIL_VERIFIED"
}
```

**Response (Invalid Code - 400)**:
```json
{
  "error": "Invalid or expired verification code",
  "code": "INVALID_CODE"
}
```

### 4. Updated Password Reset View

**PasswordResetConfirmView** (POST method now checks email verification):
```python
def post(self, request):
    # ...existing token validation...
    
    # NEW: Check if email has been verified
    email_verification = EmailVerification.objects.filter(
        user=user,
        is_used=True,
        expires_at__gt=timezone.now()
    ).exists()
    
    if not email_verification:
        return Response({
            'error': 'Please verify your email before resetting password',
            'code': 'EMAIL_NOT_VERIFIED',
            'requires_verification': True
        }, status=status.HTTP_403_FORBIDDEN)
    
    # ...proceed with password reset...
```

### 5. Updated URL Routes

**New URL** (in `core/urls.py`):
```python
path('api/password-reset/verify-email/', 
     PasswordResetVerifyEmailView.as_view(), 
     name='password-reset-verify-email')
```

---

## Frontend Implementation

### 1. Updated Auth Service

**authService.ts** - Added new method:
```typescript
async verifyPasswordResetEmail(email: string, code: string) {
  return apiClient.post('/api/password-reset/verify-email/', {
    email,
    code
  })
}
```

### 2. Updated Hook

**usePasswordReset** (in `useAuth.js`) - Added state and method:
```javascript
const [resetToken, setResetToken] = useState('')

const verifyPasswordResetEmail = async (email, code) => {
  const response = await authService.verifyPasswordResetEmail(email, code)
  setResetToken(response.data?.reset_token || '')
  return response.data?.reset_token
}
```

### 3. New Verification Page

**File**: `frontend/src/app/[locale]/auth/verify-reset-email/page.js`

**Features**:
- Shows email address from URL parameter
- Input field for 6-digit code
- Auto-uppercase input
- 15-minute expiry timer
- Redirects to reset-password with token on success
- Link to request new code

### 4. Updated Forgot Password Page

**File**: `frontend/src/app/[locale]/auth/forgot-password/page.js`

**Changes**:
- After email submitted, redirects to `/verify-reset-email?email=...`
- No longer shows success page - leads straight to verification
- Passes email via URL parameter

---

## Testing the Implementation

### Manual Testing Steps

1. **Request Password Reset**:
   ```bash
   curl -X POST http://localhost:8000/api/password-reset/ \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com"}'
   ```
   Expected: Returns `requires_verification: true`

2. **Check Email Console** (if dev environment):
   - Look for email with 6-digit code (e.g., `a3f2c1`)
   - Verify reset link in email

3. **Verify Email Code**:
   ```bash
   curl -X POST http://localhost:8000/api/password-reset/verify-email/ \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","code":"a3f2c1"}'
   ```
   Expected: Returns `reset_token` and `verified: true`

4. **Reset Password**:
   ```bash
   curl -X POST http://localhost:8000/api/password-reset/confirm/ \
     -H "Content-Type: application/json" \
     -d '{"token":"value_from_step_3","new_password":"NewPassword123"}'
   ```
   Expected: Returns `reset: true`

5. **Frontend Testing**:
   - Go to `/auth/forgot-password`
   - Enter email and submit
   - Should redirect to `/auth/verify-reset-email?email=...`
   - Enter code from email
   - Should redirect to `/auth/reset-password?token=...`
   - Enter new password
   - Should see success message
   - Login with new password should work

### Testing Error Cases

1. **Invalid Code**:
   - Enter wrong 6-digit code
   - Should show "Invalid or expired verification code"

2. **Expired Code** (wait 15 minutes):
   - Code should expire after 15 minutes
   - Trying to use it shows expiry error
   - User must request new reset

3. **Used Code** (try reusing):
   - Enter code twice
   - Second attempt fails with "Code already used"

4. **Missing Email**:
   - Call endpoint without email parameter
   - Should return 400 error

---

## Email Format

### Plain Text Email

```
Hello [User],

You requested to reset your password for your AirbCar account.

Your verification code is: A3F2C1

This code will expire in 15 minutes.

Once verified, you can reset your password using this link:
[Reset Link]

If you didn't request a password reset, please ignore this email.
Your account security is important to us.

Best regards,
The AirbCar Team
```

### HTML Email

Features professional formatting with:
- Bold verification code (large, monospaced font)
- Expiry warning
- Reset password button
- Security notice
- Colored styling (blue buttons, warning badges)

---

## Security Considerations

### Implemented Security Measures

1. **Code Format**:
   - 6-digit hex code (e.g., `a3f2c1`)
   - Generated using `secrets.token_hex(3)` (cryptographically secure)
   - Not sequential, not easily guessable

2. **Code Expiry**:
   - 15 minute expiry window
   - Prevents old codes from working
   - Enforced via database query

3. **One-Time Use**:
   - Code marked as `is_used=True` after verification
   - Can't reuse same code twice
   - Replaces old codes automatically

4. **Rate Limiting** (recommended):
   - Consider limiting verification attempts per IP
   - Prevents brute force attacks
   - Can add with `django-ratelimit`

5. **User Privacy**:
   - Generic error messages ("Invalid or expired" instead of "User not found")
   - Prevents email enumeration
   - Backend doesn't reveal if email exists

### Best Practices Implemented

- ✅ Secure token generation (using `secrets` module)
- ✅ Proper transaction handling for atomicity
- ✅ Comprehensive error logging
- ✅ User-friendly error messages
- ✅ Automatic cleanup of old codes
- ✅ Time-based expiry enforcement

---

## Deployment Checklist

### Before Deployment

- [ ] Test complete flow locally (5 minutes)
- [ ] Test email sending (Resend API or SMTP configured)
- [ ] Test error cases (invalid code, expired code)
- [ ] Test on production-like environment
- [ ] Verify URL routes are registered
- [ ] Check frontend pages redirect correctly

### After Deployment

- [ ] Monitor for verification failures in logs
- [ ] Check email delivery rates
- [ ] Monitor average verification time
- [ ] Test end-to-end from forgot password to login
- [ ] Check for any database errors
- [ ] Verify old codes are properly cleaned up

### Configuration Needed

No additional configuration needed! The system uses existing email backend configuration:
- `RESEND_API_KEY` (if using Resend API)
- `EMAIL_HOST`, `EMAIL_PORT`, etc. (if using SMTP)
- `DEFAULT_FROM_EMAIL` (sender address)
- `FRONTEND_URL` (for reset links in emails)

---

## Troubleshooting

### Issue: "Email verification code not received"

**Checks**:
1. Is email backend configured?
   ```bash
   python manage.py shell
   from django.conf import settings
   print(settings.RESEND_API_KEY or settings.EMAIL_HOST)
   ```

2. Check logs for email errors:
   ```bash
   grep -i "password reset" logs/django.log
   grep -i "resend\|smtp" logs/django.log
   ```

3. Check if Resend API key is valid (if using Resend)

### Issue: "Invalid verification code" when code is correct

**Checks**:
1. Is code already used?
   ```bash
   python manage.py shell
   from core.models import EmailVerification
   EmailVerification.objects.filter(token='a3f2c1').values('is_used', 'expires_at')
   ```

2. Has code expired? (Should be within 15 minutes)

3. Is email correct? (Check if matches exactly)

### Issue: "Email not verified" when trying to reset password

**Checks**:
1. Was email verification completed?
   ```bash
   python manage.py shell
   from core.models import EmailVerification
   EmailVerification.objects.filter(user_id=X, is_used=True).exists()
   ```

2. Did verification complete within expiry time?

---

## Monitoring & Logging

### Key Logs to Monitor

```bash
# Email sending attempts
"Password reset email with verification code sent to {email}"

# Verification attempts
"Invalid or expired password reset token attempted"

# Successful verification
"Email verified for password reset: {email}"

# Password reset completion
"Password successfully reset for user {email}"
```

### Metrics to Track

1. **Email Delivery Rate**:
   - Track emails sent vs. successfully delivered
   - Monitor for Resend/SMTP failures

2. **Verification Success Rate**:
   - Successful verifications / Total codes sent
   - Should be >90% if user doesn't wait too long

3. **Average Time to Verify**:
   - How long after email sent does user verify?
   - Should be <5 minutes for most users

4. **Failed Password Resets**:
   - After verification, how many don't complete reset?
   - Debug UI issues if completion rate is low

---

## Migration from Old System

If users had ongoing password resets from the old system (without verification):

1. Old PasswordReset tokens still valid
2. Must update `/confirm` endpoint to check verification
3. Users with old flows will be prompted to verify
4. Takes some time for all users to migrate

**Backward Compatibility**:
- ✅ Old password reset API still works
- ✅ Graceful degradation (users prompted to verify)
- ✅ No forced logout of existing sessions

---

## Files Changed

### Backend

| File | Changes |
|------|---------|
| `core/utils.py` | Updated `send_password_reset_email()` to generate verification code |
| `core/views/auth_views.py` | Added `PasswordResetVerifyEmailView` + Email verification check in password reset |
| `core/urls.py` | Added route for `/api/password-reset/verify-email/` |

### Frontend

| File | Changes |
|------|---------|
| `src/features/auth/services/authService.ts` | Added `verifyPasswordResetEmail()` method |
| `src/features/auth/hooks/useAuth.js` | Added `verifyPasswordResetEmail()` hook + `resetToken` state |
| `src/app/[locale]/auth/forgot-password/page.js` | Redirects to `/verify-reset-email` after email sent |
| `src/app/[locale]/auth/verify-reset-email/page.js` | **NEW** - Email verification form page |

---

## Next Steps

1. **Test the implementation** following the manual testing steps
2. **Deploy to production** after successful testing
3. **Monitor logs** for the first 24 hours after deployment
4. **Collect user feedback** on the new verification flow
5. **Optional**: Add rate limiting if needed
6. **Optional**: Add SMS verification as alternative method

---

## Support & Questions

For issues or questions:
1. Check logs: `logs/django.log`
2. Review error responses from API
3. Test with curl commands to isolate issues
4. Check email backend configuration
5. Review this documentation for troubleshooting section

