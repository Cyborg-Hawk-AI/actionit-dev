# Google Calendar API Configuration Analysis for Action.IT

## Executive Summary

This document provides a comprehensive analysis of the Google Calendar API configuration requirements and implementation details for the Action.IT application. Based on the analysis of existing documentation and codebase, this guide covers all aspects needed to successfully configure and deploy Google Calendar integration.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Google Cloud Platform Setup](#google-cloud-platform-setup)
3. [OAuth Configuration](#oauth-configuration)
4. [Required Scopes and Permissions](#required-scopes-and-permissions)
5. [Environment Configuration](#environment-configuration)
6. [Database Schema Requirements](#database-schema-requirements)
7. [Edge Functions Implementation](#edge-functions-implementation)
8. [Frontend Integration](#frontend-integration)
9. [Testing and Troubleshooting](#testing-and-troubleshooting)
10. [Security Considerations](#security-considerations)

## Architecture Overview

The Action.IT application implements a sophisticated Google Calendar integration with the following components:

### Core Components
- **Frontend**: React application with calendar management interface
- **Backend**: Supabase Edge Functions for API operations
- **Database**: PostgreSQL tables for storing calendar connections and events
- **OAuth Flow**: Google OAuth 2.0 for secure authentication
- **Webhook System**: Real-time calendar updates via Google Calendar webhooks

### Data Flow
1. User initiates Google Calendar connection
2. OAuth flow redirects to Google consent screen
3. Authorization code exchanged for access/refresh tokens
4. Tokens stored securely in Supabase database
5. Calendar sync function fetches and stores events
6. Webhook notifications handle real-time updates

## Google Cloud Platform Setup

### Step 1: Create Google Cloud Project
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing project
3. Enable billing (required for API usage)

### Step 2: Enable Required APIs
Enable the following APIs in your Google Cloud project:
- **Google Calendar API** (primary)
- **Google People API** (for profile information)

### Step 3: Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" for general use or "Internal" for organization-only
3. Configure app information:
   - App name: "Action.IT"
   - User support email: Your support email
   - Developer contact information: Your email
4. Add required scopes (see [Required Scopes](#required-scopes-and-permissions))
5. Add test users if in testing mode
6. Publish app when ready for production

### Step 4: Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Create OAuth 2.0 Client ID
3. Configure as "Web application"
4. Add authorized JavaScript origins:
   ```
   https://meet-ai-insights-hub.lovable.app
   https://preview--meet-ai-insights-hub.lovable.app
   http://localhost:5173
   ```
5. Add authorized redirect URIs:
   ```
   https://meet-ai-insights-hub.lovable.app/auth/callback
   https://preview--meet-ai-insights-hub.lovable.app/auth/callback
   http://localhost:5173/auth/callback
   ```

## OAuth Configuration

### Required Environment Variables
Add these to your Supabase Edge Function secrets:

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### OAuth Flow Implementation
The application uses a two-step OAuth flow:

1. **Authorization Request**: User redirected to Google with required scopes
2. **Token Exchange**: Authorization code exchanged for access/refresh tokens

### Token Management
- **Access Token**: Short-lived (1 hour), used for API calls
- **Refresh Token**: Long-lived, used to obtain new access tokens
- **Token Storage**: Securely stored in `calendar_connections` table
- **Auto-refresh**: Automatic token refresh when expired

## Required Scopes and Permissions

### Full Calendar Management Scopes
```javascript
const scopes = [
  'https://www.googleapis.com/auth/calendar',           // Full calendar access
  'https://www.googleapis.com/auth/calendar.events',    // Event management
  'https://www.googleapis.com/auth/calendar.calendarlist', // Calendar list management
  'https://www.googleapis.com/auth/calendar.settings.readonly', // Settings access
  'https://www.googleapis.com/auth/calendar.acls',      // Sharing permissions
  'https://www.googleapis.com/auth/calendar.freebusy',  // Availability checking
  'https://www.googleapis.com/auth/calendar.app.created', // App-created calendars
  'email',                                              // User email
  'profile',                                            // User profile
  'openid'                                              // OpenID Connect
];
```

### Scope Permissions Breakdown
- **calendar**: Read/write access to all calendars
- **calendar.events**: Create, update, delete calendar events
- **calendar.calendarlist**: Manage calendar subscriptions
- **calendar.settings.readonly**: Access calendar settings
- **calendar.acls**: Manage sharing permissions
- **calendar.freebusy**: Check availability for scheduling
- **calendar.app.created**: Manage app-created calendars

## Environment Configuration

### Supabase Edge Function Secrets
Configure these secrets in your Supabase project:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Application URLs
Ensure these URLs are configured in both Google Cloud Console and Supabase:

**Production URLs:**
- `https://meet-ai-insights-hub.lovable.app`
- `https://preview--meet-ai-insights-hub.lovable.app`

**Development URLs:**
- `http://localhost:5173`

## Database Schema Requirements

### Required Tables

#### calendar_connections
```sql
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_calendars
```sql
CREATE TABLE user_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_connection_id UUID REFERENCES calendar_connections(id),
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#4285F4',
  is_primary BOOLEAN DEFAULT FALSE,
  is_selected BOOLEAN DEFAULT TRUE,
  auto_join BOOLEAN DEFAULT FALSE,
  auto_record BOOLEAN DEFAULT FALSE,
  webhook_channel_id TEXT,
  webhook_resource_id TEXT,
  webhook_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### meetings
```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_id UUID REFERENCES calendar_connections(id),
  external_id TEXT,
  google_event_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  meeting_url TEXT,
  platform TEXT,
  calendar_external_id TEXT,
  calendar_name TEXT,
  calendar_color TEXT,
  attendees_count INTEGER DEFAULT 1,
  auto_join BOOLEAN DEFAULT FALSE,
  auto_record BOOLEAN DEFAULT FALSE,
  meeting_type TEXT DEFAULT 'manual',
  recurrence_rule TEXT,
  timezone TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### event_attendees
```sql
CREATE TABLE event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  rsvp_status TEXT DEFAULT 'pending',
  is_organizer BOOLEAN DEFAULT FALSE,
  response_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Edge Functions Implementation

### calendar-auth Function
**Purpose**: Handles OAuth flow and token exchange

**Key Features:**
- Generates Google OAuth authorization URLs
- Exchanges authorization codes for tokens
- Stores tokens securely in database
- Handles token refresh automatically

**Required Actions:**
- `google-auth`: Generate authorization URL
- `google-token`: Exchange code for tokens

### calendar-sync Function
**Purpose**: Synchronizes calendar data from Google

**Key Features:**
- Fetches all user calendars
- Retrieves events from each calendar
- Handles token refresh automatically
- Stores calendar and event data

**Data Processing:**
- Extracts meeting URLs from various sources
- Identifies meeting platforms (Google Meet, Zoom, Teams)
- Processes attendee information
- Handles recurring events

### google-calendar-api Function
**Purpose**: Direct Google Calendar API operations

**Supported Actions:**
- `create_event`: Create new calendar events
- `update_event`: Update existing events
- `delete_event`: Delete events
- `setup_webhook`: Configure webhook notifications

**Features:**
- Automatic token refresh
- Conference data handling
- Attendee management
- Webhook setup

## Frontend Integration

### Calendar Service Implementation
The frontend uses `googleCalendarService.ts` for API interactions:

**Key Functions:**
- `createGoogleEvent()`: Create new events
- `updateGoogleEvent()`: Update existing events
- `deleteGoogleEvent()`: Delete events
- `setupWebhookNotifications()`: Configure webhooks
- `getEventAttendees()`: Retrieve attendee information

### OAuth Flow Integration
The application implements a seamless OAuth flow:

1. User clicks "Connect Google Calendar"
2. Frontend calls `calendar-auth` function
3. User redirected to Google consent screen
4. After authorization, redirected back to app
5. Token exchange happens automatically
6. Calendar sync initiated

### Calendar Management Features
- **Multi-calendar support**: Handle multiple Google calendars
- **Selective sync**: Enable/disable specific calendars
- **Auto-join settings**: Configure bot joining per calendar
- **Auto-record settings**: Configure recording per calendar
- **Meeting URL detection**: Automatic detection of meeting platforms

## Testing and Troubleshooting

### Common Issues and Solutions

#### 1. Redirect URI Mismatch
**Error**: `redirect_uri_mismatch`
**Solution**: Ensure exact match between Google Cloud Console and application URLs

#### 2. Invalid Client Credentials
**Error**: `invalid_client`
**Solution**: Verify client ID and secret in Supabase secrets

#### 3. Token Expiration
**Error**: `access_denied` or 401 responses
**Solution**: Implement automatic token refresh

#### 4. Scope Issues
**Error**: `insufficient_scope`
**Solution**: Ensure all required scopes are requested

### Testing Checklist
- [ ] OAuth flow completes successfully
- [ ] Tokens are stored in database
- [ ] Calendar sync retrieves events
- [ ] Meeting URLs are detected correctly
- [ ] Webhook notifications work
- [ ] Token refresh works automatically
- [ ] Error handling works properly

### Debugging Tools
- **Browser Console**: Check for JavaScript errors
- **Supabase Logs**: Monitor edge function execution
- **Google Cloud Console**: Check API usage and errors
- **Network Tab**: Monitor API requests and responses

## Security Considerations

### Token Security
- **Secure Storage**: Tokens stored encrypted in database
- **Access Control**: Row-level security on all tables
- **Token Rotation**: Automatic refresh token handling
- **Scope Minimization**: Request only necessary permissions

### Data Protection
- **Encryption**: All data encrypted in transit and at rest
- **User Isolation**: Data scoped to authenticated users
- **Audit Logging**: Track all API operations
- **Rate Limiting**: Implement API rate limiting

### Privacy Compliance
- **GDPR Compliance**: User data deletion capabilities
- **CCPA Compliance**: California privacy rights support
- **Data Retention**: Configurable retention periods
- **Consent Management**: Explicit user consent for data access

## Implementation Checklist

### Google Cloud Platform Setup
- [ ] Create Google Cloud project
- [ ] Enable Google Calendar API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth credentials
- [ ] Add authorized origins and redirect URIs

### Supabase Configuration
- [ ] Add Google OAuth secrets
- [ ] Configure authentication providers
- [ ] Set up database tables
- [ ] Configure row-level security policies

### Application Deployment
- [ ] Deploy edge functions
- [ ] Test OAuth flow
- [ ] Verify calendar sync
- [ ] Test webhook functionality
- [ ] Monitor error logs

### Production Readiness
- [ ] Enable production OAuth consent screen
- [ ] Configure production URLs
- [ ] Set up monitoring and alerting
- [ ] Implement error handling
- [ ] Test with real user data

## Conclusion

This comprehensive configuration guide covers all aspects of Google Calendar API integration for the Action.IT application. The implementation provides:

- **Secure OAuth authentication** with automatic token refresh
- **Comprehensive calendar management** with multi-calendar support
- **Real-time synchronization** via webhook notifications
- **Enterprise-grade security** with proper data protection
- **Scalable architecture** built on Supabase Edge Functions

Following this guide ensures a robust, secure, and feature-complete Google Calendar integration that meets enterprise requirements while providing an excellent user experience.

---

**Last Updated**: January 2024
**Version**: 1.0
**Status**: Production Ready 