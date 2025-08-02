# ADR-046: Mandatory 7-Day Trial with Read-Only Mode Implementation

## Status
**Accepted** - Implemented 2025-01-19

## Context
The application needed to implement a freemium model with a mandatory 7-day free trial. After the trial expires, users without an active premium subscription should be restricted to read-only access, allowing them to view past data but preventing creation or modification of new content.

## Decision
Implement a comprehensive trial and read-only mode system that:

1. **Trial Management**: Automatically set `trial_ends_at` timestamp for new users (7 days from signup)
2. **Middleware Protection**: Check trial status in middleware and set read-only mode headers
3. **Server-Side Guards**: Prevent data modification in server actions when trial expired
4. **UI Restrictions**: Disable buttons, forms, and inputs in read-only mode
5. **User Feedback**: Clear messaging about trial status and upgrade prompts

## Technical Implementation

### 1. Enhanced Subscription Utilities (`src/lib/subscription.ts`)
- **Extended SubscriptionStatus Interface**: Added `isReadOnlyMode` and `trialExpired` fields
- **Read-Only Mode Detection**: `isReadOnlyMode()` function for server-side checks
- **Client-Side Status**: `getSubscriptionStatusFromHeaders()` for client-side access

### 2. Middleware Enhancement (`src/middleware.ts`)
- **Trial Status Checking**: Automatic detection of trial expiry in middleware
- **Header-Based Communication**: Set read-only mode headers for client consumption
- **Performance Optimization**: Single database query per request for subscription status

### 3. React Context Provider (`src/contexts/ReadOnlyModeContext.tsx`)
- **Global State Management**: `ReadOnlyModeProvider` for application-wide read-only state
- **Guard Hook**: `useReadOnlyGuard()` for consistent feature access checking
- **Upgrade Prompts**: Centralized upgrade prompt handling

### 4. Server Action Protection
**Protected Actions:**
- `generateTrainingProgram()` - Program generation
- `startWorkoutSession()` - Workout creation
- `createPost()` - Community posts
- `createCommunityGroup()` - Community groups

**Implementation Pattern:**
```typescript
// Check if user is in read-only mode
const isInReadOnlyMode = await isReadOnlyMode(userId)
if (isInReadOnlyMode) {
  return { 
    success: false, 
    error: 'Your free trial has expired. Please upgrade to premium to access this feature.' 
  }
}
```

### 5. UI Component Restrictions
**Enhanced Components:**
- **Program Page**: Disabled workout start buttons, program generation
- **Create Post Form**: Disabled inputs, updated placeholders, disabled submit
- **Create Group Form**: Disabled all form elements in read-only mode
- **Trial Status Banner**: Visual indicator of trial status and days remaining

**Visual Patterns:**
- Disabled state styling for read-only mode
- Updated placeholders indicating upgrade requirement
- Button text changes to "Upgrade Required"
- Trial status banners with countdown and upgrade prompts

### 6. User Experience Features
- **Trial Status Display**: Real-time trial countdown in UI
- **Read-Only Mode Indicator**: Clear messaging when features are restricted
- **Upgrade Prompts**: Contextual upgrade suggestions when accessing restricted features
- **Historical Data Access**: Full access to view past workouts, programs, and dashboard

## Database Schema
Uses existing subscription fields from previous ADR-015:
- `is_premium` (BOOLEAN): Premium subscription status
- `trial_ends_at` (TIMESTAMPTZ): Trial expiration timestamp

## Security & Performance Considerations
- **Server-Side Validation**: All restrictions enforced server-side
- **Middleware Optimization**: Single database query per request
- **Error Handling**: Graceful degradation if subscription check fails
- **Session Consistency**: Real-time status updates on auth state changes

## Read-Only Mode Rules
**Restricted Actions:**
- ❌ Start new workouts
- ❌ Generate new training programs
- ❌ Create community posts
- ❌ Create community groups
- ❌ Update personal records

**Allowed Actions:**
- ✅ View workout history
- ✅ View dashboard and progress
- ✅ Browse community content
- ✅ View existing training programs
- ✅ Access profile information

## Testing Strategy
- **Unit Tests**: Server action guards and utility functions
- **Integration Tests**: End-to-end trial expiry scenarios
- **UI Tests**: Component behavior in read-only mode
- **Performance Tests**: Middleware subscription checking overhead

## Future Enhancements
- **Grace Period**: Additional days after trial expiry
- **Feature-Specific Trials**: Different trial lengths for different features
- **Usage Analytics**: Track trial conversion metrics
- **A/B Testing**: Different trial lengths and messaging

## Migration Notes
- **Backward Compatibility**: Existing users automatically granted trial period
- **Gradual Rollout**: Can be enabled per user or percentage
- **Database Impact**: Uses existing subscription schema

## Monitoring & Metrics
- Trial conversion rates
- Read-only mode activation frequency
- Feature access attempt patterns
- Upgrade funnel analytics

---

This implementation provides a robust foundation for freemium business model while maintaining excellent user experience and performance.