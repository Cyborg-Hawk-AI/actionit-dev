# Recall.ai Integration Setup Guide

This guide will help you set up Recall.ai integration to automatically join Google Meet meetings with AI bots.

## Prerequisites

1. **Recall.ai Account**: Sign up at [recall.ai](https://recall.ai) and get your API key
2. **Google OAuth**: Already configured (see `GOOGLE_OAUTH_SETUP.md`)
3. **AWS Setup**: Already configured (see `VERCEL_ROLE_BASED_SETUP.md`)

## Step 1: Get Recall.ai API Key

1. Go to [recall.ai](https://recall.ai) and sign up for an account
2. Navigate to your dashboard and find your API key
3. Copy the API key for use in environment variables

## Step 2: Configure Environment Variables

Add the following environment variables to your Vercel project:

```bash
# Recall.ai Configuration
RECALL_API_KEY=your_recall_api_key_here
RECALL_WEBHOOK_SECRET=your_webhook_secret_here
```

### Setting Environment Variables in Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variables:
   - `RECALL_API_KEY`: Your Recall.ai API key
   - `RECALL_WEBHOOK_SECRET`: A random secret for webhook verification

## Step 3: Configure Google OAuth for Recall.ai

The Google OAuth client needs to be configured to work with Recall.ai's calendar integration.

### Update Google OAuth Client:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add the following redirect URI:
   ```
   https://us-east-1.recall.ai/api/v1/calendar/google_oauth_callback/
   ```
5. Ensure the following scopes are enabled:
   - `https://www.googleapis.com/auth/calendar.events.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

## Step 4: Configure Recall.ai Webhooks

1. Go to your Recall.ai dashboard
2. Navigate to Webhooks settings
3. Add a new webhook with the following URL:
   ```
   https://actionit-dev.vercel.app/api/recall/webhook
   ```
4. Select the following events:
   - `calendar.update`
   - `calendar.sync_events`
5. Set the webhook secret (use the same value as `RECALL_WEBHOOK_SECRET`)

## Step 5: Test the Integration

1. Deploy your changes to Vercel
2. Go to your app and sign in with Google
3. Navigate to Settings
4. You should see the "Recall.ai Integration" section
5. Click "Connect Google Calendar" if not already connected
6. The integration should automatically:
   - Connect your Google Calendar to Recall.ai
   - Sync upcoming events
   - Schedule bots for Google Meet meetings

## How It Works

### 1. Calendar Connection
When a user connects their Google Calendar:
- The app exchanges Google OAuth tokens with Recall.ai
- Recall.ai creates a calendar connection
- The connection is stored in your database

### 2. Event Synchronization
- Recall.ai monitors the user's Google Calendar
- When events are created/updated, Recall.ai sends webhooks
- Your app processes these webhooks and schedules bots

### 3. Bot Scheduling
- The app detects Google Meet links in calendar events
- Bots are automatically scheduled to join 2 minutes before meeting start
- Bots record and transcribe the meetings

### 4. Meeting Detection
The app automatically detects Google Meet links in:
- Event `meeting_url` field
- Event `location` field  
- Event `description` field

## API Endpoints

The integration includes the following API endpoints:

- `POST /api/recall/calendar` - Connect user's calendar to Recall.ai
- `GET /api/recall/calendar` - List connected calendars
- `GET /api/recall/events` - List calendar events
- `POST /api/recall/bots` - Create a bot for a meeting
- `GET /api/recall/bots` - Get bot status
- `DELETE /api/recall/bots` - Delete a bot
- `POST /api/recall/webhook` - Handle Recall.ai webhooks

## Troubleshooting

### Common Issues:

1. **"RECALL_API_KEY environment variable is not set"**
   - Ensure you've added the `RECALL_API_KEY` environment variable in Vercel
   - Redeploy your application after adding the variable

2. **"Failed to connect to Recall.ai calendar"**
   - Check that your Recall.ai API key is valid
   - Ensure your Google OAuth client has the correct redirect URI
   - Verify that the required scopes are enabled

3. **"No upcoming meetings found"**
   - Ensure you have Google Meet meetings in your calendar
   - Check that the meetings have Google Meet links
   - Verify that the calendar sync is working

4. **Webhooks not working**
   - Ensure the webhook URL is correct and accessible
   - Check that the webhook secret matches your environment variable
   - Verify that the webhook events are properly configured

### Debugging:

1. Check Vercel function logs for API errors
2. Use the browser developer console to see client-side errors
3. Verify environment variables are set correctly
4. Test the API endpoints directly using curl or Postman

## Security Considerations

1. **API Key Security**: Never expose your Recall.ai API key in client-side code
2. **Webhook Security**: Use the webhook secret to verify incoming webhooks
3. **Token Storage**: Google OAuth tokens are encrypted and stored securely
4. **Rate Limiting**: Be aware of Recall.ai's rate limits (60 requests/min for some endpoints)

## Next Steps

After successful integration:

1. **Monitor Bot Performance**: Check the Recall.ai dashboard for bot status
2. **Customize Bot Settings**: Configure transcription and recording options
3. **Set User Preferences**: Allow users to configure which meetings to record
4. **Handle Edge Cases**: Implement logic for cancelled meetings, private events, etc.

## Support

- [Recall.ai Documentation](https://docs.recall.ai/)
- [Recall.ai API Reference](https://docs.recall.ai/reference)
- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
