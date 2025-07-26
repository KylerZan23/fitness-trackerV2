# Profile Backend Integration Implementation Plan

## Overview
Replace hardcoded/fallback data in the profile page with real backend integration using existing database schema and new server actions.

## Current Issues
- Profile page uses fallback data for most fields
- Activity feed shows hardcoded activities
- Personal records use mock monthly progress data
- Social metrics (followers/following) are hardcoded
- Age stats use hardcoded physical measurements

## Database Schema Analysis

### Available Tables
1. **profiles**: name, age, fitness_goals, onboarding_responses, primary_training_focus, experience_level, professional_title, bio, height_cm, weight_kg, birth_date, profile_picture_url, weight_unit
2. **workouts**: Complete workout history with exercise_name, weight, reps, sets, created_at
3. **community_feed_events**: event_type, metadata, created_at for activity tracking
4. **community_posts**: For blog-style posts in activity feed

### Missing Tables
- User follows/followers (will use placeholder data for now)

## Implementation Tasks

### 1. Create Profile Server Actions
- **File**: `src/app/_actions/profileActions.ts`
- **Functions**:
  - `getUserProfileData()`: Fetch comprehensive profile with computed fields
  - `getUserActivityFeed()`: Fetch recent activities from community_feed_events
  - `getUserPersonalRecords()`: Calculate PRs from workout history
  - `getUserStats()`: Calculate workout statistics

### 2. Enhance Profile Data Structure
- Add missing profile fields from database
- Calculate derived fields (total workouts, PRs count, etc.)
- Handle unit conversions properly

### 3. Activity Feed Integration
- Query `community_feed_events` table
- Map event types to display components
- Support pagination for large feeds

### 4. Personal Records Calculation
- Use existing strength calculation utilities
- Focus on main lifts: Squat, Bench Press, Deadlift, Overhead Press
- Calculate monthly progress from workout history
- Handle different weight units

### 5. Profile Page Refactoring
- Replace hardcoded data with server action calls
- Add proper loading states
- Handle error cases gracefully
- Maintain fallback data for missing fields

## Technical Considerations

### Data Fetching Strategy
- Use parallel server action calls for different data types
- Implement proper error handling and fallbacks
- Cache expensive calculations when possible

### Unit Handling
- Respect user's weight_unit preference
- Convert between kg/lbs consistently
- Display appropriate precision

### Performance
- Limit workout queries to recent data (last 12 months)
- Use database indexes for efficient queries
- Batch related queries when possible

## Files to Modify

1. **New Files**:
   - `src/app/_actions/profileActions.ts`

2. **Modified Files**:
   - `src/app/profile/page.tsx` - Update to use new server actions
   - `src/components/profile/ActivityFeed.tsx` - Remove hardcoded data
   - `src/components/profile/PersonalRecordsSection.tsx` - Remove hardcoded monthly progress
   - `src/components/profile/SocialProfileHeader.tsx` - Handle real/placeholder social metrics

## Implementation Priority
1. Create profileActions.ts with core functions
2. Update profile page to use real data
3. Test with existing user data
4. Add proper error handling and loading states
5. Update component fallbacks for missing data

## Notes
- Social features (followers/following) will use placeholder data until proper implementation
- Activity feed will start with workout completions and PRs, can expand later
- Personal records calculation should be robust and handle edge cases
- All data should respect user privacy and RLS policies 