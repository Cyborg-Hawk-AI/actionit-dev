Below is a developer-guide/technical plan for integrating Recall.ai (in **us-west-2** region) with Google SSO + Google Calendar V2, so that once a user signs up and connects their Google Calendar, your system keeps meetings synced and automatically schedules bots to join meetings.

---

## Assumptions & Setup

* Your Recall.ai region is **US West 2** so all Recall.ai API endpoints should use base URL:
  `https://us-west-2.recall.ai` ([Recall.ai][1])
* You have a Recall.ai API key (you provided: `8c0933578c0fbc870e520b43432b392aba8c3da9`). This key must be treated as secret and only used in your backend.
* You want Calendar V2 integration (because more control, webhooks, etc.).
* You have or will set up Google OAuth client credentials with required scopes.

---

## Key Features / Requirements

1. Users sign up (via SSO) → identity tied in your system.
2. Users connect their Google account (OAuth) so your app obtains `refresh_token` + appropriate access scopes.
3. Create a Recall.ai calendar resource representing the user’s Google Calendar.
4. Fetch calendar events (new, updated, deleted) via Recall.ai.
5. Listen to webhooks from Recall.ai about calendar updates so you know when to sync.
6. Schedule bots to join meetings according to your business logic (e.g. for all meetings, or only some meetings).
7. Handle cancellations / modifications of meetings (remove bot, update schedule).

---

## Required OAuth Scopes & Google Setup

* In Google Cloud Console:

  * Create OAuth 2.0 Client (Client ID + Client Secret).
  * Enable the Google Calendar API.
  * In consent screen, include the scopes:

    * `https://www.googleapis.com/auth/calendar.events.readonly` (or if you want write: `calendar.events`)
    * Possibly `openid`, `userinfo.email` to identify user.

* Redirect URI(s): your backend endpoint(s) to receive OAuth callbacks from Google.

* Ensure consent screen approved / trusted if deploying to many users.

---

## Step-by-Step Integration Flow (Calendar V2)

Here is how to build the integration, end-to-end. Use this as a blueprint for your code structure.

| Stage                                  | What to Do                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Endpoints / APIs                                                                                                                                                                                                                                            | Key Data to Store                                                                                                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Initial Setup**                   | - In Recall.ai dashboard, ensure you have created an API key (in **us-west-2**). <br> - In Recall.ai, set up OAuth provider configuration for Google Calendar: you’ll need client ID, client secret, scopes. ([Recall.ai][2])                                                                                                                                                                                                                                                            | —                                                                                                                                                                                                                                                           | Save: your Recall.ai API key; your Google OAuth client\_id & client\_secret; redirect URIs; allowed scopes.                                                           |
| **2. User Sign Up / SSO**              | The user signs up via SSO so you have a stable user identity (email, user\_id) in your system.                                                                                                                                                                                                                                                                                                                                                                                           | —                                                                                                                                                                                                                                                           | Map: user\_id, user\_email, and any metadata you need.                                                                                                                |
| **3. Google OAuth Authorization Flow** | - When user chooses “Connect Calendar,” redirect them to Google OAuth consent with required scopes. <br> - On callback, receive authorization `code`, exchange for tokens: at least `refresh_token`, `access_token`. <br> - Verify scopes granted, handle errors (e.g. `invalid_scope`) if user didn’t allow required permissions.                                                                                                                                                       | Google OAuth endpoints; your backend endpoints.                                                                                                                                                                                                             | Store securely: `refresh_token`, maybe `access_token` (short lived), user\_email from Google or data identifying the calendar. Also store which user this belongs to. |
| **4. Create Calendar in Recall.ai**    | Once you have the Google refresh\_token + OAuth client credentials, call the Recall.ai **Create Calendar** endpoint to register this calendar under that user: `<platform>` = `google_calendar`.                                                                                                                                                                                                                                                                                         | `POST https://us-west-2.recall.ai/api/v2/calendars/` with body including: `oauth_client_id`, `oauth_client_secret`, `oauth_refresh_token`, `platform` = `google_calendar`. ([Recall.ai][2])                                                                 | Store: `calendar_id` (Recall.ai’s id for that user’s calendar), status, any returned fields (like `platform_email` after sync), plus mapping to your `user_id`.       |
| **5. Webhook Setup / Handling**        | - Set up a webhook endpoint in your backend to receive Recall.ai Calendar V2 webhooks via Svix. <br> - The relevant webhooks are: <br>   • `calendar.update` (for when calendar gets disconnected or its status changes) <br>   • `calendar.sync_events` (when events on the calendar are created/updated/deleted) ([Recall.ai][3])                                                                                                                                                      | —                                                                                                                                                                                                                                                           | Know and store: event   calendar\_id, last\_updated\_ts from webhook; keep state so you know when to re-sync.                                                         |
| **6. Syncing Events**                  | - Upon receiving `calendar.sync_events`, issue call to Recall.ai to **List Calendar Events** with parameter `updated_at__gte` using the `last_updated_ts` in webhook. <br> - Filter for events relevant to your bot scheduling logic (e.g., skip if `is_deleted`, skip private events, etc.). <br> - Also use `Retrieve Calendar Event` endpoint if you want full details of a single event.                                                                                             | `GET https://us-west-2.recall.ai/api/v2/calendar-events/?calendar_id=<id>&updated_at__gte=<ts>` <br> `GET https://us-west-2.recall.ai/api/v2/calendar-events/{event_id}` ([Recall.ai][4])                                                                   | Store metadata: event\_id, start\_time, meeting\_url, attendees, etc., and whether you've already scheduled a bot for it.                                             |
| **7. Bot Scheduling**                  | Two approaches: <br> • **Recall-Managed Scheduling**: Use Recall.ai’s built-in scheduling endpoint to assign bots for events; let Recall handle deduplication, etc. <br> • **Self-Managed Scheduling**: You schedule bots via Recall.ai’s `Create Bot` (or `Schedule Bot For Calendar Event`) and manage relationships (which bots per event, avoiding duplicates, managing cancellations). <br> - When events are updated (time changed, cancelled), remove or update bots accordingly. | Recall.ai API endpoints for scheduling bots. In particular: `POST /api/v2/calendar-events/{event_id}/schedule_bot` (if available), or the generic Create Bot API, referencing the event’s meeting\_url & start\_time. (Check Recall.ai docs for exact path) | Keep mapping: event\_id ↔ bot\_id; store state so you can find and delete bots when needed.                                                                           |
| **8. Error Handling & Disconnection**  | - If Recall.ai calendar status becomes `disconnected` (via `calendar.update` webhook), or Google refresh\_token is revoked / invalid, mark the calendar as disconnected. <br> - Notify user (via UI / email) to reconnect. <br> - Clean up: unschedule bots for future events or disable.                                                                                                                                                                                                | Use `Retrieve Calendar` to check status; Recall.ai will send `calendar.update` webhook. ([Recall.ai][3])                                                                                                                                                    | Update stored status; track reconnection events.                                                                                                                      |
| **9. UI / Preferences in Your App**    | - Let user see list of upcoming meetings, whether a bot is scheduled. <br> - Let user set preferences: e.g. “skip private events,” “only record meetings with ≥ N attendees,” etc. <br> - Allow toggling per event override (e.g. disable bot for a particular meeting). <br> - Let user reconnect calendar if disconnected.                                                                                                                                                             | —                                                                                                                                                                                                                                                           | Store user preferences; reflect them in the logic that filters events before scheduling bots.                                                                         |

---

## Sample Data Flow / Pseudocode

Here’s pseudocode (Node.js / TypeScript) showing core parts:

```ts
// Constants
const RECALL_BASE = "https://us-west-2.recall.ai";
const RECALL_API_KEY = "8c0933578c0fbc870e520b43432b392aba8c3da9";

interface User {
  id: string;
  email: string;
  recallCalendarId?: string;
  googleRefreshToken?: string;
  status?: string; // connected / disconnected
  preferences: {
    skipPrivateEvents: boolean;
    minAttendees: number;
    // etc
  };
  // other mappings: event_id → bot_id etc
}

// 1. After OAuth callback from Google:
async function handleGoogleOAuthCallback(user: User, googleCode: string) {
  // exchange code with Google
  const { access_token, refresh_token, scope, expires_in } = await googleTokenExchange(googleCode);

  // Validate scopes include the calendar read (and/or write) you need.

  // Save refresh_token in DB
  user.googleRefreshToken = refresh_token;

  // Create calendar in Recall.ai
  const resp = await fetch(`${RECALL_BASE}/api/v2/calendars/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RECALL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      oauth_client_id: GOOGLE_CLIENT_ID,
      oauth_client_secret: GOOGLE_CLIENT_SECRET,
      oauth_refresh_token: refresh_token,
      platform: "google_calendar",
    }),
  });
  const cal = await resp.json();
  // expected: cal.id, cal.status etc
  user.recallCalendarId = cal.id;
  user.status = cal.status; // likely "connected"

  // Save in DB
}

// 2. Webhook receiver for Recall.ai (via Svix)
async function handleRecallWebhook(reqBody: any) {
  const { event, data } = reqBody;

  if (event === "calendar.sync_events") {
    const { calendar_id, last_updated_ts } = data;
    // find user by calendar_id
    const user = await findUserByRecallCalendarId(calendar_id);
    if (!user) { /* log warning */ return; }

    // List calendar events updated since last_updated_ts
    const eventsResp = await fetch(`${RECALL_BASE}/api/v2/calendar-events/?calendar_id=${calendar_id}&updated_at__gte=${last_updated_ts}`, {
      headers: {
        "Authorization": `Bearer ${RECALL_API_KEY}`
      }
    });
    const evData = await eventsResp.json();
    for (const event of evData.results) {
      // filter by preferences
      if (event.is_deleted) {
        // if we have a bot for this event, delete it
        await maybeDeleteBot(event);
      } else if (shouldScheduleBot(event, user.preferences)) {
        await maybeScheduleBot(event, user);
      }
    }
  }
  else if (event === "calendar.update") {
    const { calendar_id } = data;
    const user = await findUserByRecallCalendarId(calendar_id);
    if (!user) return;
    // fetch calendar status
    const calResp = await fetch(`${RECALL_BASE}/api/v2/calendars/${calendar_id}`, {
      headers: {
        "Authorization": `Bearer ${RECALL_API_KEY}`
      }
    });
    const calData = await calResp.json();
    user.status = calData.status;
    if (user.status !== "connected") {
      // unschedule bots for future events, notify user
      await unscheduleAllFutureBots(user);
    }
  }
}

// 3. Function to schedule bot if not already
async function maybeScheduleBot(event: any, user: User) {
  // check if we already have a bot for this event in DB
  if (await hasBotForEvent(user.id, event.id)) return;

  // get event.start_time, meeting_url etc
  if (!event.meeting_url) return; // or handle links differently

  const scheduleResp = await fetch(`${RECALL_BASE}/api/v2/calendar-events/${event.id}/schedule_bot`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RECALL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // optional config overrides, e.g. recording_config
    }),
  });
  const scheduleResult = await scheduleResp.json();
  // store mapping event.id ↔ scheduleResult.bot_id
}

// 4. Function to delete bot if needed
async function maybeDeleteBot(event: any) {
  if (!await hasBotForEvent(...)) return;
  await fetch(`${RECALL_BASE}/api/v2/calendar-events/${event.id}/schedule_bot`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${RECALL_API_KEY}`
    }
  });
  // remove mapping from DB
}
```

---

## Key Recall.ai Endpoints for V2 to Use

| Endpoint                                                                      | Method                                                                     | Purpose                                                                                                                     | Notes / Rate Limits |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `POST /api/v2/calendars/`                                                     | Create Calendar                                                            | Register a Google Calendar for a user (with refresh\_token + OAuth client creds) so Recall.ai can sync it. ([Recall.ai][2]) |                     |
| `GET /api/v2/calendars/{calendar_id}`                                         | Retrieve Calendar                                                          | Get status, metadata (platform\_email etc.) of a calendar                                                                   |                     |
| `PATCH /api/v2/calendars/{calendar_id}`                                       | Update Calendar                                                            | To update OAuth credentials (if client\_secret changed), or possibly to reconnect after revocation. ([Recall.ai][5])        |                     |
| `DELETE /api/v2/calendars/{calendar_id}`                                      | Delete Calendar                                                            | To remove / stop using Recall.ai calendar; all bots for future events are unscheduled. ([Recall.ai][5])                     |                     |
| `GET /api/v2/calendar-events/?calendar_id=...&updated_at__gte=...`            | List Calendar Events                                                       | To sync events (new/updated/deleted). Rate limit: 60 requests/min per workspace. ([Recall.ai][4])                           |                     |
| `GET /api/v2/calendar-events/{event_id}`                                      | Retrieve Calendar Event                                                    | To get full details of one event, if needed.                                                                                |                     |
| `POST /api/v2/calendar-events/{event_id}/schedule_bot`                        | Schedule Bot for that event                                                | If using self-managed scheduling. Alternatively, if you use Recall’s managed scheduling, this may be handled differently.   |                     |
| `DELETE /api/v2/calendar-events/{event_id}/schedule_bot`                      | Remove Bot from Calendar Event                                             | For cancellations or manual overrides.                                                                                      |                     |
| Webhooks via Svix: <br>   • `calendar.sync_events` <br>   • `calendar.update` | Serve these to know when to sync or handle disconnection. ([Recall.ai][3]) |                                                                                                                             |                     |

---

## Important Behavior, Limits, and Edge Cases

* **Data retention & event history**: Recall retains calendar events for up to 60 days in the past. Events older than that may be dropped. ([Recall.ai][6])
* **Sync window / how far into future events are available**: Usually you can see upcoming meetings in future; look at how far into future Recall populates events. (Calendar integration FAQ notes “how far into the future are calendar events synced” is \~4 weeks for some settings) ([Recall.ai][6])
* **Rate limits**: For example, `List Calendar Events` is limited to \~60 requests/min per workspace. Make sure your system batches or throttles accordingly. ([Recall.ai][4])
* **Recurring events**: For recurring events, grouping by `recurringEventId` (Google) / `seriesMasterId` (Outlook) helps keep consistency. These are present in the `raw` field of calendar event object. ([Recall.ai][5])
* **Platform email**: `platform_email` field in calendar may be null immediately after calendar creation — because sync is asynchronous. If you need this email (Google account email), you may get it from the Google OAuth info directly. ([Recall.ai][5])
* **Invalid scope / user didn’t grant correct permissions** → calendar connection will fail. Handle errors gracefully; prompt user to reconnect. ([Recall.ai][5])
* **Calendar disconnection**: Happens when refresh\_token revoked or user removes app. Recall sends `calendar.update` webhook. Also if you call Delete Calendar, calendar is removed and bots unscheduled. ([Recall.ai][3])

---

## Security & Best Practices

* **Keep Recall API Key secret**: Only in backend services. Do not send it to frontend.
* **Validate webhooks**: Verify signature from Svix (or whatever signing mechanism Recall.ai uses) so that malicious calls can’t trigger your event logic.
* **Store refresh tokens securely**, encrypted at rest.
* **Handle retries, idempotency**: Webhooks may be retried; event listing/pagination may return same events; ensure your logic is idempotent (don’t double-schedule bots).
* **Logging & alerting**: For failed bot scheduling, token revocations, webhooks delivery failures.

---

## Example Summary Workflow

Here’s the full flow in a user’s lifecycle:

1. User signs up (via SSO).
2. User clicks “Connect Google Calendar.”
3. Redirect → Google OAuth → user grants permissions. Callback returns code.
4. Backend exchanges code → gets refresh\_token etc.
5. Backend calls Recall.ai `POST /api/v2/calendars/` using API Key + OAuth client creds + refresh\_token. Saves `calendar_id`.
6. Recall.ai asynchronously syncs platform\_email etc.
7. Set up webhooks (Svix): you receive `calendar.update` (calendar connected) then possibly `calendar.sync_events` initial sync.
8. On `calendar.sync_events`, fetch events updated, filter by your logic → schedule bots.
9. Future changes (meeting cancelled / moved / user revokes access) trigger either `calendar.sync_events` or `calendar.update` so you adjust: delete bots for cancelled events, update bots for modified ones.
10. User can disconnect or your backend can call Delete Calendar if needed.

---

If you want, I can generate a **complete code template / sample repo** (backend + frontend) using your API key and us-west-2 region, with configuration stubs & environment variables, to get you started.

[1]: https://docs.recall.ai/docs/regions?utm_source=chatgpt.com "Regions"
[2]: https://docs.recall.ai/docs/calendar-v2-integration-guide?utm_source=chatgpt.com "Integration Guide"
[3]: https://docs.recall.ai/docs/calendar-v2-webhooks?utm_source=chatgpt.com "Calendar V2 Webhooks"
[4]: https://docs.recall.ai/reference/calendar_events_list?utm_source=chatgpt.com "List Calendar Events"
[5]: https://docs.recall.ai/docs/calendar-v2-faq?utm_source=chatgpt.com "Calendar V2 FAQ"
[6]: https://docs.recall.ai/docs/calendar-integration-faq?utm_source=chatgpt.com "Calendar Integration FAQ"
