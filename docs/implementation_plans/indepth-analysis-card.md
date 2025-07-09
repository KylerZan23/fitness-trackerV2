# Implementation Plan: Indepth Analysis Card

## Overview
Add a new "Indepth Analysis" card to the /progress page that provides micro-level insights into exercise-specific progress by comparing today's workout session to the same session from the previous week.

## Requirements
- ✅ Create a new card following existing UI patterns
- ✅ Compare today's workout to the same day of the week from last week
- ✅ Show exercise-specific progress/regression
- ✅ Display weight, reps, sets, and volume changes
- ✅ Show percentage changes and trends
- ✅ Handle different states (no workout today, no comparison data, etc.)

## Implementation Details

### 1. Component Structure
- **File**: `src/components/progress/IndepthAnalysisCard.tsx`
- **Props**: `userId`, `weightUnit`, `className`
- **State**: `comparisons`, `isLoading`, `error`, `hasWorkoutToday`

### 2. Data Flow
1. Fetch today's workouts (using `startOfDay` and `endOfDay`)
2. Fetch workouts from the same day of the week last week
3. Group exercises by name and aggregate stats
4. Calculate changes (weight, reps, sets, volume)
5. Determine trends (improving, declining, stable)
6. Sort by volume change percentage

### 3. UI Components Used
- ✅ `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription`
- ✅ `Badge` for trend indicators
- ✅ Lucide icons: `Target`, `TrendingUp`, `TrendingDown`, `Minus`, `Calendar`
- ✅ Consistent styling with existing cards

### 4. Features Implemented
- **Exercise Comparison**: Shows today vs last week for each exercise
- **Multiple Metrics**: Weight, reps, sets, volume tracking
- **Trend Analysis**: Visual indicators for improving/declining/stable
- **Percentage Changes**: Both weight and volume percentage changes
- **Smart Aggregation**: Handles multiple sets of the same exercise
- **Loading States**: Skeleton loading animation
- **Error Handling**: Graceful error display
- **Empty States**: No workout today, no comparison data

### 5. Progressive Overload Insights
- **Volume Focus**: Primary metric for determining progress
- **Weight Secondary**: Used when volume is similar
- **Contextual Display**: Shows exact changes and percentages
- **Trend Indicators**: Visual cues for user motivation

### 6. Integration
- ✅ Added to `/progress` page at the bottom
- ✅ Follows existing card layout patterns
- ✅ Uses consistent styling and spacing
- ✅ Integrated with loading states
- ✅ Proper timezone handling for Pacific Time users

## Technical Details

### Database Queries
- Uses existing `workouts` table
- Filters by `user_id` and date ranges
- Optimized with proper indexing on `created_at`

### Timezone Handling
- **User Timezone Detection**: Uses `Intl.DateTimeFormat().resolvedOptions().timeZone` to detect Pacific Time
- **Proper Date Boundaries**: Converts user timezone to UTC for database queries using `date-fns-tz`
- **Accurate Comparisons**: Ensures "today" and "last week" calculations respect user's local time zone
- **Fixed Date Display**: Shows correct dates in user's timezone (July 8th instead of July 9th for Pacific Time)
- **Fixed Workout Logging**: Updated `getTodayDateString()` to use local timezone instead of UTC for workout completion dates
- **Database Layer Fix**: Updated `logWorkout` and `logWorkoutGroup` to properly interpret workout dates as local dates

### Calculations
- **Volume**: `weight × reps × sets`
- **Trends**: Based on volume change thresholds (±2%)
- **Aggregation**: Max weight, sum sets, sum volume per exercise

### Error Handling
- Graceful fallback for missing data
- User-friendly error messages
- Loading state management

## Testing Considerations
- Test with different workout patterns
- Verify date calculations across timezone changes
- Test edge cases (no workouts, single exercises)
- Validate percentage calculations

## Future Enhancements
- Add historical trend graphs
- Include exercise-specific recommendations
- Add filtering by muscle group
- Implement workout pattern recognition
- Add goal-based progress tracking

## Performance Considerations
- Efficient date range queries
- Proper data aggregation
- Minimal re-renders with React hooks
- Optimized database queries

## Deployment Notes
- No database schema changes required
- Uses existing workout data structure
- Compatible with current user permissions
- No additional dependencies needed 