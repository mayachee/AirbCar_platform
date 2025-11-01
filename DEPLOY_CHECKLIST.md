# ✅ Backend Deployment Checklist

## Pre-Deployment

- [ ] Code is pushed to GitHub repository
- [ ] All tests passing locally
- [ ] Backend runs successfully with `docker-compose up`
- [ ] Database migrations working
- [ ] API endpoints tested with Postman

## Environment Variables to Set

Copy these values and prepare to add them to your hosting platform:

```bash
# Database (Supabase)
DATABASE_HOST=aws-1-eu-north-1.pooler.supabase.com
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=postgres.wtbmqtmmdobfvvecinif
DATABASE_PASSWORD=Mayache+123455

# Django Security
SECRET_KEY=<GENERATE-NEW-KEY-BELOW>
DEBUG=False
ALLOWED_HOSTS=your-backend.onrender.com

# CORS
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:3000

# Admin User
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@airbcar.com
DJANGO_SUPERUSER_PASSWORD=YourSecurePassword123!

# Optional
LOAD_INITIAL_FIXTURE=1
```

## Generate SECRET_KEY

Run this Python command:
```python
import secrets
print(secrets.token_urlsafe(50))
```

Or visit: https://djecrety.ir/

## Deploy to Render (Recommended)

### Steps:
1. [ ] Sign up at render.com
2. [ ] Click "New Web Service"
3. [ ] Connect GitHub repo
4. [ ] Set Root Directory: `backend`
5. [ ] Environment: Docker
6. [ ] Dockerfile Path: `Dockerfile`
7. [ ] Add ALL environment variables above
8. [ ] Click "Create Web Service"
9. [ ] Wait 5-10 minutes for deployment
10. [ ] Copy your backend URL (e.g., `https://airbcar-backend.onrender.com`)

### Test Endpoints:
- [ ] `GET https://your-backend.onrender.com/api/` - Should respond
- [ ] `GET https://your-backend.onrender.com/admin/` - Should show login
- [ ] Test login with `/api/auth/login/`
- [ ] Test registration with `/api/auth/register/`

## Post-Deployment

### Backend:
- [ ] Backend URL works
- [ ] API responds correctly
- [ ] Database connected
- [ ] No errors in logs
- [ ] Admin panel accessible
- [ ] CORS configured properly

### Frontend Update:
Update `.env.local`:
```env
NEXT_PUBLIC_DJANGO_API_URL=https://your-backend.onrender.com
```

- [ ] Frontend can connect to backend
- [ ] Authentication works
- [ ] API calls successful
- [ ] No CORS errors

### Security:
- [ ] DEBUG=False in production
- [ ] SECRET_KEY is secure and not default
- [ ] ALLOWED_HOSTS configured
- [ ] HTTPS enabled
- [ ] Admin credentials changed
- [ ] Database credentials secure

## Troubleshooting

If deployment fails:

1. **Check Build Logs**
   - Go to Render dashboard → Your service → Logs
   - Look for error messages

2. **Common Issues:**

   **Build Fails:**
   - Verify `backend/Dockerfile` exists
   - Check `backend/requirements.txt` exists
   - Verify Python version compatibility

   **Container Won't Start:**
   - Check all environment variables are set
   - Verify DATABASE_* variables are correct
   - Look at startup logs

   **Database Connection Failed:**
   - Verify Supabase credentials
   - Check DATABASE_HOST includes `.pooler.supabase.com`
   - Test connection from local machine

   **500 Internal Server Error:**
   - Check application logs
   - Verify SECRET_KEY is set
   - Check DEBUG=False
   - Run migrations manually: `python manage.py migrate`

   **CORS Errors:**
   - Verify CORS_ALLOWED_ORIGINS includes frontend URL
   - Check URL has proper protocol (https:// or http://)
   - Verify CORS middleware enabled in settings.py

## Monitoring

- [ ] Set up uptime monitoring (optional)
- [ ] Check logs regularly
- [ ] Monitor error rates
- [ ] Track response times

## Rollback Plan

If something goes wrong:
1. Render: Go to Deploys → Select previous working version → Manual Deploy
2. Railway: Go to Deploys → Roll back to previous version
3. Keep backups of working configurations

## Next Steps

After successful deployment:
1. [ ] Update frontend to use new backend URL
2. [ ] Redeploy frontend
3. [ ] Test full application flow
4. [ ] Share with your team
5. [ ] Document any custom configurations

## Useful Commands

**Local Testing:**
```bash
cd backend
docker build -t airbcar-backend .
docker run -p 8000:8000 --env-file .env airbcar-backend
```

**Check Logs:**
```bash
# Render
- Go to dashboard → Logs tab

# Railway
railway logs
```

**Run Migrations Manually:**
```bash
railway run python manage.py migrate  # Railway
# Or use Render's shell feature
```

## Success! 🎉

Your backend should now be live at:
`https://your-backend.onrender.com`

Update your frontend and you're good to go!

