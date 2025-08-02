
# Setting Up OAuth Secrets in Supabase

This document explains how to add and manage your OAuth secrets in Supabase for use with Edge Functions.

## Prerequisites

1. Access to your Supabase project
2. OAuth credentials from Google and/or Microsoft (refer to their respective setup guides)

## Step 1: Navigate to Edge Function Secrets

1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. In the left sidebar, go to "Settings" > "API"
4. Scroll down to "Edge Functions" section

## Step 2: Add OAuth Secrets

For Google Calendar integration:

1. Click "Add New Secret"
2. Enter `GOOGLE_CLIENT_ID` as the name
3. Paste your Google OAuth Client ID as the value
4. Click "Save"

5. Click "Add New Secret" again
6. Enter `GOOGLE_CLIENT_SECRET` as the name
7. Paste your Google OAuth Client Secret as the value
8. Click "Save"

For Microsoft Calendar integration:

1. Click "Add New Secret"
2. Enter `MICROSOFT_CLIENT_ID` as the name
3. Paste your Microsoft Azure App Client ID as the value
4. Click "Save"

5. Click "Add New Secret" again
6. Enter `MICROSOFT_CLIENT_SECRET` as the name
7. Paste your Microsoft Azure App Client Secret as the value
8. Click "Save"

## Step 3: Set Redirect URI (Optional)

If you need to override the default redirect URI:

1. Click "Add New Secret"
2. Enter `REDIRECT_URI` as the name
3. Enter your redirect URI (e.g., `https://meet-ai-insights-hub.lovable.app/auth/callback`)
4. Click "Save"

## Step 4: Verify Edge Function Configuration

Ensure your edge function is properly configured to use these secrets:

1. In the Supabase dashboard, go to "Edge Functions"
2. Select your `calendar-auth` function
3. Verify that the function is configured to access the secrets you've added
4. If needed, update the function's permissions

## Step 5: Restart Edge Functions (If Necessary)

After adding or updating secrets:

1. Go to "Edge Functions" in the Supabase dashboard
2. Find your `calendar-auth` function
3. Click on the "..." menu
4. Select "Restart" to ensure the function picks up the new secret values

## Security Best Practices

- Never store OAuth secrets in your frontend code or version control
- Regularly rotate your client secrets (especially if you suspect they've been compromised)
- Use the principle of least privilege when configuring OAuth permissions
- Monitor usage of your OAuth applications for unusual activity
