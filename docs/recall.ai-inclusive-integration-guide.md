# 📘 Recall.ai All-Inclusive Integration Guide

This document contains all API endpoints, webhook setup, calendar integration logic, bot controls, and best practices needed to fully integrate Recall.ai into a production-grade application.

---

## 🔑 Authentication

**API Key Header**:

```
Authorization: Token YOUR_API_KEY
```

---

## 📅 Google Calendar Integration

### 1. Create Recall Calendar

**POST /api/v2/calendar/**

```json
{
  "platform": "google_calendar",
  "client_id": "...",
  "client_secret": "...",
  "refresh_token": "..."
}
```

### 2. Fetch Calendar Events

**GET /api/v1/calendar/meetings/**

```
Header: x-recallcalendarauthtoken: {token from /auth-token/}
```

### 3. Generate Calendar Auth Token

**POST /api/v1/calendar/auth-token/**

```json
{
  "user_id": "user_123"
}
```

---

## 🤖 Bot Management

### 4. Schedule a Bot for Future Meeting

**POST /api/v2/calendar/{calendar\_id}/schedule-bot/**

```json
{
  "meeting_url": "https://meet.google.com/abc-xyz",
  "join_at": "2025-08-10T14:00:00Z",
  "bot_name": "Action.IT",
  "bot_config": {
    "transcription_options": {
      "provider": "meeting_captions"
    },
    "recording_mode": "speaker_view"
  },
  "deduplication_key": "unique-id"
}
```

### 5. Join Meeting Immediately

**POST /api/v2/calendar/{calendar\_id}/schedule-bot/**
(Same as above with current timestamp as `join_at`)

---

## 🎥 Start Recording

**POST /api/v1/bot/{bot\_id}/start\_recording/**

```json
{
  "recording_mode": "speaker_view",
  "transcription_options": {
    "provider": "meeting_captions"
  },
  "real_time_transcription": true
}
```

---

## 📄 Fetch Transcript

**GET /api/v1/bot/{bot\_id}/transcript/**

```
Headers:
Authorization: Token YOUR_API_KEY
Accept: application/json
```

---

## 🔔 Webhooks

**POST /api/v1/webhook/**

```json
{
  "url": "https://yourapp.com/recall-webhook",
  "event": "bot_status_change"
}
```

### Webhook Events:

* `bot_joined`
* `bot_left`
* `recording_started`
* `recording_stopped`
* `transcript_available`

Webhook Payloads contain:

```json
{
  "event": "recording_started",
  "bot_id": "...",
  "meeting_url": "...",
  "timestamp": "..."
}
```

---

## 📦 Supabase Integration Notes

* Store `recall_calendar_id`, `meeting_id`, `bot_id`, `transcript_text`, etc.
* Tables: `recall_calendars`, `meeting_recordings`, `transcripts`, `key_insights`

---

## ⚙️ Recommended Application Logic

* Auto-join: Poll calendar events, schedule all
* Manual join: Provide selection UI, schedule selectively
* Disable: Skip bot scheduling for specific meetings

---

## 🛡️ Security Practices

* Use `Token` header securely via env vars
* Use HTTPS endpoints and webhook targets
* Validate all external webhook calls (signature validation coming soon)

---

## ✅ Summary

With these APIs, you can:

* Create and link calendars
* Schedule bots
* Join meetings
* Start recording
* Get transcripts
* Receive webhook events

All while maintaining full control through your backend and Supabase integration.
