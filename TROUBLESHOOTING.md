# Action.IT Troubleshooting Guide

## 🚨 404 Routing Issues

### **Problem: Getting 404 errors when clicking login or navigating to routes**

**Symptoms:**
- `GET https://actionit-dev.vercel.app/login [HTTP/2 404]`
- `GET https://actionit-dev.vercel.app/app [HTTP/2 404]`
- Direct URL access returns 404

### **Root Cause**
Vercel is not properly handling client-side routing for React Router. The server is looking for actual files at these paths instead of serving the React app.

### **Solution 1: Updated Vercel Configuration**

The `vercel.json` file has been updated with comprehensive routing rules:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "redirects": [
    {
      "source": "/login",
      "destination": "/index.html",
      "permanent": false
    },
    {
      "source": "/app",
      "destination": "/index.html",
      "permanent": false
    }
  ]
}
```

### **Solution 2: Manual Vercel Deployment**

If the automatic deployment isn't working:

1. **Check Vercel Dashboard:**
   - Go to https://vercel.com/dashboard
   - Find your `actionit-dev` project
   - Check deployment status

2. **Trigger Manual Redeploy:**
   - In Vercel dashboard, click "Redeploy"
   - Or push a new commit to trigger deployment

3. **Clear Vercel Cache:**
   - In project settings, clear build cache
   - Redeploy the project

### **Solution 3: Environment Variables**

Ensure these environment variables are set in Vercel:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_RECALL_API_KEY=your_recall_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

### **Solution 4: Debug Steps**

1. **Check Browser Console:**
   ```javascript
   // Look for these debug messages
   [App] Component rendering - App.tsx
   [App] Current window location: https://actionit-dev.vercel.app/
   [App] Route accessed: /login -> Component: Login
   ```

2. **Check Network Tab:**
   - Look for failed requests
   - Check response headers
   - Verify redirects

3. **Test Direct URLs:**
   - `https://actionit-dev.vercel.app/` (should work)
   - `https://actionit-dev.vercel.app/login` (should work)
   - `https://actionit-dev.vercel.app/app` (should work)

### **Solution 5: Alternative Configuration**

If the current `vercel.json` doesn't work, try this simpler version:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### **Solution 6: Vercel CLI Debug**

Install Vercel CLI and debug locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Pull project settings
vercel pull

# Deploy manually
vercel --prod
```

### **Solution 7: Custom Domain Issues**

If using a custom domain:

1. **Check DNS Settings:**
   - Ensure A records point to Vercel
   - Verify CNAME records

2. **Update OAuth Redirects:**
   - Add custom domain to Google OAuth
   - Update Supabase allowed origins

### **Expected Behavior After Fix**

**✅ Working URLs:**
- `https://actionit-dev.vercel.app/` → Home page
- `https://actionit-dev.vercel.app/login` → Login page
- `https://actionit-dev.vercel.app/app` → Dashboard
- `https://actionit-dev.vercel.app/app/calendar` → Calendar
- `https://actionit-dev.vercel.app/app/settings` → Settings

**✅ Console Logs:**
```javascript
[App] Component rendering - App.tsx
[App] Route accessed: /login -> Component: Login
[Login] Component rendering
[Login] Current window location: https://actionit-dev.vercel.app/login
```

### **Still Having Issues?**

1. **Check Vercel Build Logs:**
   - Look for build errors
   - Check for missing dependencies

2. **Verify File Structure:**
   ```
   dist/
   ├── index.html          # Should exist
   ├── assets/
   │   ├── index-*.css
   │   └── index-*.js
   ```

3. **Test Locally:**
   ```bash
   npm run build
   npm run preview
   # Test at http://localhost:4173
   ```

### **Contact Support**

If issues persist:
- **Vercel Support:** https://vercel.com/support
- **GitHub Issues:** https://github.com/Cyborg-Hawk-AI/actionit-dev/issues
- **Documentation:** https://vercel.com/docs 