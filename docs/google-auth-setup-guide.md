
# Google OAuth Setup Guide for Action.IT

This guide provides step-by-step instructions for setting up Google OAuth authentication for your Action.IT application.

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page and select "New Project"
3. Enter a name for your project (e.g., "Action.IT") and click "Create"
4. Wait for the project to be created and then select it from the dropdown

## 2. Enable Required APIs

1. In your Google Cloud project, navigate to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - Google Calendar API
   - Google People API (for profile information)

## 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" if this is for general use (or "Internal" if only for your organization)
3. Fill in the required fields:
   - App name: "Action.IT"
   - User support email: Your email address
   - Developer contact information: Your email address
4. Click "Save and Continue"
5. Add the following scopes:
   - `https://www.googleapis.com/auth/calendar.readonly` (Google Calendar)
   - `https://www.googleapis.com/auth/calendar.events.readonly` (Google Calendar Events)
   - `email` (User email)
   - `profile` (User profile)
6. Click "Save and Continue"
7. Add test users if you're in testing mode, then click "Save and Continue"
8. Review your settings and click "Back to Dashboard"

## 4. Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name for your OAuth client (e.g., "Action.IT Web Client")
5. Add Authorized JavaScript origins:
   - `https://vfsnygvfgtqwjwrwnseg.supabase.co` (Your Supabase project URL)
   - `https://meet-ai-insights-hub.lovable.app` (Your application URL without www prefix)
   - `https://www.meet-ai-insights-hub.lovable.app` (Your application URL with www prefix)
   - `https://preview--meet-ai-insights-hub.lovable.app` (Your preview URL)
   - `http://localhost:5173` (For local development)
6. Add Authorized redirect URIs:
   - `https://vfsnygvfgtqwjwrwnseg.supabase.co/auth/v1/callback`
   - `https://meet-ai-insights-hub.lovable.app/auth/callback` (Without www prefix)
   - `https://www.meet-ai-insights-hub.lovable.app/auth/callback` (With www prefix)
   - `https://preview--meet-ai-insights-hub.lovable.app/auth/callback` (Preview URL)
   - `http://localhost:5173/auth/callback` (For local development)
7. Click "Create"

## 5. Get Your OAuth Credentials

After creating the OAuth client ID, you'll see a modal with:
1. **Client ID**: Copy this value
2. **Client Secret**: Copy this value

These credentials need to be added to your Supabase project.

## 6. Add Credentials to Supabase Edge Function Secrets

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard/)
2. Select your project
3. Navigate to "Settings" > "API" > "Edge Functions"
4. Add the following secrets:
   - `GOOGLE_CLIENT_ID`: Paste your Google Client ID
   - `GOOGLE_CLIENT_SECRET`: Paste your Google Client Secret

## 7. Configure Supabase Authentication

1. In the Supabase dashboard, go to "Authentication" > "Providers"
2. Find and enable "Google"
3. Enter your Google Client ID and Client Secret
4. Save changes

## 8. Configure Site URL and Redirect URLs

1. In the Supabase dashboard, go to "Authentication" > "URL Configuration"
2. Set the Site URL to `https://meet-ai-insights-hub.lovable.app`
3. Add the following to the Redirect URLs:
   - `https://meet-ai-insights-hub.lovable.app/auth/callback`
   - `https://www.meet-ai-insights-hub.lovable.app/auth/callback`
   - `https://preview--meet-ai-insights-hub.lovable.app/auth/callback`
   - `https://meet-ai-insights-hub.lovable.app`
   - `http://localhost:5173/auth/callback` (For local development)

## Troubleshooting Common Issues

### SSL Certificate Issues

If you encounter SSL errors when redirecting:
- **VERY IMPORTANT**: Add *both* the www and non-www versions of your domain to all authorized domains and redirect URIs in Google Cloud
- When seeing `SSL_ERROR_NO_CYPHER_OVERLAP`, this typically means there's a mismatch between the domain being redirected to and the domains that have been authorized
- Always ensure that every URL variant (www, non-www, preview, etc.) is properly listed in both Google Cloud Console and Supabase settings

### Redirect Issues

If redirects fail with "invalid redirect URI" or similar:
- Double-check that the redirect URI in Google Cloud matches exactly (character for character) with what your application sends
- Always include all possible domain variants (www, non-www, preview URLs, etc.) in your Google Cloud settings
- Make sure the URI path case matches exactly (e.g., `/auth/callback` not `/Auth/Callback`)
- Check browser console logs to see the exact redirect URI being sent

### Authentication Failures

If authentication fails:
- Look at the browser console for detailed error messages
- Verify that all required scopes are properly configured
- Check the Edge Function logs in Supabase for any errors during the token exchange process
- Ensure the OAuth consent screen is properly set up

## Testing Your Integration

1. Navigate to your application's login page
2. Click the "Sign in with Google" button
3. Go through the Google OAuth flow
4. You should be redirected back to your application after successful authentication
5. If you encounter errors, check browser console and Supabase Edge Function logs for details

