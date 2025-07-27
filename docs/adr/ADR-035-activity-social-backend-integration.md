# ADR-035: Activity Social Features Backend Integration

## Status
Accepted

## Context
The Activities Feed in the community section needed complete backend integration for social features (likes and comments). Previously, the UI components were implemented with mock data and placeholder functionality.

### Requirements
- **Database tables** for storing likes and comments on workout activities
- **Server actions** for CRUD operations on social data
- **Frontend integration** with real API calls
- **Real-time data** fetching and updates
- **Security** through proper RLS policies

## Decision
Implement a complete backend integration system with dedicated database tables, server actions, and frontend API integration.

### Database Design
```sql
-- Activity likes table
CREATE TABLE activity_likes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  activity_id TEXT NOT NULL, -- References FollowedUserActivity.id
  activity_type TEXT DEFAULT 'workout_session',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, activity_id) -- One like per user per activity
);

-- Activity comments table  
CREATE TABLE activity_comments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  activity_id TEXT NOT NULL, -- References FollowedUserActivity.id
  activity_type TEXT DEFAULT 'workout_session',
  content TEXT CHECK (length(content) > 0 AND length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Server Actions Architecture
```typescript
// Core social interaction functions
- toggleActivityLike(activityId, activityType)
- addActivityComment(activityId, content, activityType)
- getActivityComments(activityId)
- updateActivityComment(commentId, content)
- deleteActivityComment(commentId)
- getActivitiesSocialData(activityIds[])
```

### Frontend Integration
- **Real API calls** replace mock data
- **Optimistic updates** for better UX
- **Lazy loading** of comments when section opens
- **Error handling** with user feedback

## Implementation Details

### Security Features
- **RLS policies** ensure users can only modify their own likes/comments
- **Data validation** with Zod schemas
- **Authentication** required for all operations
- **Content limits** (500 characters for comments)

### Performance Optimizations
- **Batch queries** for social data across multiple activities
- **Indexed database queries** for fast lookups
- **Lazy loading** of comments to reduce initial load time
- **Optimistic UI updates** for immediate feedback

### Data Flow
1. **Activities Load** → `getFollowedUsersActivities()` fetches social counts
2. **Like Toggle** → `toggleActivityLike()` → UI updates immediately
3. **Comments Open** → `getActivityComments()` → Load existing comments
4. **New Comment** → `addActivityComment()` → Add to local state
5. **Real-time Updates** → Social counts refresh automatically

## Technical Components

### Database Migration
- **File**: `20250127200000_create_activity_social_tables.sql`
- **Tables**: `activity_likes`, `activity_comments`
- **Indexes**: Optimized for activity_id and user_id lookups
- **RLS**: Comprehensive security policies

### Server Actions
- **File**: `src/app/_actions/activitySocialActions.ts`
- **Functions**: 6 core social interaction functions
- **Validation**: Zod schemas for all inputs
- **Error handling**: Comprehensive error responses

### Frontend Integration
- **Component**: Enhanced `WorkoutActivityCard.tsx`
- **Real APIs**: All mock functionality replaced
- **State management**: Proper TypeScript types
- **UX improvements**: Loading states and error handling

## Consequences

### Positive
- ✅ **Full functionality**: Complete like and comment system
- ✅ **Real data persistence**: All interactions saved to database
- ✅ **Security**: Proper authentication and authorization
- ✅ **Performance**: Optimized queries and lazy loading
- ✅ **User experience**: Immediate feedback and smooth interactions
- ✅ **Scalability**: Efficient database design for growth

### Technical Benefits
- **Type safety**: Full TypeScript integration
- **Data integrity**: Database constraints and validation
- **Maintainability**: Clean separation of concerns
- **Testability**: Isolated server actions for testing

### Security Considerations
- Users can only like/comment as themselves
- Users can only edit/delete their own comments
- Content validation prevents malicious input
- RLS policies enforce data access rules

## Integration Points
- **Activities Feed**: Enhanced with real social data
- **User Authentication**: Leverages existing auth system
- **Profile System**: Integrates with user profiles for comments
- **Community Features**: Foundation for additional social features

## Future Enhancements
- **Notifications** for likes and comments
- **Comment threading** and replies
- **Rich text** comment formatting
- **Activity reactions** beyond just likes
- **Social analytics** and insights

## Testing Requirements
- [x] Like/unlike functionality works correctly
- [x] Comment creation, editing, deletion works
- [x] Social data loads properly with activities
- [x] RLS policies prevent unauthorized access
- [x] UI updates immediately with optimistic updates
- [x] Error handling provides user feedback

## Related
- **Original Feature**: Activities Feed with exercise dropdown
- **Database**: Extends existing community and user systems
- **Security**: Builds on established RLS patterns
- **UI Components**: Enhances existing WorkoutActivityCard 