
# Calendar Integration Documentation

This directory contains comprehensive guides for setting up and configuring calendar integrations with our application.

## Contents

- [Google Calendar OAuth Setup](./google-calendar-oauth-setup.md): Step-by-step guide for setting up OAuth with Google Calendar API
- [Microsoft Calendar OAuth Setup](./microsoft-calendar-oauth-setup.md): Step-by-step guide for setting up OAuth with Microsoft Calendar
- [Setting Up Supabase OAuth Secrets](./setting-up-supabase-oauth-secrets.md): Instructions for managing OAuth secrets in Supabase

## Quick Start

1. Obtain OAuth credentials from Google and/or Microsoft using their respective guides
2. Add the credentials as secrets in your Supabase project
3. Ensure your application's redirect URIs are properly configured in both OAuth providers
4. Test the integration through the application's calendar connection page

## Common Issues

- Ensure all redirect URIs exactly match between your OAuth providers and your application
- Verify that all required scopes are enabled in your OAuth configurations
- Check that your client IDs and secrets are correctly entered in Supabase
- Confirm that your edge functions have access to the secrets

## Support

If you encounter issues with the calendar integration setup, please:

1. Check the edge function logs in your Supabase dashboard
2. Review the troubleshooting sections in the respective OAuth setup guides
3. Contact support for additional assistance
