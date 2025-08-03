# Action.IT Database Schema (SQL)

This document contains the complete database schema as it would appear in the Supabase SQL editor.

## Core Tables

### User Profiles Table
```sql
CREATE TABLE public.user_profiles (
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    timezone text DEFAULT 'UTC'::text,
    display_name text,
    avatar_url text,
    CONSTRAINT user_profiles_pkey PRIMARY KEY (id)
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
```

### Calendar Connections Table
```sql
CREATE TABLE public.calendar_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    provider text NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    CONSTRAINT calendar_connections_pkey PRIMARY KEY (id)
);

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
```

### User Calendars Table
```sql
CREATE TABLE public.user_calendars (
    is_primary boolean DEFAULT false NOT NULL,
    is_selected boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    auto_join boolean DEFAULT false,
    auto_record boolean DEFAULT false,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    webhook_expires_at timestamp with time zone,
    user_id uuid NOT NULL,
    calendar_connection_id uuid NOT NULL,
    external_id text NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#4285F4'::text NOT NULL,
    webhook_channel_id text,
    webhook_resource_id text,
    CONSTRAINT user_calendars_pkey PRIMARY KEY (id)
);

ALTER TABLE public.user_calendars ENABLE ROW LEVEL SECURITY;
```

### Meetings Table
```sql
CREATE TABLE public.meetings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    calendar_id uuid,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    auto_join boolean DEFAULT false,
    auto_record boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    attendees_count integer DEFAULT 1,
    external_id text NOT NULL,
    title text NOT NULL,
    description text,
    meeting_url text,
    platform text,
    calendar_external_id text,
    calendar_name text,
    calendar_color text DEFAULT '#4285F4'::text,
    google_event_id text,
    location text,
    recurrence_rule text,
    timezone text DEFAULT 'UTC'::text,
    meeting_type text DEFAULT 'manual'::text,
    CONSTRAINT meetings_pkey PRIMARY KEY (id)
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
```

### Event Attendees Table
```sql
CREATE TABLE public.event_attendees (
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid NOT NULL,
    is_organizer boolean DEFAULT false,
    response_timestamp timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    email text NOT NULL,
    name text,
    rsvp_status text DEFAULT 'pending'::text,
    CONSTRAINT event_attendees_pkey PRIMARY KEY (id)
);

ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
```

### Meeting Recordings Table
```sql
CREATE TABLE public.meeting_recordings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    meeting_id uuid NOT NULL,
    join_time timestamp with time zone,
    leave_time timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    bot_id text NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    recording_url text,
    CONSTRAINT meeting_recordings_pkey PRIMARY KEY (id)
);

ALTER TABLE public.meeting_recordings ENABLE ROW LEVEL SECURITY;
```

### Transcripts Table
```sql
CREATE TABLE public.transcripts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    meeting_id uuid NOT NULL,
    speakers jsonb,
    timestamps jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    raw_transcript jsonb,
    parsed_transcript jsonb,
    actionit_summary jsonb,
    open_ai_analysis jsonb,
    bot_id text NOT NULL,
    transcript_text text,
    recall_transcript_id text,
    meeting_title text,
    meeting_summary text,
    key_points_by_speaker text,
    key_items_and_action_items text,
    next_steps_and_follow_ups text,
    considerations_and_open_issues text,
    notes_for_next_meeting text,
    tone_and_sentiment_analysis text,
    intent_identification text,
    CONSTRAINT transcripts_pkey PRIMARY KEY (id)
);

ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
```

### Key Insights Table
```sql
CREATE TABLE public.key_insights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    meeting_id uuid NOT NULL,
    action_items jsonb DEFAULT '[]'::jsonb,
    decisions jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    insight_summary text,
    CONSTRAINT key_insights_pkey PRIMARY KEY (id)
);

ALTER TABLE public.key_insights ENABLE ROW LEVEL SECURITY;
```

### User Settings Table
```sql
CREATE TABLE public.user_settings (
    auto_record_enabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    auto_join_enabled boolean DEFAULT false,
    bot_name text DEFAULT 'Action.IT'::text,
    CONSTRAINT user_settings_pkey PRIMARY KEY (id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
```

### Recall Calendars Table
```sql
CREATE TABLE public.recall_calendars (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    recall_calendar_id text NOT NULL,
    platform text DEFAULT 'google_calendar'::text NOT NULL,
    CONSTRAINT recall_calendars_pkey PRIMARY KEY (id)
);

ALTER TABLE public.recall_calendars ENABLE ROW LEVEL SECURITY;
```

### Sync Status Table
```sql
CREATE TABLE public.sync_status (
    events_deleted integer DEFAULT 0,
    sync_started_at timestamp with time zone DEFAULT now() NOT NULL,
    sync_completed_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    events_processed integer DEFAULT 0,
    events_created integer DEFAULT 0,
    events_updated integer DEFAULT 0,
    calendar_external_id text NOT NULL,
    sync_type text NOT NULL,
    status text NOT NULL,
    error_message text,
    CONSTRAINT sync_status_pkey PRIMARY KEY (id)
);

ALTER TABLE public.sync_status ENABLE ROW LEVEL SECURITY;
```

### Email Waitlist Table
```sql
CREATE TABLE public.email_waitlist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    email text NOT NULL,
    given_name text,
    family_name text,
    tag text DEFAULT 'ActionIT Waitlist'::text NOT NULL,
    CONSTRAINT email_waitlist_pkey PRIMARY KEY (id)
);

ALTER TABLE public.email_waitlist ENABLE ROW LEVEL SECURITY;
```

## Database Functions

### Handle New User Function
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'email'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$function$
```

### Update Timestamp Function
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
```

### Trigger Key Insights Function
```sql
CREATE OR REPLACE FUNCTION public.trigger_key_insights()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only trigger if meeting_summary was actually added (not null)
  IF NEW.meeting_summary IS NOT NULL AND (OLD.meeting_summary IS NULL OR OLD.meeting_summary != NEW.meeting_summary) THEN
    -- Call the edge function asynchronously using pg_net
    PERFORM net.http_post(
      url := 'https://vfsnygvfgtqwjwrwnseg.supabase.co/functions/v1/generate-key-insights',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc255Z3ZmZ3Rxd2p3cnduc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NzEyMzcsImV4cCI6MjA2MjE0NzIzN30.tkYMaq3lvT-qXDqSNLdU2uSr-Puwhzcg-a6Sq10CBNU'
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'meeting_id', NEW.meeting_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$
```

## Row Level Security (RLS) Policies

All tables have RLS enabled with policies ensuring users can only access their own data:

- **User-scoped access**: Users can only view, insert, update, and delete their own records
- **Meeting-based access**: Event attendees can be managed by meeting owners
- **Public waitlist**: Email waitlist allows public inserts but restricts reads
- **Admin-only sync**: Sync status is read-only for users

## Indexes and Constraints

- Primary keys on all tables using UUID
- Timestamps with automatic updates via triggers
- JSON columns for flexible data storage (transcripts, insights, metadata)
- Boolean flags for user preferences and automation settings
- Text fields for external IDs and integration references