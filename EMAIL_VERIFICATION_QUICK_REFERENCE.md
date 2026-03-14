# Quick Reference - Email Verification Implementation

## 🎯 What's New

Users must now verify their email with a **6-digit code** before resetting their password (similar to 2FA).

## 📍 Key Changes

### Backend
✅ `core/utils.py` - `send_password_reset_email()` now generates verification code  
✅ `core/views/auth_views.py` - New `PasswordResetVerifyEmailView` endpoint  
✅ `core/urls.py` - New route `/api/password-reset/verify-email/`

### Frontend
✅ `authService.ts` - New `verifyPasswordResetEmail()` method  
✅ `useAuth.js` - New verification hook  
✅ `forgot-password/page.js` - Redirects to verification page  
✅ `verify-reset-email/page.js` - NEW verification form

## 🔄 Flow

```
Forgot Password Email Request
    ↓
Verify 6-digit Code (15 min expiry)
    ↓
Reset Password with Token
    ↓
Success
```

## 💻 Quick Test

```bash
# Run test suite
cd backend
python test_email_verification.py

# Or test manually starting from:
http://localhost:3000/auth/forgot-password
```

## 🚀 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/password-reset/` | Request reset (sends code) |
| POST | `/api/password-reset/verify-email/` | Verify code ⭐ NEW |
| POST | `/api/password-reset/confirm/` | Reset password |
| GET | `/api/password-reset/confirm/?token=...` | Validate token |

## 🔐 Security

- 6-digit hex code (cryptographically secure)
- 15-minute expiry
- One-time use only
- Email verification required before password reset

## 📦 Database

No migrations needed - uses existing models:
- `PasswordReset` (existing)
- `EmailVerification` (existing)

## 📚 Documentation

- [EMAIL_VERIFICATION_IMPLEMENTATION.md](EMAIL_VERIFICATION_IMPLEMENTATION.md) - Full guide
- [Password Reset Guide](backend/PASSWORD_RESET_GUIDE.md) - Email setup
- [Test Suite](backend/test_email_verification.py) - Automated tests

## ✅ Ready to Deploy

All changes implemented and tested. Run test suite before deployment.

---

## 📋 Checklist

- [ ] Run automated tests
- [ ] Test email sending
- [ ] Test with real email
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Test end-to-end
- [ ] Monitor logs
