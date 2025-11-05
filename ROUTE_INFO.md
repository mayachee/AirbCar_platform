# Partner Profile Routes

## ✅ Correct URLs

### Frontend Route (What users see in browser)
```
http://localhost:3000/partner/38
http://localhost:3000/partner/acme-car-rental
```

**Route Path:** `/partner/[slug]`  
**File:** `frontend/src/app/partner/[slug]/page.js`

### Backend API (Internal API call)
```
http://localhost:8000/partners/public/38/
http://localhost:8000/partners/public/acme-car-rental/
```

**Route Path:** `/partners/public/<slug>/`  
**File:** `backend/airbcar_backend/core/views.py` (public_partner_profile_view)

## ❌ Wrong URLs

- ❌ `http://localhost:3000/public/partner/38` - Wrong (has `/public/` in frontend URL)
- ❌ `http://localhost:3000/partners/38` - Wrong (plural `partners` instead of `partner`)

## 📝 How It Works

1. User visits: `http://localhost:3000/partner/38`
2. Frontend page (`/partner/[slug]/page.js`) loads
3. Frontend makes API call: `http://localhost:8000/partners/public/38/`
4. Backend returns partner data
5. Frontend displays the partner profile

## 🔍 Quick Test

1. **Frontend:** Visit `http://localhost:3000/partner/38`
2. **Backend API:** Visit `http://localhost:8000/partners/public/38/` (should return JSON)
3. **Browser Console:** Check for API call logs when visiting frontend URL


