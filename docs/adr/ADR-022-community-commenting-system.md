# ADR-022: Community Commenting System Implementation

## Status
Accepted

## Context
The community section currently allows users to create and view posts but lacks a fundamental social feature: the ability to comment on posts. This creates a one-way communication system where users cannot engage in discussions or provide feedback on community content.

## Decision
We will implement a comprehensive commenting system that includes:

1. **Database Schema**: A new `community_comments` table with proper RLS policies
2. **Server Actions**: Full CRUD operations for comments with validation
3. **Security**: Row-level security ensuring users can only modify their own comments
4. **Performance**: Proper indexing for efficient comment retrieval

## Implementation Details

### Database Schema
- Created `community_comments` table with UUID primary key
- Foreign key references to `auth.users` and `community_posts`
- Automatic timestamp management with `created_at` and `updated_at`
- Content validation at database level
- Proper cascading delete on user/post removal

### Security Model
- **Read Access**: All authenticated users can view comments
- **Write Access**: Users can only create comments when authenticated
- **Update/Delete**: Users can only modify their own comments
- **Data Validation**: Content length restrictions (1-1000 characters)

### Performance Considerations
- Indexed on `post_id` for efficient comment retrieval
- Indexed on `user_id` for user-specific queries
- Indexed on `created_at` for chronological ordering
- Comments ordered chronologically (oldest first) for natural conversation flow

### Server Actions
- `createComment`: Create new comments with post validation
- `getPostComments`: Retrieve all comments for a post
- `updateComment`: Edit existing comments (owner only)
- `deleteComment`: Remove comments (owner only)
- `getPostCommentsCount`: Helper for comment counts

## Consequences

### Positive
- **Enhanced User Engagement**: Users can now have discussions on posts
- **Community Building**: Enables meaningful interactions between users
- **Scalable Architecture**: Proper indexing and RLS for performance and security
- **Consistent Patterns**: Follows established server action patterns
- **Future-Proof**: Schema supports potential features like reply threads

### Negative
- **Database Complexity**: Additional table and relationships to maintain
- **Moderation Needs**: Comments may require content moderation in the future
- **Performance Impact**: Additional queries for comment loading

### Risks Mitigated
- **Security**: RLS policies prevent unauthorized access/modification
- **Data Integrity**: Foreign key constraints prevent orphaned comments
- **Performance**: Proper indexing ensures efficient queries
- **Validation**: Zod schemas prevent invalid data submission

## Implementation Notes
- Migration file: `20250127120000_create_community_comments.sql`
- Server actions added to: `src/app/_actions/communityActions.ts`
- Follows established patterns for consistency and maintainability
- Includes proper error handling and user feedback
- Revalidates appropriate paths for cache invalidation

## Future Considerations
- **Reply System**: Potential nested comments/replies
- **Comment Reactions**: Like/dislike functionality
- **Moderation Tools**: Admin controls for comment management
- **Real-time Updates**: WebSocket integration for live comments
- **Rich Text**: Enhanced comment formatting options 