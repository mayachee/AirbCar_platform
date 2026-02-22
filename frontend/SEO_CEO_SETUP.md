# CEO & Organization SEO Setup for Google Search

This setup makes your CEO and organization information visible in Google Search results. Here's what has been implemented:

## Files Created/Updated

### 1. **src/lib/seoConfig.js** - Configuration File
   - **Location**: `src/lib/seoConfig.js`
   - **Purpose**: Central configuration for CEO and organization information
   - **Update Required**: Edit this file with actual CEO details:
     ```javascript
     ceo: {
       name: "CEO Name", // UPDATE THIS
       email: "ceo@airbcar.com",
       phone: "+212-YOUR-PHONE",
       image: "https://airbcar.com/ceo-photo.jpg",
       // ... other fields
     }
     ```

### 2. **src/app/layout.js** - Main Layout
   - **What Changed**: Added JSON-LD structured data for:
     - Organization schema with CEO information
     - Local Business schema for Google Business Profile
   - **How It Works**: Automatically generates rich snippets for Google

### 3. **public/robots.txt** - Search Engine Crawler Instructions
   - **Location**: `public/robots.txt`
   - **Purpose**: Tells Google how to crawl your site
   - **Status**: ✅ Configured to allow indexing

### 4. **src/app/sitemap.ts** - XML Sitemap
   - **Location**: `src/app/sitemap.ts`
   - **Purpose**: Lists all important pages for Google to crawl
   - **Auto-Generated**: Next.js automatically creates `/sitemap.xml`

### 5. **src/app/ceo/page.js** - CEO Profile Page
   - **Location**: `src/app/ceo`
   - **URL**: `https://airbcar.com/ceo`
   - **Purpose**: Dedicated CEO profile page with structured data
   - **SEO Features**: 
     - Custom meta tags
     - Person schema markup
     - Open Graph tags for social sharing

## How to Make CEO Visible in Google Search

### Step 1: Update seoConfig.js
```bash
# Edit this file with real CEO information
frontend/src/lib/seoConfig.js
```

**Fields to update:**
- `ceo.name` - Full name
- `ceo.email` - Business email
- `ceo.phone` - Contact phone
- `ceo.image` - Professional photo URL
- `ceo.bio` - Professional biography
- `ceo.linkedInURL` - LinkedIn profile
- `ceo.twitterURL` - Twitter handle
- `contact.email` & `contact.phone` - Organization contact
- `socialMedia.*` - Social media links
- `rating.*` - Customer ratings

### Step 2: Deploy to Production
```bash
npm run build
npm run start
```

### Step 3: Submit to Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your domain: `https://airbcar.com`
3. Verify ownership (via DNS, HTML file, or Google Analytics)
4. Submit sitemap: `https://airbcar.com/sitemap.xml`
5. Request indexing for key pages:
   - Homepage
   - `/ceo` (CEO Profile)
   - `/cars`
   - `/partner`

### Step 4: Verify in Google Search Console
- Check **Coverage** to ensure pages are indexed
- Check **Enhancements** → **Rich Results** to see structured data
- Monitor **Performance** to track search visibility

## What Google Will Show

### In Search Results:
- ✅ CEO name and role
- ✅ Organization logo
- ✅ Business description
- ✅ Opening hours
- ✅ Star ratings
- ✅ Contact information

### In Google Business Profile:
- ✅ CEO information
- ✅ Business photos
- ✅ Hours of operation
- ✅ Customer reviews
- ✅ Location address

## SEO Features Implemented

| Feature | Status | Location |
|---------|--------|----------|
| Organization Schema | ✅ | layout.js |
| Local Business Schema | ✅ | layout.js |
| Person Schema (CEO) | ✅ | ceo/page.js |
| Open Graph Tags | ✅ | seoConfig.js |
| Robots.txt | ✅ | public/robots.txt |
| Sitemap | ✅ | sitemap.ts |
| CEO Profile Page | ✅ | ceo/page.js |
| Meta Tags | ✅ | layout.js |
| Title & Description | ✅ | metadata |

## Testing Your Setup

### 1. Validate Structured Data
```bash
# Use Google's Rich Results Test
https://search.google.com/test/rich-results
# Paste your site URL to validate JSON-LD markup
```

### 2. Check Robots.txt
```
https://airbcar.com/robots.txt
```

### 3. Verify Sitemap
```
https://airbcar.com/sitemap.xml
```

### 4. Test CEO Page
```
https://airbcar.com/ceo
```

## Next Steps

1. **Register domain with Google Search Console**
   - Claim your business information
   - Verify CEO details

2. **Create Google Business Profile**
   - Add CEO information as key personnel
   - Upload professional photo

3. **Build backlinks**
   - Get mentioned in business directories
   - Content marketing mentioning CEO

4. **Regular updates**
   - Keep CEO profile current
   - Update ratings and reviews
   - Maintain structured data

## Advanced: Customize Further

### Add CEO to Home Page
Edit `src/app/page.js` to feature CEO information prominently.

### Add Press/News Section
Create `/news` or `/press` to build E-E-A-T signals (Experience, Expertise, Authority, Trustworthiness).

### Add Testimonials
Include customer testimonials with structured data:
```javascript
{
  "@type": "Review",
  "author": { "@type": "Person", "name": "Customer Name" },
  "reviewRating": { "@type": "Rating", "ratingValue": "5" }
}
```

## Support & Resources

- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org)
- [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Business Profile Help](https://support.google.com/business/answer/7091)

---

**Last Updated**: February 2026
**Status**: Ready for deployment ✅
