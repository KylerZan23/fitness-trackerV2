# Implementation Plan: AI Feedback System (Database & Backend)

## Overview
Implement database schema and backend logic to store user feedback on AI-generated training programs and AI Coach recommendations. This enables quality improvement through user feedback collection.

## Database Schema

### Tables Created

#### 1. `ai_program_feedback`
- **Purpose**: Store user feedback for AI-generated training programs
- **Key Fields**:
  - `id`: UUID primary key
  - `user_id`: Foreign key to `auth.users`
  - `program_id`: Foreign key to `training_programs`
  - `rating`: Integer 1-5 (star rating)
  - `comment`: Optional text feedback
  - `created_at`: Timestamp

#### 2. `ai_coach_feedback`
- **Purpose**: Store user feedback for AI Coach recommendations
- **Key Fields**:
  - `id`: UUID primary key
  - `user_id`: Foreign key to `auth.users`
  - `recommendation_cache_key`: Optional reference to cached recommendation
  - `recommendation_content_hash`: Fallback identifier for recommendations
  - `rating`: Integer 1-5 (star rating)
  - `comment`: Optional text feedback
  - `created_at`: Timestamp

### Security & Performance
- **Row Level Security (RLS)**: Users can only access their own feedback
- **Indexes**: Created on user_id, program_id, cache_key, and created_at for performance
- **Constraints**: Rating validation (1-5), at least one reference field required for coach feedback

## Backend Implementation

### Server Actions (`feedbackActions.ts`)

#### 1. `submitProgramFeedback`
- **Input**: `programId`, `rating`, optional `comment`
- **Validation**: Zod schema with UUID and rating validation
- **Security**: Verifies program ownership before allowing feedback
- **Returns**: Success with feedback ID or error message

#### 2. `submitCoachFeedback`
- **Input**: `rating`, optional `comment`, cache key OR content hash
- **Validation**: Ensures at least one reference identifier provided
- **Security**: Verifies cache key ownership if provided
- **Returns**: Success with feedback ID or error message

#### 3. `getFeedbackStats` (Bonus)
- **Purpose**: Analytics helper for feedback statistics
- **Returns**: Average ratings and counts for both feedback types

### Key Features
- **Type Safety**: Full TypeScript types and Zod validation
- **Error Handling**: Comprehensive error catching and user-friendly messages
- **Authentication**: Proper user verification for all operations
- **Logging**: Console logging for debugging and monitoring
- **Ownership Verification**: Ensures users can only provide feedback on their own content

## Technical Considerations

### AI Coach Feedback Complexity
- **Cache Key Reference**: Links to existing cached recommendations when available
- **Content Hash Fallback**: Allows feedback on recommendations not in cache
- **Flexible Design**: Handles both cached and non-cached recommendation feedback

### Data Integrity
- **Foreign Key Constraints**: Maintains referential integrity
- **Check Constraints**: Validates rating ranges and required fields
- **Cascade Deletes**: Properly handles user/program deletion scenarios

### Performance Optimizations
- **Strategic Indexes**: Query optimization for common access patterns
- **Minimal Queries**: Efficient database operations
- **Single Transaction**: Atomic feedback submission

## Migration Strategy
- **File**: `20250106120000_create_ai_feedback_tables.sql`
- **Safe Deployment**: Uses `IF NOT EXISTS` for idempotent execution
- **Documentation**: Comprehensive table and column comments

## Future Enhancements
- **Feedback Analytics Dashboard**: Aggregate feedback insights
- **AI Model Training**: Use feedback for model improvement
- **Feedback Trends**: Track feedback patterns over time
- **Moderation System**: Handle inappropriate feedback content

## Testing Considerations
- **Unit Tests**: Validate server action logic
- **Integration Tests**: Test database operations
- **Security Tests**: Verify RLS policies work correctly
- **Edge Cases**: Handle invalid inputs and edge scenarios

## Success Metrics
- **Feedback Collection Rate**: Percentage of users providing feedback
- **Data Quality**: Completeness and validity of feedback data
- **Performance**: Response times for feedback operations
- **Security**: No unauthorized access to feedback data

This implementation provides a robust foundation for collecting and storing AI feedback while maintaining security, performance, and data integrity. 