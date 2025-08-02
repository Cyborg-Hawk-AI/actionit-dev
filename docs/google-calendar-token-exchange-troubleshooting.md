
# Troubleshooting Google Calendar Token Exchange Issues

## Issue Identified
Based on the error logs, we've identified two key issues with the Google Calendar authentication flow:

1. **Database Query Error**: The edge function is attempting to query a non-existent table path `public.auth.users`
2. **Token Exchange Failure**: The Google OAuth token exchange is failing with a non-2xx status code

## Required Fixes

### Code-Level Fixes (Already Implemented)
1. Corrected the user authentication check in the edge function
2. Fixed the database structure verification
3. Improved token exchange error handling and retry logic

### Google Cloud Platform (GCP) Configuration

To properly configure Google OAuth, follow these steps:

1. **Verify Redirect URIs in Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project
   - Navigate to "APIs & Services" > "Credentials"
   - Find your OAuth 2.0 Client ID and click to edit
   - Under "Authorized redirect URIs", ensure you have the exact URL:
     ```
     https://preview--meet-ai-insights-hub.lovable.app/auth/callback
     ```
   - Also add any other relevant domains you're using (production, development):
     ```
     https://meet-ai-insights-hub.lovable.app/auth/callback
     https://actionit.ai/auth/callback
     http://localhost:5173/auth/callback
     ```

2. **Check API Permissions**:
   - Go to "APIs & Services" > "Library"
   - Make sure "Google Calendar API" is enabled
   - Verify that all required scopes are enabled in your OAuth consent screen:
     - `https://www.googleapis.com/auth/calendar.readonly`
     - `https://www.googleapis.com/auth/calendar.events.readonly`
     - `email`
     - `profile`
     - `openid`

3. **Verify OAuth Consent Screen Configuration**:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Ensure your app information is correct
   - If in testing, add your email address as a test user
   - Verify publishing status (if in production)

4. **Check Client ID and Secret**:
   - Ensure your Google Client ID and Secret are correctly set in Supabase edge function secrets
   - The secrets should be named exactly `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

## Verifying Your Fix

After making these changes:

1. Try connecting your Google Calendar again through the application
2. Check the edge function logs for any new errors
3. If successful, you should be redirected back to the calendar page with a success message
4. Verify that calendar data is being properly fetched

## Common Issues and Solutions

- **Invalid Redirect URI**: This often happens when the URI registered in Google Cloud Console doesn't exactly match the one used in the authentication request
- **Invalid Client ID/Secret**: Make sure these are correctly copied from Google Cloud Console to Supabase secrets
- **Scope Issues**: Ensure you're requesting the same scopes in your code that you've configured in the OAuth consent screen
- **OAuth Consent Screen Not Published**: For production apps, ensure your OAuth consent screen is properly published

## Need Further Help?

If you continue to experience issues:
- Check the edge function logs for detailed error messages
- Verify network requests in your browser's developer tools
- Ensure your application is correctly passing the authentication code to the edge function
- Consider using Google OAuth Playground to test your OAuth flow independently
