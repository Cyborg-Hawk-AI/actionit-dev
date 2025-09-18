Here’s a detailed *developer guide* (assuming a Vite-based frontend + backend setup) for integrating Recall.ai’s Google Calendar / Calendar V1 or V2 functionality so that bots can automatically join meetings on users’ Google Calendars. Since you already have read/write permissions on the user’s Google Calendar, I’ll highlight where that matters, but most of this is about Recall.ai API surface, flows, endpoints, and what your app needs to do.

---

## Overview

You want your app to:

* Allow users to sign up via SSO (so you know the user identity).
* Let users connect their Google Calendar (via OAuth) so your app + Recall.ai can see their events.
* Based on their calendar events, schedule bots (via Recall.ai) to join meetings automatically.
* Handle updates: new events, cancelled events, preference changes.
* Possibly support either Calendar V1 or V2 (depending on how much control/customization you need).

---

## Key Concepts

* **Calendar Integration**: A layer in Recall.ai that watches a user’s calendar and automatically schedules bots for the user’s meetings (if they meet certain criteria).

  * V1: simpler, more opinionated, less flexible configuration.
  * V2: more modular, more control, webhooks, more fine-grained user-level bot configuration. ([Recall.ai][1])

* **Calendar Auth Token**: Recall’s token that represents the user’s connection state. Used in headers to fetch events, etc. It has \~1 day expiry and is stateless. ([Recall.ai][2])

* **OAuth with Google**: You need to set up Google OAuth client credentials, request correct scopes. Especially for Google Calendar integration, you need `calendar.events.readonly` (or more if you want read/write) and `userinfo.email`. ([Recall.ai][3])

* **Webhooks (in V2)**: To get push-style updates when calendar events change, or when calendar is disconnected, etc. Helps you maintain sync without polling. ([Recall.ai][4])

* **Bot scheduling**: Recall.ai bots (either scheduled via calendar integration or via explicit bot API) will join meetings at a certain time (e.g. 2 minutes before event start for V1) unless you customize. ([Recall.ai][2])

---

## What to Decide Before Implementation

1. **Choose between Calendar V1 vs V2**

   * If you need more control, event filtering logic, custom bot settings, event webhooks → go for V2.
   * If you’re okay with more out-of-the-box behavior, fewer customization points → V1 may be faster. ([Recall.ai][1])

2. **What level of calendar access you need**

   * If you only want to *read* events & schedule bots, `calendar.events.readonly` is likely enough.
   * If you want to create or modify calendar events (e.g. inserting meetings, updating metadata), you’ll need write permissions. Note that some of Recall’s flows assume read access. Check that your app can support the write scopes if required.

3. **User preferences & filtering logic**

   * Decide criteria for which meetings get bots: all meetings, only certain calendar(s), only meetings with specific metadata, etc.
   * Provide UI for user preferences (e.g. “record only meetings with more than N attendees”, or “skip meetings marked private”, etc.).

4. **Token lifecycle & refresh flow**

   * For Google OAuth, refresh tokens are needed; you’ll need to handle revoked/expired tokens.
   * In V2, if your client is in testing mode, tokens expire after 7 days unless published. In production, they persist unless revoked. ([Recall.ai][5])

5. **Security**

   * Don’t expose Recall API Key in frontend; use your backend/proxy for any calls that need it.
   * Secure your OAuth redirect URIs; verify domain ownership if publishing to production. ([Recall.ai][5])

---

## Step-By-Step Implementation Guide

Here’s a suggested flow and what endpoints & logic to build, using V2 (you can adapt for V1 if you choose that).

---

### Backend + Frontend Setup

* Frontend (Vite): UI for users to connect their calendar, display upcoming meetings, preferences settings.

* Backend:

  * Proxy endpoints for sensitive operations (token generation, fetching/syncing events, handling webhooks, scheduling/removing bots).
  * Store users' mapping: your user IDs ↔ Recall’s calendar user / calendar IDs.
  * Store user preferences for which meetings to schedule, etc.

---

### Google OAuth Setup

* In Google Cloud Console:

  1. Create a Google OAuth 2.0 client (client\_id + client\_secret). ([Recall.ai][3])
  2. Enable Google Calendar API in that project. ([Recall.ai][3])
  3. Set up Consent Screen with at least scopes: `calendar.events.readonly` & `userinfo.email`. If you need write access, include those corresponding scopes. ([Recall.ai][3])
  4. Add redirect URIs; one needed is the Recall callback URL for Google Calendar: `https://us-east-1.recall.ai/api/v1/calendar/google_oauth_callback/` (for V1) or whatever the equivalent in V2. ([Recall.ai][3])

* In your app backend:

  * Endpoint to begin the OAuth flow (redirect user to Google’s consent screen), passing necessary `state` that includes at least: your `recall_calendar_auth_token`, `redirect_uri`, optional success/error URLs. ([Recall.ai][3])
  * Endpoint to receive OAuth callback. On callback, exchange `code` for tokens, store refresh\_token etc. Possibly via Recall.ai if using their built-in endpoints.

---

### Recall.ai Integration: V2 Flow (Recommended)

1. **Create a Calendar record** (`Create Calendar`)

   * POST to `https://us-east-1.recall.ai/api/v2/calendars/` to register that calendar for a user after OAuth is complete. ([Recall.ai][6])
   * This returns a calendar\_id, etc., which you'll persist (e.g. tied to your user).

2. **List Calendars**

   * GET `https://us-east-1.recall.ai/api/v2/calendars/` to retrieve all connected calendars for workspace / user. Useful to show in UI. ([Recall.ai][7])

3. **List Events (Calendar Events)**

   * GET `https://us-east-1.recall.ai/api/v2/calendar-events/` to fetch upcoming events. Use appropriate query params for filtering (e.g. by calendar\_id, “updated\_at\_\_gte” for incremental sync) etc. ([Recall.ai][8])

4. **Webhooks**

   * Configure Svix (Recall.ai uses Svix for webhook delivery) to receive events:

     * `calendar.update` – when calendar is disconnected or its status changes. ([Recall.ai][4])
     * `calendar.sync_events` – when calendar events change, so you can re-fetch events. Payload includes `calendar_id` and `last_updated_ts`. ([Recall.ai][4])

   * Your backend should have an endpoint to receive these and act: e.g. re-sync events, remove scheduled bots for cancelled events, schedule bots for new events, etc.

5. **Bot Scheduling / Create Bot**

   * Either rely on Recall‘s calendar integration scheduling (if V2, you may get configuration to schedule bots) or use the Create Bot endpoint explicitly.
   * Bots should join meetings at the appropriate time (V1 defaults to 2 minutes before event start; V2 gives more control) unless your app overrides. ([Recall.ai][2])

6. **User Preferences / Recording Options**

   * Build UI & store preferences (which events to record, bot configuration, etc.).
   * Use Recall API to update recording preferences or bot configurations. In V1 there are endpoints / flows for “update recording preferences”. ([Recall.ai][2])

---

### Recall.ai Integration: V1 Flow (if you choose V1)

* V1 is simpler. The pattern is similar, but fewer endpoints and less flexibility. Key endpoints include:

  1. **Get Calendar Auth Token**: to generate `recallcalendarauthtoken` for user. ([Recall.ai][2])
  2. **Initiate calendar connection** via OAuth with Google (similar to above for V1), redirect user. ([Recall.ai][2])
  3. **List Calendar Meetings / Events**: Using the auth token header (`x-recallcalendarauthtoken`) to fetch user events. ([Recall.ai][2])
  4. **Update recording preferences**: UI + API to change which kinds of calendar events should have bots. ([Recall.ai][2])
  5. **Bot configuration**: mostly from preset configuration. You reach out to Recall.ai if you want to tweak bot configuration for Calendar V1 bots. ([Recall.ai][2])

* V1 also has limitations:

  * Less control over individual bot settings.
  * Bots join 2 minutes before start time. ([Recall.ai][2])
  * No webhooks in V1 (so you’ll need more polling).
  * If the user changes preferences, scheduled bots for future events are removed automatically for events no longer matching preferences. ([Recall.ai][9])

---

## What Your App Should Implement

Here’s a checklist of pieces your app will need to build:

| Component                                  | Purpose                                                                                                                                    | Implementation Notes                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| **User identity / SSO**                    | So you know the user and can map them to the calendar user / Recall calendar user.                                                         | After SSO signup, ensure you have a stable `user_id`, email, etc.              |
| **Backend endpoints**                      | To proxy sensitive operations (OAuth token exchanges, Recall API key usage) so that your front end never leaks secrets.                    | E.g. route for generating calendar auth token, OAuth callback, etc.            |
| **OAuth flow UI / Frontend**               | Button / screen for user to connect their Google Calendar; show success/failure; show status.                                              | Vite frontend page, redirect to Google, etc.                                   |
| **Persisting tokens and mapping**          | Store refresh\_tokens or whatever Recall needs, mapping of your user ↔ Recall calendar.                                                    | Secure storage; refresh token renewal; handle revoked tokens.                  |
| **Fetching events**                        | Poll or use webhooks (for V2) to keep events up to date.                                                                                   | For V1, likely polling; for V2, implement webhook receiver.                    |
| **Bot scheduling logic**                   | Decide for each event whether a bot should be scheduled. For V2 you might do it yourself; for V1 you rely more on Recall’s built-in logic. | Take into account event properties: attendees, organizer, private status, etc. |
| **Handling event updates / cancellations** | When events are cancelled or changed, remove bots or adjust bot scheduling.                                                                | Use webhooks or event update endpoints.                                        |
| **UI for upcoming meetings**               | Show the user upcoming events that will have bots, and allow override/disabling per event.                                                 | Frontend component; fetch list of events; allow toggling flags.                |
| **User recording preferences**             | Let user set what kinds of events are recorded.                                                                                            | Persist in your DB; send updates to Recall via their endpoints.                |
| **Error / token revocation handling**      | If Google’s refresh token is revoked, or Recall indicates calendar disconnected, handle it gracefully: notify user; ask to reconnect.      | Webhook `calendar.update` in V2 or from other signals.                         |
| **Testing & production readiness**         | Google OAuth verification, redirect URIs, test accounts; handling rate limits; domain ownership.                                           | Ensure OAuth client is published; verify domains; monitor rate limits.         |

---

## Sample Flow Code / Pseudocode

Here’s how things might happen in a user signup via SSO → calendar connect → bot scheduling, assuming V2.

```js
// After user signs up/env: you have user.id, email

// 1. Frontend: user clicks “Connect Google Calendar”
//    Backend generates a temporary calendar auth token from Recall.ai
POST /api/recall/calendar/auth-token
  → call Recall endpoint if using V1
  → save mapping: your user.id ↔ temp_token

// 2. Frontend redirect to Google OAuth consent
Redirect user to
  https://accounts.google.com/o/oauth2/v2/auth?
    scope=calendar.events.readonly userinfo.email …
    client_id=GOOGLE_CLIENT_ID
    redirect_uri=YOUR_BACKEND_CALLBACK
    state=JSON.stringify({
        recall_calendar_auth_token: <temp_token>,
        google_oauth_redirect_url: <redirect_uri>,
        success_url: <your_app_success_page>,
        error_url: <your_app_error_page>
    })

// 3. Backend: Google OAuth callback
- Read `state`, verify temp_token
- Exchange `code` → access_token + refresh_token
- Send these (or relevant info) to Recall.ai via their "Connect calendar" API (for V2: Create Calendar) so Recall.ai can store & monitor the calendar
- Store in your database: calendar_id, status, refresh_token, etc.

// 4. Webhook setup
- Your backend subscribes to Recall.ai’s webhook events for calendar.sync_events and calendar.update
- On `calendar.sync_events`: fetch events via Recall.ai `List Calendar Events` (with filter `updated_at__gte` using last_updated_ts from webhook), then for new events matching your logic, schedule bots via Recall’s Create Bot API (or via calendar integration auto-bot scheduling if V2 supports)
- On cancelled/deleted events or preference change: remove scheduled bots / stop future bots

// 5. User preferences UI
- Let user set things like: skip meetings marked private; skip meetings with <2 attendees; only meetings in certain calendars; custom bot settings per event
- On preference update, reconcile: look at upcoming scheduled bots and remove those which no longer meet criteria, optionally schedule bots for newly eligible events

// 6. Monitoring & error handling
- Monitor rates (Recall’s endpoints have rate limits: eg. 60 requests/min for list events etc.) :contentReference[oaicite:27]{index=27}
- Handle token expiry: if Google refresh token fails, mark calendar disconnected; prompt user to reconnect
- Handle Recall.ai calendar updates indicating disconnection. :contentReference[oaicite:28]{index=28}
```

---

## Key Recall.ai API / Endpoints You’ll Use

Here are the endpoints (mostly V2) and parameters you’ll need.

| Endpoint                                                            | HTTP Method                   | Purpose                                                                                                                                                           | Important Req’d Headers / Params / Responses                                                                                                          |
| ------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v2/calendars/`                                           | Create Calendar               | Register a calendar for a user after OAuth                                                                                                                        | Needs `Authorization` (your Recall API Key or workspace token), and info about the OAuth tokens. Returns `calendar_id`, status, etc. ([Recall.ai][6]) |
| `GET /api/v2/calendars/`                                            | List Calendars                | To see which calendars the user has connected                                                                                                                     | Pagination, possibly filter by user, etc. ([Recall.ai][7])                                                                                            |
| `GET /api/v2/calendar-events/`                                      | List Calendar Events          | To fetch upcoming / all events; use query params like `updated_at__gte` to do incremental sync; possibly filter by calendar\_id or time windows. ([Recall.ai][8]) |                                                                                                                                                       |
| Webhooks:                                                           | —                             |                                                                                                                                                                   |                                                                                                                                                       |
| — `calendar.update`                                                 | Recall → Your backend         | Calendar status changes (e.g. disconnected) → you may need to alert user, etc. ([Recall.ai][4])                                                                   |                                                                                                                                                       |
| — `calendar.sync_events`                                            | Recall → Your backend         | When events in calendar change → triggers your update logic; includes `calendar_id` and `last_updated_ts`. ([Recall.ai][4])                                       |                                                                                                                                                       |
| (for V1) `Get Calendar Auth Token`                                  | probably a Recall.ai endpoint | To get the `recallcalendarauthtoken` that you’ll use for V1 flows. ([Recall.ai][2])                                                                               |                                                                                                                                                       |
| (for V1) `List Calendar Meetings` / “List Calendar Events” under V1 | GET                           | To fetch events under V1, using auth token in header `x-recallcalendarauthtoken`. ([Recall.ai][2])                                                                |                                                                                                                                                       |
| Recording Preferences / Update Bot Config                           | PUT / PATCH                   | To update what kinds of events should be recorded, which bot config you want (if supported). Applies mostly in V2, and limited in V1. ([Recall.ai][2])            |                                                                                                                                                       |

---

## Edge Cases & Notes

* **Events with no display names / missing attendee info**: Google sometimes won’t populate `displayName` for attendees, especially organizers, etc. Don’t rely on it always being present. ([Recall.ai][5])
* **Token expiry / invalid grant**: If your Google OAuth client is in “testing” mode, tokens expire in 7 days. Once in production, tokens persist unless explicitly revoked. ([Recall.ai][5])
* **Rate limits**: Recall.ai limits some endpoints (e.g. listing calendar events) to 60 requests/min per workspace. ([Recall.ai][8])
* **Calendar disconnection**: Could be from user revoking permissions, changing password, removing your app. Ensure you cover that path and clear out local state / prompt reconnect. Webhooks help here. ([Recall.ai][4])
* **Bot deduplication**: Don’t schedule multiple bots for same event accidentally (especially if calendar reconnect, repeated sync, etc.). Maintain idempotency — use event IDs, your stored state to detect duplicates.
* **Meeting link types**: Some meetings might have non-Google Meet links; ensure bot can handle joining links across platforms if your use case spans them.

---

## Putting It All Together: High-Level Architecture

Here’s a suggested component layout:

```
Front End (Vite)                Backend API (Your servers)
---------------                 --------------------------
- SSO login/signup              - Persist user identity
- “Connect Calendar” UI        - Generate temp token / state
- Show upcoming meetings        - Callback endpoint for Google OAuth
- Preferences UI                - Store OAuth tokens, calendar_id
                                - Recall.ai API wrappers
                                - Webhook receiver
                                - Bot scheduling logic (based on events + preferences)
                                - Error handling, token refresh
                                - Notifications to user (if disconnected etc.)
```

You might also have a scheduler/cron job or message queue to handle event syncs in case webhooks are delayed or dropped, or for fallback.

---

## Example: What Happens When a New Meeting is Created

1. User connects calendar via OAuth → Recall.ai registers calendar (in V2) and returns `calendar_id`.

2. Recall.ai sends a `calendar.sync_events` webhook with `last_updated_ts`.

3. Your backend receives the webhook, fetches events via `GET /api/v2/calendar-events/?calendar_id=<id>&updated_at__gte=<ts>`.

4. Among the returned events, find the new meeting(s) that match user’s preferences.

5. For each such meeting, schedule a bot:

   * Either use Recall.ai’s auto-bot scheduling via calendar integration (if behavior in V2 supports that you configure)
   * Or explicitly call Recall.ai Meeting Bot API to create a bot with `join_at` set to just before meeting start.

6. Save details of the scheduled bot in your DB (bot\_id, meeting\_id, event\_id, etc.) for tracking.

7. If event gets cancelled or modified later (detected via another webhook or sync), remove that scheduled bot or modify accordingly.

---

If you like, I can put together a **ready-to-use template repository structure / example code** in TypeScript/Node + Vite showing this flow. Do you want that?

[1]: https://docs.recall.ai/docs/calendar-integration?utm_source=chatgpt.com "Choosing an integration: Calendar V1 vs V2"
[2]: https://docs.recall.ai/docs/calendar-v1-integration-guide?utm_source=chatgpt.com "Integration Guide"
[3]: https://docs.recall.ai/docs/calendar-v1-google-calendar?utm_source=chatgpt.com "Google Calendar"
[4]: https://docs.recall.ai/docs/calendar-v2-webhooks?utm_source=chatgpt.com "Calendar V2 Webhooks"
[5]: https://docs.recall.ai/docs/calendar-v2-google-calendar?utm_source=chatgpt.com "Google Calendar"
[6]: https://docs.recall.ai/v1.10/reference/calendars_create?utm_source=chatgpt.com "Create Calendar"
[7]: https://docs.recall.ai/reference/calendars_list?utm_source=chatgpt.com "List Calendars"
[8]: https://docs.recall.ai/reference/calendar_events_list?utm_source=chatgpt.com "List Calendar Events"
[9]: https://docs.recall.ai/docs/calendar-v1-faq?utm_source=chatgpt.com "Calendar V1 FAQ"
