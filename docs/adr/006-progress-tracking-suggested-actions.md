# ADR-006: Progress Tracking on Suggested Actions

**Date:** 2025-01-08  
**Status:** Accepted  
**Authors:** Assistant  

## Context

The AI Weekly Review feature provides users with actionable tips to improve their fitness journey. However, there was no mechanism to track whether users actually follow through on these suggestions or monitor their progress. This lack of accountability and feedback loop limited the effectiveness of the coaching recommendations.

## Decision

We implemented a comprehensive progress tracking system for AI Weekly Review suggested actions with the following components:

### 1. Database Schema
- **Table:** `weekly_review_action_tracking`
- **Key Fields:**
  - `user_id`: Links to authenticated user
  - `review_week_start`: Monday of the review week (YYYY-MM-DD)
  - `actionable_tip`: The specific suggested action
  - `status`: Progress status (pending, in_progress, completed, skipped)
  - `progress_notes`: Optional user notes about their progress
  - `completion_date`: Timestamp when marked complete
- **Constraints:** One action per user per week (unique constraint)
- **Security:** Full RLS policies for user data isolation

### 2. Server Actions
- **File:** `src/app/_actions/weeklyReviewActionTracking.ts`
- **Functions:**
  - `upsertActionTracking()`: Create or update action tracking
  - `updateActionTracking()`: Update status and notes
  - `getCurrentWeekActionTracking()`: Get current week's tracking
  - `getActionTrackingHistory()`: Get last 4 weeks of history

### 3. Frontend Component
- **File:** `src/components/progress/ActionProgressTracker.tsx`
- **Features:**
  - Visual status tracking with color-coded badges
  - Four status states with intuitive icons
  - Progress notes functionality
  - Completion date tracking
  - Error handling and loading states

### 4. Integration
- Embedded directly into `AIWeeklyReviewCard.tsx`
- Positioned after the actionable tip for immediate engagement
- Automatic initialization when weekly review loads

## Implementation Details

### Status Flow
```
pending → in_progress → completed
    ↓         ↓
  skipped   skipped
```

### User Experience
- **Visual Feedback:** Color-coded status badges and icons
- **Interaction:** Grid of status buttons for easy updates
- **Notes:** Collapsible section for detailed progress tracking
- **Completion:** Automatic timestamp and celebration messaging

### Technical Considerations
- **Week Calculation:** Monday-based weeks for consistency
- **Data Persistence:** Automatic initialization on first load
- **Error Recovery:** Comprehensive error handling with retry options
- **Performance:** Efficient queries with proper indexing

## Consequences

### Positive
- **Accountability:** Users can track their commitment to suggested actions
- **Engagement:** Interactive elements increase user investment in recommendations
- **Data Collection:** Valuable insights into which types of actions users complete
- **Coaching Improvement:** Future AI recommendations can be informed by completion patterns
- **User Motivation:** Visual progress tracking encourages follow-through

### Neutral
- **Database Growth:** Additional table with moderate storage requirements
- **UI Complexity:** Slightly more complex weekly review interface

### Negative
- **Initial Setup:** New migration required for existing installations
- **Maintenance:** Additional server actions and component to maintain

## Alternatives Considered

1. **Simple Checkbox:** Too basic, no progress granularity
2. **External Integration:** Added complexity, user friction
3. **Manual Logging:** Relied on user memory, low adoption likely
4. **Weekly Survey:** Intrusive, disconnected from context

## Future Enhancements

1. **Historical Analytics:** Trends and patterns in action completion
2. **Smart Recommendations:** AI learns from completion patterns
3. **Reminders:** Notifications for pending actions
4. **Social Features:** Share progress with community
5. **Gamification:** Streaks, badges, and achievement systems

## Migration Notes

- New table creation via standard Supabase migration
- No breaking changes to existing functionality
- Automatic initialization for new users
- Graceful handling of missing data for existing users 