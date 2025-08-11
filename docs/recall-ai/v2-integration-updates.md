# Recall.ai V2 Integration Updates

## Overview

This document summarizes the updates made to align the Action.IT application with Recall.ai's V2 API specification. All changes ensure compatibility with the latest Recall.ai API endpoints, webhook events, and configuration structures.

## ✅ Changes Implemented

### 1. Bot Creation Approach

**Before (V1):**
```typescript
// Direct bot creation
POST /api/v1/bot/
{
  "meeting_url": "...",
  "bot_name": "Action.IT",
  "recording_config": { ... },
  "webhooks": [ ... ]
}
```

**After (V2):**
```typescript
// Scheduled bot approach
POST /api/v2/calendar/{calendar_id}/schedule-bot/
{
  "meeting_url": "...",
  "join_at": "2025-05-20T14:58:00Z",
  "bot_name": "Action.IT",
  "bot_config": {
    "transcription_options": {"provider": "meeting_captions"},
    "recording_mode": "speaker_view"
  },
  "deduplication_key": "unique-id"
}
```

### 2. Webhook Event Names

**Before (V1):**
```typescript
events: [
  "bot.joining_call",
  "bot.in_waiting_room",
  "bot.in_call_not_recording",
  "bot.recording_permission_allowed",
  "bot.recording_permission_denied",
  "bot.in_call_recording",
  "bot.call_ended",
  "bot.done",
  "bot.fatal"
]
```

**After (V2):**
```typescript
events: [
  "bot_status_change",
  "recording_started",
  "recording_stopped",
  "transcript.done",
  "analysis_done"
]
```

### 3. Recording Configuration Structure

**Before (V1):**
```typescript
recording_config: {
  transcript: {
    provider: {
      meeting_captions: {}
    }
  },
  audio_mixed_raw: {},
  participant_events: {},
  meeting_metadata: {},
  start_recording_on: "participant_join"
}
```

**After (V2):**
```typescript
bot_config: {
  transcription_options: {"provider": "meeting_captions"},
  recording_mode: "speaker_view"
}
```

## 📋 New API Endpoints Added

### Calendar Management APIs

1. **List Calendar Users**
   - Endpoint: `GET /api/v2/calendar-user/`
   - Handler: `handleListCalendarUsers`

2. **List Calendar Meetings**
   - Endpoint: `GET /api/v1/calendar/meetings/`
   - Handler: `handleListCalendarMeetings`
   - Requires auth token via `x-recallcalendarauthtoken`

3. **Get Calendar Meeting**
   - Endpoint: `GET /api/v1/calendar/meetings/{id}/`
   - Handler: `handleGetCalendarMeeting`

4. **Update Calendar Meeting**
   - Endpoint: `PATCH /api/v1/calendar/meetings/{id}/`
   - Handler: `handleUpdateCalendarMeeting`

5. **Refresh Calendar Meetings**
   - Endpoint: `POST /api/v1/calendar/refresh-meetings/`
   - Handler: `handleRefreshCalendarMeetings`

6. **Disconnect Calendar**
   - Endpoint: `DELETE /api/v2/calendar/{calendar_id}/disconnect/`
   - Handler: `handleDisconnectCalendar`

7. **Delete Calendar User**
   - Endpoint: `DELETE /api/v2/calendar-user/{user_id}/`
   - Handler: `handleDeleteCalendarUser`

### Bot Management APIs

8. **List Bots**
   - Endpoint: `GET /api/v1/bot/`
   - Handler: `handleListBots`

9. **Get Bot**
   - Endpoint: `GET /api/v1/bot/{id}/`
   - Handler: `handleGetBot`

10. **Update Bot**
    - Endpoint: `PATCH /api/v1/bot/{id}/`
    - Handler: `handleUpdateBot`

11. **Delete Bot**
    - Endpoint: `DELETE /api/v1/bot/{id}/`
    - Handler: `handleDeleteBot`

12. **Remove Bot From Call**
    - Endpoint: `POST /api/v1/bot/{id}/remove/`
    - Handler: `handleRemoveBotFromCall`

### Recording Control APIs

13. **Pause Recording**
    - Endpoint: `POST /api/v1/bot/{id}/pause_recording/`
    - Handler: `handlePauseRecording`

14. **Resume Recording**
    - Endpoint: `POST /api/v1/bot/{id}/resume_recording/`
    - Handler: `handleResumeRecording`

15. **Update Recording Preferences**
    - Endpoint: `PATCH /api/v1/bot/{id}/recording_preferences/`
    - Handler: `handleUpdateRecordingPreferences`

16. **Delete Bot Media**
    - Endpoint: `DELETE /api/v1/bot/{id}/media/`
    - Handler: `handleDeleteBotMedia`

17. **Get Bot Output**
    - Endpoint: `GET /api/v1/bot/{id}/output/`
    - Handler: `handleGetBotOutput`

## 🔄 Updated Functions

### `handleJoinMeetingNow`
- **Changed from:** Direct bot creation (`/api/v1/bot/`)
- **Changed to:** Scheduled bot approach (`/api/v2/calendar/{calendar_id}/schedule-bot/`)
- **Added:** Calendar lookup and validation
- **Updated:** Webhook event names to V2 format
- **Updated:** Recording configuration structure

### `handleScheduleBot`
- **Updated:** Webhook event names to V2 format
- **Updated:** Recording configuration structure
- **Enhanced:** Error handling and response format

### Webhook Event Handlers
- **Updated:** Event names to match V2 specification
- **Added:** Proper handlers for `bot_status_change`, `recording_started`, `recording_stopped`, `transcript.done`, `analysis_done`
- **Removed:** Old V1 event handlers

## 🎯 Benefits of V2 Integration

### 1. **Improved Reliability**
- Scheduled bot approach provides better error handling
- Deduplication keys prevent duplicate bot creation
- Calendar-based scheduling ensures proper context

### 2. **Enhanced Features**
- Support for pause/resume recording
- Better bot management capabilities
- Comprehensive calendar integration
- Media output handling

### 3. **Simplified Configuration**
- Cleaner webhook event structure
- Standardized recording configuration
- Consistent API response formats

### 4. **Better Error Handling**
- Proper authentication token management
- Enhanced error messages and logging
- Graceful fallback mechanisms

## 🔧 Implementation Details

### Authentication Flow
1. **Calendar Operations:** Use `x-recallcalendarauthtoken` header
2. **Bot Operations:** Use `Authorization: Token` header
3. **Webhook Operations:** No authentication required (public endpoint)

### Error Handling
- All functions include comprehensive try-catch blocks
- Proper HTTP status codes returned
- Detailed error messages for debugging

### Database Integration
- Calendar operations validate against `recall_calendars` table
- Bot operations update `meeting_recordings` table
- Webhook events trigger transcript processing

## 🚀 Deployment Notes

### Environment Variables Required
```bash
RECALL_API_KEY=your_recall_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Function Deployment
```bash
# Deploy updated functions
supabase functions deploy recall-api
supabase functions deploy recall-webhook
```

### Testing
1. **Calendar Integration:** Test calendar creation and meeting listing
2. **Bot Scheduling:** Test immediate and scheduled bot creation
3. **Webhook Events:** Verify webhook event handling
4. **Recording Controls:** Test pause/resume functionality

## 📊 Migration Checklist

- [x] Update bot creation to use scheduled approach
- [x] Fix webhook event names to match V2 guide
- [x] Update recording configuration structure
- [x] Add missing calendar management APIs
- [x] Add bot management APIs
- [x] Add recording control APIs
- [x] Update webhook event handlers
- [x] Test all new endpoints
- [x] Deploy updated functions

## 🔮 Future Enhancements

### Potential Improvements
1. **Webhook Signature Validation:** Add signature verification for security
2. **Rate Limiting:** Implement API rate limiting protection
3. **Retry Logic:** Add automatic retry for failed API calls
4. **Caching:** Implement response caching for frequently accessed data
5. **Monitoring:** Add comprehensive logging and monitoring

### Missing Features (Optional)
1. **Chat Messages:** Send chat messages during meetings
2. **Recording Permission Requests:** Handle permission workflows
3. **Advanced Media Formats:** Support additional output formats
4. **Custom Webhook Events:** Add support for custom event types

## 📝 API Usage Examples

### Schedule a Bot
```typescript
const response = await fetch('/functions/v1/recall-api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'schedule-bot',
    userId: 'user-id',
    calendarId: 'calendar-id',
    meetingId: 'meeting-id',
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    joinAt: '2025-05-20T14:58:00Z',
    botName: 'Action.IT',
    deduplicationKey: 'unique-key'
  })
});
```

### Join Meeting Immediately
```typescript
const response = await fetch('/functions/v1/recall-api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'join-meeting-now',
    userId: 'user-id',
    meetingId: 'meeting-id',
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    meetingTitle: 'Team Standup',
    joinMode: 'speaker_view'
  })
});
```

### List Calendar Meetings
```typescript
const response = await fetch('/functions/v1/recall-api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'list-calendar-meetings',
    userId: 'user-id',
    calendarId: 'calendar-id'
  })
});
```

This V2 integration ensures full compatibility with Recall.ai's latest API specification while providing enhanced functionality and improved reliability for the Action.IT application. 