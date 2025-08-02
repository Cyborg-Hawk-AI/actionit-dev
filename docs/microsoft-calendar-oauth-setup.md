
# Microsoft Calendar OAuth Configuration Guide

This document provides step-by-step instructions for configuring Microsoft Calendar OAuth integration with our application.

## Prerequisites

1. A Microsoft account with access to Azure Portal
2. Permission to register applications in Azure Active Directory
3. Admin permissions for your application

## Step 1: Register an Application in Azure Active Directory

1. Sign in to the [Azure Portal](https://portal.azure.com/)
2. Search for and select "Azure Active Directory"
3. In the left navigation menu, select "App registrations"
4. Click "New registration"
5. Enter a name for your application
6. For "Supported account types", choose "Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts (e.g., Skype, Xbox)"
7. Under "Redirect URI":
   - Select "Web" as the platform
   - Enter `https://meet-ai-insights-hub.lovable.app/auth/callback` as the redirect URI
8. Click "Register"

## Step 2: Configure Authentication

1. In your newly registered app, go to "Authentication" in the left menu
2. Under "Platform configurations", ensure your Web platform is configured:
   - Redirect URIs: 
     - `https://meet-ai-insights-hub.lovable.app/auth/callback`
     - `http://localhost:5173/auth/callback` (for local development)
   - Enable "Access tokens" and "ID tokens"
3. Under "Implicit grant and hybrid flows", check "ID tokens"
4. Click "Save"

## Step 3: Add API Permissions

1. In the left menu, select "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Choose "Delegated permissions"
5. Search for and select the following permissions:
   - `Calendars.Read` (Read user calendars)
   - `User.Read` (Sign in and read user profile)
   - `offline_access` (Maintain access to data you've given it access to)
6. Click "Add permissions"
7. If your app needs admin consent, click "Grant admin consent for [your directory]"

## Step 4: Create a Client Secret

1. In the left menu, select "Certificates & secrets"
2. Under "Client secrets", click "New client secret"
3. Add a description and select an expiration period
4. Click "Add"
5. **IMPORTANT**: Copy the value of the secret immediately. You won't be able to see it again.

## Step 5: Configure Your Application

1. From the Overview page of your registered app, note down:
   - Application (client) ID
   - Directory (tenant) ID (if applicable)

2. Add your Microsoft OAuth credentials as environment variables in your Supabase Edge Function:
   - Go to the Supabase Dashboard > Project Settings > Edge Functions
   - Add/update the following secrets:
     - `MICROSOFT_CLIENT_ID`: Your Application (client) ID
     - `MICROSOFT_CLIENT_SECRET`: The client secret you created

3. Ensure your redirect URI is correctly set in your edge function:
   - In `supabase/functions/calendar-auth/index.ts`, verify that `REDIRECT_URI` is set to:
     ```typescript
     const REDIRECT_URI = Deno.env.get("REDIRECT_URI") || "https://meet-ai-insights-hub.lovable.app/auth/callback";
     ```

## Step 6: Testing the Integration

1. Navigate to your application's calendar page
2. Click "Connect Microsoft Calendar"
3. You should be redirected to Microsoft's login and consent screen
4. After granting permission, you should be redirected back to your application
5. Check the Edge Function logs in Supabase to confirm the auth flow is working correctly

## Troubleshooting

- **Error: AADSTS50011**: Ensure the reply URL matches exactly what's configured in Azure AD.
- **Error: AADSTS7000218**: The request body must contain client_secret or client_assertion.
- **Error: AADSTS90002**: Tenant not found. Check your tenant ID.
- **Error: AADSTS700016**: The application hasn't been properly configured with the requested permissions.

## Security Considerations

- Rotate your client secrets regularly
- Only request the permissions your application actually needs
- Consider implementing additional security measures like PKCE for enhanced security
