
# Action.IT Bot Meeting Functionality

This document explains how the Action.IT bot integrates with your calendars, joins meetings, and respects your configuration settings.

## Overview

Action.IT provides an AI meeting assistant that can automatically join your scheduled meetings to record, transcribe, and generate insights. The system works by:

1. Connecting to your calendar provider (Google Calendar)
2. Creating a special Recall.ai calendar integration
3. Allowing the bot to join meetings based on your preferences
4. Recording meeting content and generating transcripts and insights

## Integration Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────┐
│                 │     │                  │     │               │
│  User Calendar  │────▶│  Action.IT App   │────▶│  Recall.ai    │
│  (Google)       │     │  Database        │     │  API          │
│                 │     │                  │     │               │
└─────────────────┘     └──────────────────┘     └───────────────┘
                               │                        │
                               │                        │
                               ▼                        ▼
                        ┌──────────────────┐    ┌───────────────┐
                        │                  │    │               │
                        │  Meeting         │◀───│  Bot Joins    │
                        │  Events          │    │  Meeting      │
                        │                  │    │               │
                        └──────────────────┘    └───────────────┘
```

## Calendar Connection Process

1. **Calendar Integration**: Users connect their Google Calendar account to Action.IT
2. **Recall.ai Setup**: Users create a Recall.ai calendar from the Settings page
3. **Calendar Sync**: Action.IT synchronizes meeting events from the connected calendars
4. **Bot Configuration**: Users configure their bot preferences through the app's UI

## Bot Joining Settings

The Action.IT bot provides two primary methods for joining meetings:

### 1. Auto-Join Setting

When enabled in the sidebar or settings, the bot automatically joins meetings scheduled in your selected calendars.

* **Global Setting**: Found in the collapsible sidebar under "Action.IT Bot"
* **Per-Calendar Setting**: Each connected calendar can have auto-join enabled/disabled
* **Per-Meeting Setting**: Individual meetings can override the global setting

### 2. Manual Join

Users can manually trigger the bot to join specific meetings via:

* The meeting detail modal's "Join with Bot" button
* The calendar day/week view controls

## How Join Modes Work

The bot supports two joining modes:

* **Audio Only**: The bot joins with audio recording capabilities only
* **Audio + Video**: The bot joins with both audio and video recording (default)

These modes can be selected:
1. In the meeting detail modal before joining
2. In the Settings page as a user preference

## Technical Implementation

### How Settings Are Stored and Accessed

1. **User Settings**: Stored in the `user_settings` table with fields:
   * `auto_join_enabled`: Global setting for auto-joining meetings
   * `auto_record_enabled`: Global setting for recording meetings
   * `default_bot_join_method`: Default join mode ('audio_only' or 'speaker_view')

2. **Calendar Settings**: Stored in the `user_calendars` table:
   * `auto_join`: Whether the bot auto-joins meetings from this calendar
   * `auto_record`: Whether the bot auto-records meetings from this calendar
   * `is_selected`: Whether this calendar is currently selected for display/sync

3. **Meeting Settings**: Stored in the `meetings` table:
   * `auto_join`: Whether this specific meeting should use the bot
   * `auto_record`: Whether this meeting should be recorded

### Data Flow When Toggling Settings

When a user toggles the "Auto-join meetings" setting in the sidebar:

1. The `useCalendarData` hook calls the `updateUserBotSettings` function
2. This updates the `user_settings` table in the database
3. Future calendar syncs will respect this setting when determining if the bot should join

### How The Bot Knows Which Meetings To Join

The system decides whether to join a meeting based on this hierarchy:

1. **Meeting-specific setting**: If `meetings.auto_join` is explicitly set
2. **Calendar setting**: If `user_calendars.auto_join` is enabled for the calendar
3. **Global setting**: If `user_settings.auto_join_enabled` is true
4. **Manual trigger**: If the user manually clicks "Join with Bot"

## Detailed Component Behavior

### RecallSettings Component

The `RecallSettings` component in the Settings page allows users to:
* Create a Recall.ai calendar connection
* View the connection status
* Access troubleshooting information

### CollapsibleSidebar Component

The collapsible sidebar allows users to quickly toggle:
* Which calendars are visible
* Whether auto-join is enabled
* Whether auto-record is enabled

### EventDetailModal Component

When viewing meeting details, users can:
* See if the bot is scheduled or has joined
* Select a join method (Audio Only or Audio + Video)
* Manually trigger the bot to join the meeting

### useCalendarData and useRecallData Hooks

These hooks manage:
* Calendar data synchronization
* Meeting event management
* Bot joining and recording operations
* User preference storage and retrieval

## Troubleshooting

If the bot isn't joining meetings as expected:

1. Check that your Recall.ai integration is properly set up in Settings
2. Verify that the calendar containing the meeting is selected
3. Confirm that auto-join is enabled at the appropriate level (global, calendar, or meeting)
4. Make sure the meeting URL is valid and accessible
5. Check the debug logs in the Settings page

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Bot not joining | Verify Recall.ai configuration in Settings |
| Missing transcripts | Check that recording is enabled for the meeting |
| Calendar events not showing | Try refreshing calendar data in Calendar page |
| Join button not working | Ensure meeting URL is valid and accessible |

For additional support, please refer to the [Recall.ai Integration Setup](recall-ai-integration-setup.md) documentation.
