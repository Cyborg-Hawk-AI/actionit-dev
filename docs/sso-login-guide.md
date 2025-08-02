
# SSO Login Guide for Action.IT

This guide outlines how to test and use the Single Sign-On (SSO) functionality in the Action.IT platform, specifically focusing on Google SSO which is currently implemented.

## Testing SSO in the Lovable Browser

### Prerequisites

1. A Google account (preferably your work account if testing the enterprise functionality)
2. Access to the Action.IT application in the Lovable preview environment

### Steps to Test Google SSO Login

1. **Access the application**:
   - Navigate to the preview URL provided by Lovable (e.g., `https://preview--meet-ai-insights-hub.lovable.app`)
   - You should see the login page with options for email/password and SSO login

2. **Initiate Google SSO**:
   - Click on the "Continue with Google" button
   - A Google authentication popup will appear
   - Sign in with your Google account credentials
   - Grant the necessary permissions when prompted

3. **Verify successful authentication**:
   - After successful authentication, you should be redirected to the main application
   - Your profile information from Google (name, email, profile picture) should appear in the user interface
   - You should now have full access to the application features

4. **Test calendar connection** (if needed):
   - Navigate to the Calendar page
   - Click on "Connect Google Calendar"
   - Grant the necessary calendar permissions
   - Verify that your calendar events appear in the application

## Troubleshooting SSO Issues

### Common Problems and Solutions

1. **Popup Blockers**:
   - If the authentication popup doesn't appear, check if your browser is blocking popups
   - Allow popups for the Lovable domain

2. **Authentication Errors**:
   - If you receive an error during authentication, try clearing your browser cookies and cache
   - Ensure you're using a Google account that has not been restricted by your organization

3. **Redirect Errors**:
   - If you see "Invalid redirect URI" errors, this indicates a configuration issue
   - Contact the development team as the OAuth configuration may need to be updated

4. **Session Issues**:
   - If you're repeatedly asked to log in, there might be issues with session storage
   - Try using a different browser or disabling privacy extensions

## Implementation Notes for Developers

### Google SSO Configuration

The Google SSO integration uses OAuth 2.0 and is configured in the Supabase Authentication settings. The following scopes are requested:

- `profile`: To access the user's basic profile information
- `email`: To access the user's email address
- `https://www.googleapis.com/auth/calendar.readonly`: For read access to Google Calendar (when connecting calendar)
- `https://www.googleapis.com/auth/calendar.events.readonly`: For read access to calendar events

### Important Implementation Details

1. **Auth State Management**:
   - Auth state is managed by the `AuthContext` provider
   - Supabase's `onAuthStateChange` event listener tracks authentication changes
   - Session information is persisted in local storage

2. **Redirect Handling**:
   - After SSO authentication, users are redirected to `/auth/callback`
   - The AuthCallback component processes the authentication result
   - Upon successful login, users are redirected to the main application

3. **Security Considerations**:
   - JWT tokens are used to maintain session state
   - Access tokens are never exposed to the client-side code
   - All API calls are authenticated through Supabase RLS policies

## Adding Other SSO Providers

Currently, the application supports Google SSO. To add other providers like Microsoft, the following steps would be required:

1. Configure the provider in the Supabase Authentication settings
2. Implement the authentication flow in the AuthContext
3. Update the login UI to include the new provider
4. Implement token exchange and profile data handling

## Enterprise SSO Configuration

For enterprise customers who want to use their own SSO configuration:

1. Configure SAML or OAuth in the customer's identity provider
2. Set up the corresponding configuration in Supabase Authentication
3. Add domain validation to restrict sign-ups to specific domains
4. Configure custom claims if needed for role-based access control

---

For additional support or questions about SSO configuration, please contact the development team.
