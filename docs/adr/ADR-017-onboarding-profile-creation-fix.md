# ADR-017: Onboarding Profile Creation Fix

## Status
Accepted

## Context
Users completing the onboarding flow were encountering a critical failure during training program generation. The error "The result contains 0 rows" (PGRST116) was occurring because user profiles were either missing or incomplete, preventing the AI program generation system from accessing required user data.

### Problem Symptoms
- Users successfully completed onboarding but failed to generate training programs
- Terminal logs showed `Error fetching user profile: { code: 'PGRST116', details: 'The result contains 0 rows' }`
- Users were redirected to `/program` page with "No Active Training Program" message
- Onboarding appeared successful but program generation silently failed

### Root Cause Analysis
1. **Incomplete Profile Creation**: The signup process created profiles with minimal fields, missing columns added in later database migrations
2. **Schema Evolution**: The profiles table evolved through multiple migrations, but signup didn't account for all required fields
3. **Missing Validation**: No validation existed to ensure profile completeness before program generation
4. **Poor Error Handling**: Technical database errors were exposed to users instead of actionable messages

## Decision
We will implement a comprehensive fix that addresses profile creation, validation, and error handling across the entire onboarding flow.

### Solution Components

#### 1. Enhanced Signup Profile Creation
- **Comprehensive Field Population**: Include all required profile fields during signup
- **Default Values**: Set sensible defaults for fields updated during onboarding
- **Error Blocking**: Prevent signup completion if profile creation fails
- **Schema Alignment**: Ensure signup creates profiles matching current database schema

#### 2. Robust Onboarding Error Handling
- **Profile Existence Validation**: Check profile exists before updating
- **Fallback Profile Creation**: Create missing profiles during onboarding
- **Graceful Degradation**: Continue onboarding even if program generation fails
- **User-Friendly Messages**: Replace technical errors with actionable feedback

#### 3. Program Generation Validation
- **Specific Error Handling**: Handle PGRST116 errors with context-specific messages
- **Required Field Validation**: Verify profile completeness before program generation
- **Null Safety**: Add comprehensive null checks for profile data
- **Recovery Guidance**: Provide clear next steps when validation fails

## Implementation Details

### Database Schema Requirements
Based on the `UserProfileForGeneration` interface, the following fields are required:
- `id` (UUID) - Primary key
- `name` (string) - User's full name
- `age` (number) - User's age for program customization
- `weight_unit` (string) - Preferred weight unit (kg/lbs)
- `primary_training_focus` (string) - Derived from onboarding goals
- `experience_level` (string) - User's fitness experience level
- `onboarding_responses` (JSONB) - Complete onboarding questionnaire data

### Profile Creation Strategy
```typescript
// Comprehensive profile data during signup
const profileData = {
  id: user.id,
  email: user.email,
  name: data.name,
  age: 25, // Default, updated during onboarding
  fitness_goals: 'Get fit', // Default goal
  weight_unit: 'kg', // Default unit
  primary_training_focus: null, // Set during onboarding
  experience_level: null, // Set during onboarding
  onboarding_responses: null, // Set during onboarding
  // ... other required fields
}
```

### Error Handling Improvements
- **PGRST116 Handling**: "Your profile was not found. Please complete the signup process again."
- **Missing Fields**: "Your profile is incomplete. Please contact support."
- **Onboarding Incomplete**: "Please complete your onboarding first."
- **General Errors**: "Failed to load your profile. Please try again."

## Alternatives Considered

### Option 1: Minimal Profile Creation (Current)
- **Pros**: Faster signup, simpler implementation
- **Cons**: Fails during onboarding, poor user experience, technical debt

### Option 2: Lazy Profile Population
- **Pros**: Defers complexity until needed
- **Cons**: Complex error handling, potential for multiple failure points

### Option 3: Database Migration Approach
- **Pros**: Fixes existing data issues
- **Cons**: Doesn't prevent future occurrences, requires downtime

### Option 4: Comprehensive Profile Creation (Chosen)
- **Pros**: Prevents issues at source, robust error handling, future-proof
- **Cons**: Slightly more complex signup process

## Consequences

### Positive
- **Improved User Experience**: Users complete onboarding successfully and generate programs
- **Reduced Support Burden**: Fewer profile-related support tickets
- **Better Error Messages**: Users receive actionable feedback instead of technical errors
- **Future-Proof**: Accounts for schema evolution and new required fields
- **Monitoring**: Better visibility into profile creation and onboarding health

### Negative
- **Increased Complexity**: More comprehensive profile creation logic
- **Default Values**: Some fields have defaults that may not reflect user preferences
- **Migration Overhead**: Existing users with incomplete profiles need special handling

### Neutral
- **Code Maintenance**: Additional validation logic requires ongoing maintenance
- **Testing Requirements**: More comprehensive testing needed for profile creation flows

## Implementation Plan

### Phase 1: Core Fix (Immediate)
1. ✅ Update signup profile creation with comprehensive fields
2. ✅ Add profile existence validation in onboarding actions
3. ✅ Enhance program generation error handling
4. ✅ Create fallback profile creation during onboarding

### Phase 2: Monitoring and Validation (Next Sprint)
1. Add profile completeness health checks
2. Implement monitoring for profile creation success rates
3. Create admin tools for profile validation and repair
4. Add comprehensive testing for edge cases

### Phase 3: User Recovery (Future)
1. Implement automatic profile repair for existing users
2. Add user-facing profile completion status
3. Create self-service profile recovery flows
4. Implement profile validation service

## Success Metrics

### Key Performance Indicators
- **Onboarding Success Rate**: Target 95%+ completion rate
- **Program Generation Success**: Target 95%+ success rate after onboarding
- **Profile Creation Success**: Target 99%+ success rate during signup
- **Error Rate Reduction**: Minimize PGRST116 errors in application logs

### Monitoring
- Track profile creation success/failure rates
- Monitor onboarding completion funnel
- Alert on profile validation failures
- Dashboard for user signup and onboarding health

## Rollback Plan

### If Critical Issues Arise
1. **Revert Signup Changes**: Return to minimal profile creation approach
2. **Disable Program Generation**: Add feature flag to disable automatic program generation
3. **Manual Profile Creation**: Provide admin interface for profile creation
4. **Database Cleanup**: SQL scripts to repair incomplete profiles

### Database Recovery
```sql
-- Repair incomplete profiles
UPDATE profiles 
SET 
  age = COALESCE(age, 25),
  fitness_goals = COALESCE(fitness_goals, 'Get fit'),
  weight_unit = COALESCE(weight_unit, 'kg')
WHERE age IS NULL OR fitness_goals IS NULL OR weight_unit IS NULL;
```

## Related ADRs
- ADR-001: Profile Focus Experience
- ADR-003: AI Program Generation Architecture
- ADR-010: Standardized Error Handling
- ADR-015: Subscription Management Database Foundation

## References
- [Onboarding Profile Creation Fix Implementation Plan](../implementation_plans/onboarding-profile-creation-fix.md)
- [Supabase RLS Policies Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Error Handling Best Practices](https://nextjs.org/docs/advanced-features/error-handling) 