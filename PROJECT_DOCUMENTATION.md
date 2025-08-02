
# Action.IT - AI Meeting Assistant Project Documentation

## Project Overview

Action.IT is an enterprise-ready, AI-powered meeting assistant that serves as a next-generation alternative to Otter.ai. The platform focuses on minimalist design, professional functionality, and actionable insights from meeting recordings and transcriptions.

## Design Philosophy & UX Strategy

### Core Design Principles

- **Apple-inspired minimalism**: Clean, modern, whitespace-rich layouts using neutral colors with strategic accent colors
- **Enterprise-grade confidence**: Secure, privacy-conscious, and transparent features by default
- **Gamified but professional**: Engagement mechanics that reward useful behavior without compromising professionalism
- **Universal accessibility**: Designed for executives, project managers, note-takers, and reviewers

### Color System & Visual Identity

#### Primary Color Palette
- **Background**: `#F9FAFB` (light gray)
- **Text Primary**: `#111827` (charcoal)
- **Text Secondary**: `#6B7280` (medium gray)
- **Accent**: `#2563EB` (blue)

#### Functional Color Coding
- **Calendar/Meeting**: Blue gradients (`from-blue-50/80 via-indigo-50/40 to-purple-50/30`)
- **Insights/Analytics**: Green gradients (`from-emerald-50/80 via-teal-50/40 to-cyan-50/30`)
- **Recent Activity**: Purple gradients (`from-purple-50/80 via-violet-50/40 to-fuchsia-50/30`)
- **Status/System**: Orange/Amber gradients (`from-amber-50/80 via-orange-50/40 to-red-50/30`)

#### Calendar View Color Coding
- **Day View**: Orange gradients (`from-orange-50/80 via-amber-50/40 to-yellow-50/30`)
- **Week View**: Green gradients (`from-emerald-50/80 via-teal-50/40 to-cyan-50/30`)
- **Month View**: Purple gradients (`from-purple-50/80 via-violet-50/40 to-fuchsia-50/30`)
- **Agenda View**: Blue gradients (`from-blue-50/80 via-indigo-50/40 to-purple-50/30`)

### Typography & Spacing

- **Grid System**: 8px spacing grid throughout the application
- **Typography Hierarchy**: 
  - H1: `text-3xl` (2xl)
  - H2: `text-xl` (xl)
  - Body: `text-base` (base)
  - Metadata: `text-sm` (sm)
- **Component Structure**: Card-based design with skeleton loaders, hover states, and micro-interactions

## Technical Architecture

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS with ShadCN/UI components
- **Build Tool**: Vite
- **Routing**: React Router
- **State Management**: React Query for server state, React Context for app state

### Backend Integration
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **File Storage**: Supabase Storage
- **Edge Functions**: Supabase Edge Functions

### External Integrations
- **Calendar**: Google Calendar API
- **Meeting Recording**: Recall.ai
- **AI Processing**: OpenAI GPT models
- **Meeting Platforms**: Google Meet, Microsoft Teams, Zoom

## Database Schema

### Core Tables

#### meetings
- Stores meeting metadata from calendar sync
- Links to calendar entries and recording sessions
- Tracks auto-join and auto-record preferences

#### transcripts
- Contains AI-processed meeting content
- Stores meeting summaries, action items, decisions
- Links to meeting_recordings for source audio/video

#### user_calendars
- Manages connected calendar accounts
- Tracks selection preferences and auto-join settings

#### meeting_recordings
- Tracks Recall.ai bot sessions
- Stores recording URLs and session status

#### key_insights
- Structured storage for AI-extracted insights
- Action items, decisions, and meeting summaries

## Component Architecture

### Page-Level Components
- **Dashboard**: Main overview with recent meetings, insights, and quick actions
- **Calendar**: Multi-view calendar with day/week/month/agenda options
- **Meetings**: Individual meeting detail views with transcripts and insights

### Shared Components
- **EventDetailModal**: Unified meeting detail popup
- **CollapsibleSidebar**: Calendar sidebar with date picker and calendar toggles
- **CalendarViews**: Specialized components for each calendar view type

### Design System Components
- All components built on ShadCN/UI foundation
- Consistent gradient backgrounds and color coding
- Responsive design with mobile-first approach

## Development Guidelines

### Code Style & Patterns
- **TypeScript**: Strict mode enabled, proper type definitions required
- **Component Structure**: Functional components with hooks
- **Naming Conventions**: 
  - Variables: `camelCase`
  - Components: `PascalCase`
  - Files: `PascalCase` for components, `camelCase` for utilities
- **Exports**: Named exports preferred over default exports

### File Organization
- **Small, focused files**: Components should be 50 lines or less when possible
- **Immediate component creation**: New components get their own files
- **No component mixing**: Never add new components to existing files
- **Consistent imports**: Absolute imports using `@/` prefix

### Error Handling & Debugging
- **No try/catch blocks** unless specifically required
- **Extensive console logging** for debugging flow
- **Error bubbling**: Allow errors to surface for debugging
- **Toast notifications**: User-facing error and success messages

### Data Fetching Patterns
- **React Query**: Object format for all useQuery hooks
- **Real-time updates**: Supabase realtime for live data
- **Optimistic updates**: UI updates before server confirmation where appropriate

## Meeting & Bot Integration

### Calendar Sync
- **Multi-calendar support**: Google Calendar with Microsoft Calendar planned
- **Selective sync**: Per-calendar enable/disable options
- **Auto-join logic**: Respects user preferences and meeting-specific settings

### Recall.ai Bot Management
- **Join modes**: Audio-only, speaker view, gallery view
- **Automatic scheduling**: Based on calendar sync and user preferences
- **Manual control**: Individual meeting override options

### AI Processing Pipeline
1. **Recording capture**: Recall.ai bot joins and records
2. **Transcription**: Real-time speech-to-text processing
3. **AI analysis**: OpenAI processing for insights and summaries
4. **Storage**: Structured data saved to database
5. **Notification**: User alerted when processing complete

## User Experience Features

### Dashboard Experience
- **Latest meeting summary**: Prominent display of most recent meeting insights
- **Upcoming meetings**: Next meetings with quick join options
- **Weekly insights**: Analytics showing meeting trends and metrics
- **Recent activity**: Past meetings with summary previews
- **System status**: Service health and upcoming features

### Calendar Experience
- **Multi-view support**: Day, week, month, and agenda views
- **Visual time blocks**: Clear hour separation with alternating backgrounds
- **Meeting details**: Click-to-view meeting information and summaries
- **Bot scheduling**: Per-meeting bot join controls
- **Real-time indicators**: Current time and live meeting status

### Meeting Detail Experience
- **Comprehensive information**: All meeting metadata in one view
- **Action buttons**: Join meeting, schedule bot, view full details
- **Summary display**: AI-generated meeting summaries and insights
- **Navigation**: Seamless flow to full meeting pages

## Security & Privacy

### Data Protection
- **Row Level Security**: Supabase RLS policies on all user data
- **User isolation**: All data scoped to authenticated users
- **API security**: Protected endpoints with proper authentication

### Meeting Privacy
- **Explicit consent**: Bot joining requires user action or configuration
- **Data retention**: Configurable retention periods for recordings and transcripts
- **Access controls**: Meeting-level permissions and sharing options

## Performance & Scalability

### Frontend Optimization
- **Code splitting**: Route-based lazy loading
- **Component optimization**: Memoization where appropriate
- **Asset optimization**: Image compression and lazy loading

### Backend Scaling
- **Edge functions**: Serverless processing for AI tasks
- **Database optimization**: Proper indexing and query optimization
- **Caching strategy**: Client-side caching with React Query

## Deployment & Environment

### Development Setup
- **Local development**: Vite dev server with hot reloading
- **Environment variables**: Supabase connection and API keys
- **Database migrations**: SQL-based schema management

### Production Deployment
- **Static hosting**: Optimized build for CDN deployment
- **Environment separation**: Development, staging, and production environments
- **Monitoring**: Error tracking and performance monitoring

## Future Roadmap

### Planned Features
- **Team collaboration**: Multi-user workspaces and sharing
- **Advanced AI**: Custom AI models and enhanced insights
- **Integration expansion**: Slack, Microsoft Teams, Notion
- **Mobile support**: React Native mobile applications

### Enhancement Areas
- **Real-time collaboration**: Live transcript editing and commenting
- **Advanced analytics**: Meeting productivity metrics and trends
- **Workflow automation**: Action item assignment and tracking
- **Enterprise features**: SSO, advanced security, and compliance

---

This documentation serves as the source of truth for all development, design, and product decisions for the Action.IT platform. All team members should reference this guide when working on the application to ensure consistency and adherence to established patterns.
