# Recall.ai All-Inclusive Integration Guide (V2)

## Overview

This guide details the complete process to integrate Recall.ai with your application for Google Meet, Zoom, and Teams. It includes API endpoints, bot management, webhook setup, recording controls, and best practices for storing and interacting with Recall data in Supabase.

---

## Authentication

Use the API key in the `Authorization` header:

```http
Authorization: Token YOUR_API_KEY
```

For calendar API calls, use the `x-recallcalendarauthtoken` header after generating a token:

```http
x-recallcalendarauthtoken: abc123...
```

---

## Calendar Integration (Google Calendar)

### 1. Generate Calendar Auth Token

```http
POST /api/v1/calendar/auth-token/
```

**Request:**

```json
{
  "user_id": "user_123"
}
```

### 2. Redirect for Google OAuth

Use Google's OAuth 2.0 endpoint with scope:

```
https://www.googleapis.com/auth/calendar.events.readonly
```

Redirect URI:

```
https://us-east-1.recall.ai/api/v1/calendar/google_oauth_callback/
```

### 3. Create Calendar in Recall

```http
POST /api/v2/calendar/
```

**Body:**

```json
{
  "platform": "google_calendar",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "refresh_token": "GOOGLE_REFRESH_TOKEN"
}
```

### 4. List Calendar Users

```http
GET /api/v2/calendar-user/
```

### 5. List Calendar Meetings

```http
GET /api/v1/calendar/meetings/
Header: x-recallcalendarauthtoken: abc123...
```

### 6. Retrieve Specific Calendar Meeting

```http
GET /api/v1/calendar/meetings/{id}/
```

### 7. Update Calendar Meeting

```http
PATCH /api/v1/calendar/meetings/{id}/
```

### 8. Refresh Calendar Meetings

```http
POST /api/v1/calendar/refresh-meetings/
```

### 9. Disconnect Calendar Platform

```http
DELETE /api/v2/calendar/{calendar_id}/disconnect/
```

### 10. Delete Calendar User

```http
DELETE /api/v2/calendar-user/{user_id}/
```

---

## Bot Lifecycle

### Create a Bot

```http
POST /api/v1/bot/
```

### List Bots

```http
GET /api/v1/bot/
```

### Retrieve Bot

```http
GET /api/v1/bot/{id}/
```

### Update Scheduled Bot

```http
PATCH /api/v1/bot/{id}/
```

### Delete Scheduled Bot

```http
DELETE /api/v1/bot/{id}/
```

### Remove Bot From Call

```http
POST /api/v1/bot/{id}/remove/
```

---

## Scheduling & Joining Meetings

### Schedule a Bot

```http
POST /api/v2/calendar/{calendar_id}/schedule-bot/
```

**Body:**

```json
{
  "meeting_url": "https://meet.google.com/abc-defg-hij",
  "join_at": "2025-05-20T14:58:00Z",
  "bot_name": "Action.IT",
  "bot_config": {
    "transcription_options": {"provider": "meeting_captions"},
    "recording_mode": "speaker_view"
  },
  "deduplication_key": "unique-id-meeting-20250520"
}
```

### Join Meeting Immediately

Handled by your edge function via `joinMeetingNow`, setting `join_at` to `new Date().toISOString()`.

---

## Recording Management

### Start Recording

```http
POST /api/v1/bot/{id}/start_recording/
```

### Stop Recording

```http
POST /api/v1/bot/{id}/stop_recording/
```

### Pause/Resume Recording

```http
POST /api/v1/bot/{id}/pause_recording/
POST /api/v1/bot/{id}/resume_recording/
```

### Update Recording Preferences

```http
PATCH /api/v1/bot/{id}/recording_preferences/
```

### Delete Bot Media

```http
DELETE /api/v1/bot/{id}/media/
```

---

## Transcripts & Media

### Retrieve Transcript

```http
GET /api/v1/bot/{id}/transcript/
```

### Output Media

```http
GET /api/v1/bot/{id}/output/
```

### Media Formats (options):

* `video_mixed_layout`: `speaker_view`, `gallery_view`, `gallery_view_v2`
* `audio_mixed_mp3`, `video_mixed_mp4`, `video_separate_mp4`

---

## Webhooks

### Register Webhook

```http
POST /api/v1/webhook/
```

**Events:**

* `bot_status_change`
* `recording_started`
* `recording_paused`
* `recording_resumed`
* `recording_stopped`

### Webhook Headers

Include `X-Recall-Signature` to validate payload integrity.

### Test Webhooks Locally

Use tunneling tools (e.g., ngrok) and inspect signed headers.

---

## Advanced Features

### Send Chat Message

```http
POST /api/v1/bot/{id}/send_chat_message/
```

### Request Recording Permission

```http
POST /api/v1/bot/{id}/request_recording_permission/
```

---

## Supabase Integration Points

### Used Tables (expected):

* `recall_calendars`
* `meeting_recordings`
* `transcripts`
* `key_insights`

### Edge Function Actions:

* `create-calendar`
* `schedule-bot`
* `get-transcript`
* `join-meeting-now`
* `start-recording`
* `process-insights`

---

## Best Practices

* Use `deduplication_key` to avoid duplicate scheduling.
* Schedule bots 2-5 minutes before meetings.
* Use Supabase to cache bot/transcript states.
* Handle webhook retries with idempotent handlers.
* Validate webhook signatures.
* Log all recording transitions and errors.
* Separate manual joins from scheduled joins in logic.

---

## Final Notes

This guide integrates all Recall.ai functionality. Use this as your blueprint for implementing robust recording, transcription, and calendar management with Recall.ai V2.
