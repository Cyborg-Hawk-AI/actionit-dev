
# Google Calendar OAuth Configuration Guide

This document provides step-by-step instructions for configuring Google Calendar OAuth integration with our application.

## Prerequisites

1. A Google Cloud account
2. Access to create OAuth credentials in Google Cloud Console
3. Admin permissions for your application

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click on "New Project"
4. Enter a name for your project and click "Create"
5. Wait for the project to be created and then select it from the dropdown

## Step 2: Enable the Google Calendar API

1. In your Google Cloud project, navigate to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on the Google Calendar API result
4. Click "Enable"

## Step 3: Create OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" if this is for general use (or "Internal" if only for your organization)
3. Click "Create"
4. Fill in the required fields:
   - App name: Your application name
   - User support email: Your support email
   - Developer contact information: Your email address
5. Click "Save and Continue"
6. Add the following scopes for full calendar management:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.calendarlist`
   - `https://www.googleapis.com/auth/calendar.settings.readonly`
   - `https://www.googleapis.com/auth/calendar.acls`
   - `https://www.googleapis.com/auth/calendar.freebusy`
   - `https://www.googleapis.com/auth/calendar.app.created`
   - `email`
   - `profile`
   - `openid`
7. Click "Save and Continue"
8. Add test users if you're in testing mode, then click "Save and Continue"
9. Review your settings and click "Back to Dashboard"

## Step 4: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name for your OAuth client
5. Add Authorized JavaScript origins:
   - `https://meet-ai-insights-hub.lovable.app`
   - `http://localhost:5173` (for local development)
6. Add Authorized redirect URIs:
   - `https://meet-ai-insights-hub.lovable.app/auth/callback`
   - `http://localhost:5173/auth/callback` (for local development)
7. Click "Create"
8. You will see a modal with your Client ID and Client Secret. Save these values securely.

## Step 5: Configure Your Application

1. Add your Google OAuth credentials as environment variables in your Supabase Edge Function:
   - Go to the Supabase Dashboard > Project Settings > Edge Functions
   - Add/update the following secrets:
     - `GOOGLE_CLIENT_ID`: Your OAuth client ID
     - `GOOGLE_CLIENT_SECRET`: Your OAuth client secret

2. Ensure your redirect URI is correctly set in your edge function:
   - In `supabase/functions/calendar-auth/index.ts`, verify that `REDIRECT_URI` is set to:
     ```typescript
     const REDIRECT_URI = Deno.env.get("REDIRECT_URI") || "https://meet-ai-insights-hub.lovable.app/auth/callback";
     ```

## Step 6: Testing the Integration

1. Navigate to your application's calendar page
2. Click "Connect Google Calendar"
3. You should be redirected to Google's consent screen
4. After granting permission, you should be redirected back to your application
5. Check the Edge Function logs in Supabase to confirm the auth flow is working correctly

## Required Scopes for Full Calendar Management

Your application now requests these scopes for complete calendar functionality:

- **calendar**: Primary scope for full calendar access
- **calendar.events**: Create, read, update, and delete calendar events
- **calendar.calendarlist**: Manage calendar subscriptions and lists
- **calendar.settings.readonly**: Access calendar settings
- **calendar.acls**: Manage sharing permissions on calendars
- **calendar.freebusy**: Access free/busy information for scheduling
- **calendar.app.created**: Manage calendars created by your application

## Troubleshooting

- **Error: redirect_uri_mismatch**: Ensure the redirect URI in your Google Cloud Console exactly matches the one used in your application.
- **Error: invalid_client**: Double-check your client ID and client secret.
- **Error: access_denied**: The user declined to give permission, or there's an issue with the scopes.
- **Error: insufficient_scope**: Your app may need additional scopes for certain operations.

## Security Considerations

- Never expose your Client Secret in client-side code
- Regularly review the permissions you're requesting
- Follow the principle of least privilege when requesting scopes
- Monitor API usage and implement proper rate limiting

## Scope Permissions Breakdown

With the updated scopes, your application can now:

1. **Full Calendar Access**: Read and write access to all calendars
2. **Event Management**: Create, update, delete, and manage calendar events
3. **Calendar Management**: Create new calendars, manage existing ones
4. **Sharing Control**: Manage who can access calendars and with what permissions
5. **Settings Access**: Read calendar settings and preferences
6. **Free/Busy**: Check availability for scheduling purposes
7. **App Integration**: Full integration as a calendar application
