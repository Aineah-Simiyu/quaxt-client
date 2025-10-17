# Sessions Management Feature

This document provides an overview of the Sessions management feature in the Quaxt Client application.

## Overview

The Sessions feature allows administrators, school administrators, and trainers to create, manage, and monitor training sessions. All users including students can view and join sessions, with students accessing sessions from their assigned cohorts.

## File Structure

```
quaxt-client/app/(dashboard)/sessions/
├── page.js          # Main sessions page component
└── README.md        # This documentation file
```

## Features

### 1. Role-Based Access Control

- **Admin & School Admin**: Full access to create, manage, and view all sessions
- **Trainers**: Can create and manage their own sessions  
- **Students**: Can view and join sessions from their assigned cohorts (Sessions tab available in navigation)

### 2. Session Management

#### Create New Session
- Session name and description
- Start and end date/time selection
- Cohort assignment (multiple cohorts supported)
- Meeting link integration
- Session type selection (Live, Pre-recorded, Hybrid)

#### Session Views
- **Table View**: Detailed tabular format with all session information
- **Grid View**: Card-based layout for better visual organization

#### Session Filters
- **Tabs**: Active, Upcoming, Previous sessions
- **Search**: Filter by session name or description
- **Cohort Filter**: Filter sessions by specific cohorts
- **Status Filter**: Filter by session status (Scheduled, Live, Completed, Cancelled)

### 3. Session Actions

#### For Trainers/Admins:
- **Start Session**: Begin a scheduled session
- **End Session**: Conclude an ongoing session
- **Edit Session**: Update session details, timing, and meeting links
- **Cancel Session**: Cancel a session with reason
- **Delete Session**: Permanently remove a session
- **Copy Meeting Link**: Quick clipboard copy of meeting URLs

#### For Students:
- **Join Session**: Access meeting links for live sessions
- **View Details**: See session information and schedules

### 4. Dashboard Statistics

The sessions page displays key metrics:
- Total Sessions count
- Active Sessions (currently live)
- Upcoming Sessions (next 7 days)
- Average Attendance Rate

## API Integration

The sessions feature integrates with the backend through `sessionService` which provides:

### Session CRUD Operations
- `createSession(sessionData)` - Create new session
- `updateSession(sessionId, data)` - Update session details
- `deleteSession(sessionId)` - Delete session
- `getSessionById(sessionId)` - Get specific session

### Session Status Management
- `startSession(sessionId)` - Start a session
- `endSession(sessionId)` - End a session
- `cancelSession(sessionId, reason)` - Cancel with reason

### Session Queries
- `getActiveSessions(userId)` - Get active sessions
- `getUpcomingSessions(userId)` - Get upcoming sessions
- `getPreviousSessions(userId)` - Get past sessions
- `getSessionsByTrainer(trainerId)` - Get trainer's sessions
- `getSessionsBySchool(schoolId)` - Get school's sessions

## Component Structure

### Main Components

#### SessionsPage
The main component that handles:
- State management for sessions, cohorts, and filters
- Role-based rendering and permissions
- Modal dialogs for session creation and management

#### Key State Variables
- `sessions` - Array of session objects
- `cohorts` - Available cohorts for assignment
- `activeTab` - Current view tab (active/upcoming/previous)
- `viewMode` - Display mode (table/grid)
- `searchTerm` - Search filter value
- `selectedCohort/Status` - Filter values

### Modal Dialogs

#### Create Session Modal
- Form inputs for session details
- Cohort multi-selection
- Date/time pickers
- Session type selector

#### Manage Session Modal
Tabbed interface with:
- **Details Tab**: Edit session information
- **Attendance Tab**: View session attendance (future feature)
- **Actions Tab**: Session control buttons (start, end, cancel, delete)

## Usage Examples

### Creating a Session

1. Click "Create Session" button
2. Fill in session name and description
3. Select start and end date/time
4. Choose cohorts to assign
5. Add meeting link (optional)
6. Select session type
7. Click "Create Session"

### Managing Sessions

1. Click on a session row (table view) or settings icon (grid view)
2. Use the tabbed modal to:
   - Edit details in the Details tab
   - View attendance in the Attendance tab
   - Control session state in the Actions tab

### Filtering Sessions

- Use the search bar to find sessions by name
- Select cohort filter to show sessions for specific cohorts
- Use status filter to show sessions by their current state
- Switch between Active/Upcoming/Previous tabs

## Styling and UI

The sessions page follows the application's design system:
- Clean, minimal design with slate color palette
- Consistent card-based layouts
- Responsive design for mobile and desktop
- Hover states and smooth transitions
- Role-appropriate action buttons and permissions

## Future Enhancements

Planned features for future releases:
- Session recordings upload and playback
- Real-time attendance tracking
- Session analytics and reports
- Recurring session templates
- Calendar integration
- Push notifications for upcoming sessions
- Breakout room management
- Session feedback and ratings

## Navigation

The Sessions feature is accessible through:
- Sidebar navigation (for all users - admins, school admins, trainers, and students)
- Direct URL: `/dashboard/sessions`
- Available to all authenticated users with role-appropriate functionality

## Permissions Summary

| Role | Create | Edit Own | Edit All | Delete | View All | Join |
|------|--------|----------|----------|--------|----------|------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| School Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Trainer | ✅ | ✅ | ❌ | ✅* | ❌ | ✅ |
| Student | ❌ | ❌ | ❌ | ❌ | ❌** | ✅ |

*Trainers can only delete their own sessions
**Students only see sessions from their assigned cohorts