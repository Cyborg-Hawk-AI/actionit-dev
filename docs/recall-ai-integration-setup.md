
# Setting Up Recall.ai Integration

This guide explains how to configure a Recall.ai account to work with the Action.IT meeting assistant and details how the complete workflow functions.

## Prerequisites

1. A Recall.ai account - Sign up at [https://recall.ai](https://recall.ai) if you don't have one yet
2. Access to the Recall.ai developer dashboard
3. Google or Microsoft Calendar connections set up in your Action.IT app

## Step 1: Obtain Recall.ai API Key

1. Log in to your Recall.ai developer dashboard
2. Navigate to the API Keys section
3. Create a new API key (or copy your existing one)
4. Make note of this key - you'll need it for the next step

## Step 2: Add Recall.ai API Key to Supabase Secrets

1. Go to your Supabase dashboard: [https://supabase.com/dashboard/project/vfsnygvfgtqwjwrwnseg/settings/functions](https://supabase.com/dashboard/project/vfsnygvfgtqwjwrwnseg/settings/functions)
2. Navigate to "Settings" -> "API"
3. Under "Project Secrets", add a new secret with the name `RECALL_API_KEY` and your key as the value
4. Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are also configured in your Supabase secrets
5. Save the changes

## Step 3: Connect Your Calendar to Recall.ai

Once you have added your Recall.ai API key to Supabase:

1. Login to your Action.IT application
2. Go to Settings -> Calendar Integration
3. Under the "Recall.ai Integration" section, click "Create Recall Calendar"
4. This will use your existing Google Calendar connection to create a Recall.ai calendar

## Complete System Architecture

### Overview

The Action.IT meeting assistant uses Recall.ai to join, record, and transcribe meetings. Here's how the complete system works:

1. **Calendar Integration**: Action.IT connects to your Google/Microsoft calendar
2. **Meeting Bot Deployment**: When you choose to join a meeting with a bot, Action.IT schedules the bot via Recall.ai
3. **Meeting Recording**: The bot joins the meeting and records audio/video
4. **Webhook Processing**: Recall.ai sends webhooks to our system when events occur (bot joins, leaves, recording finishes, transcript ready)
5. **Transcript Generation**: When a meeting ends, the system fetches and processes the transcript
6. **Insights Generation**: AI processes the transcript to extract key points, action items, and decisions

### Database Schema

The system uses several tables to track meetings and their recordings:

- `meetings`: Stores calendar meeting data
- `meeting_recordings`: Tracks bot recordings for each meeting
- `transcripts`: Stores raw and processed transcript data
- `key_insights`: Contains AI-generated insights from transcripts

### Webhook Flow

Recall.ai sends several webhook events that our system processes:

1. **Bot Status Change Events**:
   - `bot.status_change` with `call_ended`: The bot has left the meeting
   - `bot.status_change` with `done`: The bot has completed all tasks
   - `bot.status_change` with `fatal`: An error occurred

2. **Media Processing Events**:
   - `recording.done`: Recording has been processed
   - `recording.processing`: Recording is being processed
   - `transcript.processing`: Transcript is being generated
   - `transcript.done`: Transcript has been completed

3. **Analysis Events**:
   - `analysis_done`: AI analysis of meeting content has completed

## API Workflow and Call Reference

Below is a detailed breakdown of Recall.ai API calls made by Action.IT and when they occur:

### 1. Calendar Creation API Calls

**API Endpoint:** `POST https://us-west-2.recall.ai/api/v2/calendars/`

**Request Body:**
```json
{
  "platform": "google_calendar",
  "oauth_client_id": "YOUR_GOOGLE_CLIENT_ID",
  "oauth_client_secret": "YOUR_GOOGLE_CLIENT_SECRET",
  "oauth_refresh_token": "YOUR_REFRESH_TOKEN"
}
```

**Triggered by:**
- User clicking "Create Recall Calendar" in Settings
- User connecting a new calendar provider (Google/Microsoft)

**Function flow:**
1. `createRecallCalendarFromGoogleAuth()` in `useRecallData.ts` is called
2. Edge function `recall-api` is invoked with action "create-calendar-from-google-auth"
3. Edge function retrieves Google OAuth credentials from database
4. Edge function makes POST request to Recall API to create calendar
5. New calendar record is created in `recall_calendars` table

### 2. Bot Scheduling API Calls

**API Endpoint:** `POST https://us-west-2.recall.ai/api/v2/calendar/{calendar_id}/schedule-bot/`

**Request Body:**
```json
{
  "meeting_url": "https://meet.google.com/abc-defg-hij",
  "join_at": "2025-05-24T10:00:00Z",
  "bot_name": "Action.IT",
  "bot_config": {
    "transcription_options": { "provider": "meeting_captions" },
    "recording_mode": "speaker_view"
  },
  "deduplication_key": "meeting-123-2025-05-24"
}
```

**Triggered by:**
- User enabling auto-join for a meeting
- User clicking "Schedule Bot" for a specific meeting

**Function flow:**
1. `scheduleBotForMeeting()` in `useCalendarData.ts` is called
2. `scheduleMeetingBot()` in `useRecallData.ts` is called
3. Edge function `recall-api` is invoked with action "schedule-bot"
4. Edge function makes POST request to Recall API to schedule bot
5. New recording record is created in `meeting_recordings` table

### 3. Immediate Meeting Join API Calls

**API Endpoint:** `POST https://us-west-2.recall.ai/api/v1/bot/`

**Request Body:**
```json
{
  "meeting_url": "https://meet.google.com/abc-defg-hij",
  "bot_name": "Action.IT",
  "recording_config": {
    "transcript": { "enabled": true },
    "video_mixed_layout": "speaker_view",
    "start_recording_on": "call_join",
    "include_bot_in_recording": { "enabled": false }
  }
}
```

**Triggered by:**
- User clicking "Join with Bot" on a meeting
- Meeting auto-join feature activating for a starting meeting

**Function flow:**
1. `joinMeetingWithBot()` in `useCalendarData.ts` is called
2. `joinMeeting()` in `useRecallData.ts` is called
3. Edge function `recall-api` is invoked with action "join-meeting-now"
4. Edge function makes POST request to Recall API to join meeting immediately
5. New recording record is created (or existing one updated) in `meeting_recordings` table

### 4. Start Recording API Calls

**API Endpoint:** `POST https://us-west-2.recall.ai/api/v1/bot/{bot_id}/recording/`

**Request Body:**
```json
{
  "recording_mode": "speaker_view",
  "transcription_options": { "provider": "meeting_captions" },
  "real_time_transcription": true
}
```

**Triggered by:**
- Bot successfully joining a meeting
- User manually starting recording for a joined bot

**Function flow:**
1. `startMeetingRecording()` in `useRecallData.ts` is called
2. Edge function `recall-api` is invoked with action "start-recording"
3. Edge function makes POST request to Recall API to start recording
4. Meeting recording record is updated with status "recording"

### 5. Get Transcript API Calls

**API Endpoint:** `GET https://us-west-2.recall.ai/api/v1/transcript/{transcript_id}/`

**Triggered by:**
- Receiving a `transcript.done` webhook event
- User viewing meeting details after recording completes
- System automatically checking for new transcripts

**Function flow:**
1. `handleTranscriptDone()` webhook handler is triggered
2. Function extracts transcript_id from webhook payload
3. Function makes GET request to Recall API to retrieve transcript
4. New transcript record is created or updated in `transcripts` table
5. System triggers insights generation through `generate-insights` function

## Webhook Processing Flow

When a meeting ends, our system processes several webhook events from Recall.ai:

1. **Bot Call Ended (`bot.call_ended`):**
   - Triggered when the bot leaves the meeting
   - Our webhook handler updates the recording status to "completed"
   - Initiates transcript analysis through the Recall API

2. **Transcript Done (`transcript.done`):**
   - Triggered when transcript generation is complete
   - Our webhook handler extracts the transcript_id from the payload
   - Fetches the transcript using the new API endpoint
   - Parses the transcript into a structured format
   - Stores both raw and parsed transcripts in the database

3. **Analysis Done (`analysis_done`):**
   - Similar to transcript.done, fetches and processes transcript
   - Additional analysis may be performed

4. **Recording Done (`recording.done`):**
   - Confirms recording is available
   - Updates recording status

After receiving the transcript, our `generate-insights` edge function:

1. Processes the transcript to extract key information
2. Identifies action items, decisions, and important points
3. Generates an executive summary of the meeting
4. Stores these insights in the `key_insights` table

## Recent Execution Analysis

Based on the edge function logs, we have received the following webhooks in our most recent meeting:

1. **Bot Status Changes:**
   - `bot.call_ended` with sub_code `timeout_exceeded_everyone_left`
   - `bot.done` indicating successful completion

2. **Recording Processing:**
   - `recording.processing` indicating the recording was being processed
   - `recording.done` indicating recording processing was complete

3. **Transcript Processing:**
   - `transcript.processing` indicating the transcript was being generated
   - `transcript.done` indicating transcript generation was complete

These events were handled by our `recall-webhook` function, which:
1. Updated the recording status in the database
2. Fetched the transcript when `transcript.done` was received
3. Parsed and stored the transcript data
4. Triggered the `generate-insights` function to extract key information

## Troubleshooting

If you see the error "Failed to create Recall calendar" or "Failed to join meeting with bot":

1. Verify that your Recall.ai API key is set correctly in Supabase
2. Check that your Google Client ID and Secret are set correctly in Supabase
3. Ensure you've completed the Google calendar connection process first
4. Check the Supabase logs for any errors related to the Recall.ai API
5. Verify the URL and authentication used in the API calls match the Recall.ai documentation
6. Check your network tab for specific API call responses

### Common Error: HTML Response Instead of JSON

**Symptom**: Edge function logs show that the API call is returning HTML instead of JSON

**Resolution**:
- The API URL might be incorrect or the endpoint format has changed
- Ensure the correct API base URL is being used: `https://us-west-2.recall.ai`
- Check if the API requires additional authentication headers
- Verify the format of the request body matches the latest API documentation
- Try using the latest direct API endpoint: `POST https://us-west-2.recall.ai/api/v1/bot/`

### Common Error: No Bot Joins the Meeting

**Symptom**: The bot status shows as "joining" but no bot appears in the meeting

**Resolution**:
- Verify the meeting URL format is correct (https://meet.google.com/xyz-abcd-efg)
- Check if the Recall.ai service supports the meeting platform you're using
- Verify that the meeting is active and ready to accept participants
- Check the Recall.ai dashboard to see if the bot appears there
- Use a different browser or incognito mode to test if there's a cookie/session issue

### Common Error: Transcript Not Generated

**Symptom**: Meeting completed but no transcript was generated

**Resolution**:
- Check Recall.ai webhook logs to confirm `transcript.done` event was received
- Verify your webhook endpoint is properly configured in the Recall.ai dashboard
- Check that the `transcript` option was enabled when the bot was scheduled
- Look for errors in the edge function logs related to transcript fetching
- Make sure the API endpoints for fetching transcripts are up to date
- Verify that the `transcript_id` is being correctly extracted from the webhook payload

## How Recall.ai Works with Action.IT

Recall.ai provides the technology that allows our AI assistant to:

1. Join virtual meetings on your behalf
2. Record and transcribe meeting content
3. Generate summaries and action items
4. Extract key insights from discussions

For more information, visit [https://recall.ai/documentation](https://recall.ai/documentation)
