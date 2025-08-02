# Action.IT Deployment Guide

## 🚀 Vercel Deployment

### **Automatic Deployment**
Your Action.IT application is configured for automatic deployment on Vercel. The `vercel.json` file handles client-side routing to prevent 404 errors.

### **Environment Variables Setup**

In your Vercel dashboard, configure these environment variables:

#### **Required Variables**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Calendar API
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret

# Recall.ai Integration
VITE_RECALL_API_KEY=your_recall_api_key
VITE_RECALL_WEBHOOK_SECRET=your_recall_webhook_secret

# OpenAI for AI Insights
VITE_OPENAI_API_KEY=your_openai_api_key
```

#### **Optional Variables**
```env
# Microsoft Calendar (Optional)
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id
VITE_MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# Google Analytics (Optional)
VITE_GA_MEASUREMENT_ID=your_ga_measurement_id

# Development Settings
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
```

### **Vercel Configuration**

The `vercel.json` file includes:

1. **Client-side routing** - All routes redirect to `index.html`
2. **Cache headers** - Proper caching for app routes
3. **CORS headers** - For API endpoints
4. **Function runtime** - For Supabase Edge Functions

### **URL Structure**

After deployment, your URLs will be:

- **Main App:** `https://actionit-dev.vercel.app/`
- **Dashboard:** `https://actionit-dev.vercel.app/app`
- **Calendar:** `https://actionit-dev.vercel.app/app/calendar`
- **Settings:** `https://actionit-dev.vercel.app/app/settings`
- **Login:** `https://actionit-dev.vercel.app/login`

### **Troubleshooting 404 Errors**

If you encounter 404 errors:

1. **Check Vercel deployment** - Ensure the latest commit is deployed
2. **Verify environment variables** - All required variables must be set
3. **Check build logs** - Look for any build errors
4. **Clear cache** - Vercel may cache old versions

### **Custom Domain Setup**

To use a custom domain:

1. **Add domain in Vercel** - Go to Project Settings > Domains
2. **Configure DNS** - Point to Vercel's nameservers
3. **Update OAuth redirects** - Add custom domain to OAuth providers
4. **Update Supabase settings** - Add custom domain to allowed origins

### **Performance Optimization**

- **Enable Edge Functions** - For Supabase functions
- **Configure CDN** - Vercel automatically handles this
- **Optimize images** - Use WebP format where possible
- **Enable compression** - Vercel handles gzip/brotli

### **Monitoring**

- **Vercel Analytics** - Built-in performance monitoring
- **Error tracking** - Configure error reporting
- **Uptime monitoring** - Set up alerts for downtime

### **Security**

- **HTTPS** - Automatically enabled by Vercel
- **Security headers** - Configured in `vercel.json`
- **CORS** - Properly configured for APIs
- **Environment variables** - Securely stored in Vercel

## 🔧 Manual Deployment

If you need to deploy manually:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## 📊 Deployment Checklist

- [ ] Environment variables configured
- [ ] OAuth providers updated with production URLs
- [ ] Supabase project configured for production
- [ ] Custom domain configured (if needed)
- [ ] Error monitoring set up
- [ ] Performance monitoring enabled
- [ ] Security headers configured
- [ ] CORS settings updated
- [ ] Cache strategy optimized
- [ ] SSL certificate verified

## 🆘 Common Issues

### **404 Errors**
- **Cause:** Client-side routing not configured
- **Solution:** Ensure `vercel.json` is deployed

### **Authentication Issues**
- **Cause:** OAuth redirect URLs not updated
- **Solution:** Update OAuth provider settings

### **API Errors**
- **Cause:** Environment variables missing
- **Solution:** Check Vercel environment variables

### **Build Failures**
- **Cause:** TypeScript errors or missing dependencies
- **Solution:** Check build logs and fix errors

## 📞 Support

- **Vercel Documentation:** https://vercel.com/docs
- **GitHub Issues:** https://github.com/Cyborg-Hawk-AI/actionit-dev/issues
- **Vercel Support:** https://vercel.com/support 