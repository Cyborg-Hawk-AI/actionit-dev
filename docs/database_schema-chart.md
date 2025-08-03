# Action.IT Database Schema Chart

This document provides a visual representation of the Action.IT database schema using entity relationship diagrams.

## Database Schema Overview

<lov-mermaid>
erDiagram
    user_profiles {
        uuid id PK
        text display_name
        text avatar_url
        text timezone
        timestamp created_at
        timestamp updated_at
    }
    
    calendar_connections {
        uuid id PK
        uuid user_id FK
        text provider
        text access_token
        text refresh_token
        timestamp token_expires_at
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }
    
    user_calendars {
        uuid id PK
        uuid user_id FK
        uuid calendar_connection_id FK
        text external_id
        text name
        text description
        text color
        boolean is_primary
        boolean is_selected
        boolean auto_join
        boolean auto_record
        text webhook_channel_id
        text webhook_resource_id
        timestamp webhook_expires_at
        timestamp created_at
        timestamp updated_at
    }
    
    meetings {
        uuid id PK
        uuid user_id FK
        uuid calendar_id FK
        text external_id
        text title
        text description
        text meeting_url
        text platform
        text calendar_external_id
        text calendar_name
        text calendar_color
        text google_event_id
        text location
        text recurrence_rule
        text timezone
        text meeting_type
        timestamp start_time
        timestamp end_time
        boolean auto_join
        boolean auto_record
        integer attendees_count
        timestamp created_at
        timestamp updated_at
    }
    
    event_attendees {
        uuid id PK
        uuid meeting_id FK
        text email
        text name
        text rsvp_status
        boolean is_organizer
        timestamp response_timestamp
        timestamp created_at
        timestamp updated_at
    }
    
    meeting_recordings {
        uuid id PK
        uuid user_id FK
        uuid meeting_id FK
        text bot_id
        text status
        text recording_url
        timestamp join_time
        timestamp leave_time
        timestamp created_at
        timestamp updated_at
    }
    
    transcripts {
        uuid id PK
        uuid user_id FK
        uuid meeting_id FK
        text bot_id
        text recall_transcript_id
        text meeting_title
        text transcript_text
        text meeting_summary
        text key_points_by_speaker
        text key_items_and_action_items
        text next_steps_and_follow_ups
        text considerations_and_open_issues
        text notes_for_next_meeting
        text tone_and_sentiment_analysis
        text intent_identification
        jsonb raw_transcript
        jsonb parsed_transcript
        jsonb actionit_summary
        jsonb open_ai_analysis
        jsonb speakers
        jsonb timestamps
        timestamp created_at
        timestamp updated_at
    }
    
    key_insights {
        uuid id PK
        uuid user_id FK
        uuid meeting_id FK
        text insight_summary
        jsonb action_items
        jsonb decisions
        timestamp created_at
        timestamp updated_at
    }
    
    user_settings {
        uuid id PK
        uuid user_id FK
        boolean auto_join_enabled
        boolean auto_record_enabled
        text bot_name
        timestamp created_at
        timestamp updated_at
    }
    
    recall_calendars {
        uuid id PK
        uuid user_id FK
        text recall_calendar_id
        text platform
        timestamp created_at
        timestamp updated_at
    }
    
    sync_status {
        uuid id PK
        uuid user_id FK
        text calendar_external_id
        text sync_type
        text status
        text error_message
        integer events_processed
        integer events_created
        integer events_updated
        integer events_deleted
        timestamp sync_started_at
        timestamp sync_completed_at
        jsonb metadata
    }
    
    email_waitlist {
        uuid id PK
        text email
        text given_name
        text family_name
        text tag
        timestamp submitted_at
    }

    %% Relationships
    user_profiles ||--o{ calendar_connections : "owns"
    user_profiles ||--o{ user_calendars : "has"
    user_profiles ||--o{ meetings : "organizes"
    user_profiles ||--o{ meeting_recordings : "records"
    user_profiles ||--o{ transcripts : "owns"
    user_profiles ||--o{ key_insights : "generates"
    user_profiles ||--|| user_settings : "has"
    user_profiles ||--o{ recall_calendars : "configures"
    user_profiles ||--o{ sync_status : "tracks"
    
    calendar_connections ||--o{ user_calendars : "provides"
    
    meetings ||--o{ event_attendees : "includes"
    meetings ||--o{ meeting_recordings : "recorded_as"
    meetings ||--o{ transcripts : "generates"
    meetings ||--o{ key_insights : "produces"
</lov-mermaid>

## Key Relationships

### User Management
- **user_profiles**: Core user information and preferences
- **user_settings**: User-specific configuration for recording and joining meetings

### Calendar Integration
- **calendar_connections**: OAuth tokens and connection details for external calendar providers
- **user_calendars**: Individual calendars within a user's connected accounts
- **sync_status**: Tracks synchronization operations between external calendars and the system

### Meeting Management
- **meetings**: Core meeting events imported from calendars
- **event_attendees**: Participants in each meeting
- **meeting_recordings**: Recording sessions managed by Recall.ai bots

### AI Processing
- **transcripts**: Complete transcription and AI analysis of meetings
- **key_insights**: Structured insights, action items, and decisions extracted from meetings

### Service Integration
- **recall_calendars**: Links user calendars to Recall.ai for automatic bot joining
- **email_waitlist**: Public waitlist for user registration

## Security Model

All tables implement Row-Level Security (RLS) policies ensuring users can only access their own data. The `email_waitlist` table is the only exception, allowing public inserts for waitlist signups.