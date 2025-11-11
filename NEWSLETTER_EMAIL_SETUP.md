# 📧 Newsletter Email Setup

## ✅ What I Fixed

I've updated the newsletter subscription endpoint to **send a welcome email** when someone subscribes. However, you need to configure email credentials for emails to actually be sent.

## 🔧 Email Configuration

### Current Status

Looking at your `docker-compose.yml`, email credentials are not set:
```yaml
EMAIL_HOST_USER: ${EMAIL_HOST_USER:-}  # Empty!
EMAIL_HOST_PASSWORD: ${EMAIL_HOST_PASSWORD:-}  # Empty!
```

When credentials are empty, Django uses the **console backend** - emails are printed to Docker logs instead of being sent.

## 📨 Option 1: Configure Gmail SMTP (Recommended for Development)

### Step 1: Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Enable 2-Factor Authentication (if not already enabled)
3. Go to "App Passwords": https://myaccount.google.com/apppasswords
4. Create a new app password for "Mail"
5. Copy the 16-character password

### Step 2: Update docker-compose.yml

Edit `docker-compose.yml` and set your email credentials:

```yaml
services:
  web:
    environment:
      # ... other environment variables ...
      EMAIL_HOST: smtp.gmail.com
      EMAIL_PORT: 587
      EMAIL_USE_TLS: True
      EMAIL_HOST_USER: your-email@gmail.com  # Your Gmail address
      EMAIL_HOST_PASSWORD: xxxx xxxx xxxx xxxx  # Your Gmail app password (16 chars)
      DEFAULT_FROM_EMAIL: your-email@gmail.com  # Or: noreply@airbcar.com
```

### Step 3: Restart Docker Container

```bash
docker-compose up -d --build web
```

## 📨 Option 2: Use Environment Variables (More Secure)

Instead of putting credentials in `docker-compose.yml`, use a `.env` file:

### Step 1: Create `.env` file (in project root)

```bash
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx
DEFAULT_FROM_EMAIL=noreply@airbcar.com
```

### Step 2: Update docker-compose.yml

```yaml
services:
  web:
    env_file:
      - .env  # Load environment variables from .env file
    environment:
      # ... other variables ...
      EMAIL_HOST: ${EMAIL_HOST:-smtp.gmail.com}
      EMAIL_PORT: ${EMAIL_PORT:-587}
      EMAIL_USE_TLS: ${EMAIL_USE_TLS:-True}
      EMAIL_HOST_USER: ${EMAIL_HOST_USER}
      EMAIL_HOST_PASSWORD: ${EMAIL_HOST_PASSWORD}
      DEFAULT_FROM_EMAIL: ${DEFAULT_FROM_EMAIL:-from@airbcar.com}
```

### Step 3: Add `.env` to `.gitignore`

```bash
echo ".env" >> .gitignore
```

## 📨 Option 3: Use Other SMTP Providers

### SendGrid
```yaml
EMAIL_HOST: smtp.sendgrid.net
EMAIL_PORT: 587
EMAIL_HOST_USER: apikey
EMAIL_HOST_PASSWORD: your-sendgrid-api-key
```

### Mailgun
```yaml
EMAIL_HOST: smtp.mailgun.org
EMAIL_PORT: 587
EMAIL_HOST_USER: your-mailgun-username
EMAIL_HOST_PASSWORD: your-mailgun-password
```

### AWS SES
```yaml
EMAIL_HOST: email-smtp.us-east-1.amazonaws.com
EMAIL_PORT: 587
EMAIL_HOST_USER: your-aws-access-key
EMAIL_HOST_PASSWORD: your-aws-secret-key
```

## 🧪 Testing

### Test 1: Check Docker Logs

After configuring email, subscribe to the newsletter and check logs:

```bash
docker-compose logs -f web
```

You should see:
```
[NEWSLETTER] ✅ Subscription received: test@example.com
[NEWSLETTER] 📧 Welcome email sent to: test@example.com
```

### Test 2: Check Your Email

Check the inbox (and spam folder) of the email you subscribed with.

### Test 3: Verify Email Configuration

Check if emails are being sent or just logged:

```bash
docker-compose logs web | grep "Welcome email"
```

If you see "Welcome email sent" but no email arrives, check:
- Email credentials are correct
- Spam/junk folder
- Gmail app password is valid
- SMTP port is not blocked

## 🔍 Troubleshooting

### Emails Not Sending?

1. **Check Docker logs** for error messages:
   ```bash
   docker-compose logs web | grep -i email
   ```

2. **Verify credentials** are set correctly:
   ```bash
   docker-compose exec web env | grep EMAIL
   ```

3. **Test email configuration**:
   ```bash
   docker-compose exec web python manage.py shell
   ```
   Then in Python shell:
   ```python
   from django.core.mail import send_mail
   from django.conf import settings
   print(f"Email backend: {settings.EMAIL_BACKEND}")
   print(f"Email host: {settings.EMAIL_HOST}")
   print(f"Email user: {settings.EMAIL_HOST_USER}")
   send_mail('Test', 'Test message', settings.DEFAULT_FROM_EMAIL, ['your-email@example.com'])
   ```

### Emails Going to Spam?

- Use a professional "From" address (not Gmail)
- Set up SPF/DKIM records for your domain
- Include unsubscribe links (already included in the email template)

### Console Backend (Development)

If you don't want to configure SMTP for development, emails will be printed to Docker logs. This is fine for testing, but won't work in production.

## 📝 What the Email Contains

The welcome email includes:
- ✅ Welcome message
- ✅ Information about what subscribers will receive
- ✅ Link to explore cars
- ✅ Unsubscribe link
- ✅ Beautiful HTML styling with Airbcar branding

## 🚀 After Configuration

1. **Update docker-compose.yml** with email credentials
2. **Rebuild container**: `docker-compose up -d --build web`
3. **Test subscription**: Subscribe to newsletter from the footer
4. **Check email**: Look for welcome email in inbox
5. **Check logs**: Verify email was sent in Docker logs

---

**Next Steps**: Configure email credentials in `docker-compose.yml` and rebuild the container!

