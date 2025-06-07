# ADR-005: AI Feedback System Database & Backend Implementation

## Status
Accepted

## Context
The fitness tracker application needs a robust system to collect user feedback on AI-generated content (training programs and coach recommendations) to enable continuous improvement of AI quality. This requires new database tables and backend logic to securely store and manage feedback data.

## Decision
We will implement a comprehensive feedback system with two dedicated database tables and corresponding server actions to handle feedback submission and retrieval.

### Database Schema Design

#### Table Structure
1. **`ai_program_feedback`**: Stores feedback for AI-generated training programs
2. **`ai_coach_feedback`**: Stores feedback for AI Coach recommendations

#### Key Design Decisions

**Rating System**: 1-5 integer scale for simplicity and universal understanding
- Provides clear quantitative feedback
- Easy to aggregate and analyze
- Familiar to users from common rating systems

**AI Coach Feedback Complexity**: Dual reference system for recommendations
- `recommendation_cache_key`: Links to cached recommendations when available
- `recommendation_content_hash`: Fallback for non-cached recommendations
- Constraint ensures at least one reference is provided

**Security Model**: Row Level Security (RLS) with user-based policies
- Users can only access their own feedback
- Prevents data leakage between users
- Leverages Supabase's built-in authentication

### Backend Implementation

#### Server Actions Architecture
- **Type Safety**: Zod schemas for input validation
- **Error Handling**: Comprehensive error catching with user-friendly messages
- **Ownership Verification**: Ensures users can only provide feedback on their own content
- **Atomic Operations**: Single transaction feedback submission

#### API Design Principles
- **Explicit Parameters**: Clear function signatures with required/optional parameters
- **Consistent Response Format**: Standardized success/error response structure
- **Defensive Programming**: Validates all inputs and handles edge cases

## Alternatives Considered

### Single Feedback Table
**Rejected**: Would require complex polymorphic relationships and reduce query performance

### External Feedback Service
**Rejected**: Adds unnecessary complexity and latency for this use case

### NoSQL Document Storage
**Rejected**: Relational structure provides better data integrity and query capabilities

### Rating Scale Alternatives
**Considered**: 1-10 scale, thumbs up/down, percentage
**Rejected**: 1-5 provides optimal balance of granularity and simplicity

## Consequences

### Positive
- **Data Integrity**: Foreign key constraints ensure referential integrity
- **Performance**: Strategic indexes optimize common query patterns
- **Security**: RLS policies prevent unauthorized access
- **Scalability**: Normalized structure supports efficient querying
- **Flexibility**: Dual reference system handles various recommendation scenarios
- **Type Safety**: Full TypeScript integration prevents runtime errors

### Negative
- **Complexity**: AI Coach feedback requires dual reference handling
- **Storage Overhead**: Separate tables increase database size
- **Migration Dependency**: Requires database migration deployment

### Neutral
- **Additional Maintenance**: New tables require ongoing maintenance
- **Query Complexity**: Joins required for comprehensive feedback analysis

## Implementation Details

### Database Migration
```sql
-- File: 20250106120000_create_ai_feedback_tables.sql
-- Creates both feedback tables with proper constraints, indexes, and RLS
```

### Server Actions
```typescript
// File: src/app/_actions/feedbackActions.ts
// Implements submitProgramFeedback, submitCoachFeedback, and getFeedbackStats
```

### Key Features
- **Zod Validation**: Input sanitization and type checking
- **Authentication**: User verification for all operations
- **Ownership Checks**: Prevents cross-user data access
- **Error Logging**: Comprehensive logging for debugging
- **Statistics Helper**: Optional analytics function

## Monitoring and Success Criteria

### Performance Metrics
- Feedback submission response time < 500ms
- Database query performance within acceptable limits
- No security violations or unauthorized access

### Business Metrics
- User feedback participation rate
- Average rating trends over time
- Feedback quality and completeness

### Technical Metrics
- Zero data integrity violations
- Successful migration deployment
- TypeScript compilation without errors

## Future Considerations

### Potential Enhancements
- **Feedback Analytics Dashboard**: Aggregate insights for AI improvement
- **Sentiment Analysis**: Automated analysis of comment text
- **Feedback Trends**: Historical analysis and pattern detection
- **Moderation System**: Content filtering for inappropriate feedback

### Scaling Considerations
- **Partitioning**: Consider date-based partitioning for large datasets
- **Archiving**: Strategy for old feedback data management
- **Caching**: Feedback statistics caching for performance

## Related ADRs
- ADR-002: AI Program Personalization Enhancements
- ADR-003: AI Coach Program Adherence Integration
- ADR-004: AI Coach Specific Actionable Focus Areas

This ADR establishes the foundation for systematic AI quality improvement through user feedback collection and analysis. 