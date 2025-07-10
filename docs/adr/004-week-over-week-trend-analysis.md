# ADR-004: Week-over-Week Trend Analysis Integration

## Status
Accepted

## Context
The AI Weekly Review feature was providing insights based on current week activity data and program adherence, but lacked the comparative context of how performance changed relative to the previous week. Users need to understand their fitness trends over time to:

- Track progress and momentum in their training
- Identify declining patterns before they become problematic
- Celebrate specific improvements with concrete numbers
- Receive trend-based recommendations for maintaining or reversing patterns
- Understand their training consistency patterns week-to-week

## Decision
We will integrate week-over-week trend analysis into the `getAIWeeklyReview` server action to provide comparative insights between current and previous week performance.

### Implementation Details

**Data Collection Strategy:**
- Fetch activity data for both current week (7 days) and extended period (14 days)
- Calculate week-over-week changes for key metrics:
  - Workout days change (current vs previous week)
  - Workout sessions change
  - Run sessions change  
  - Average workout duration change
  - Run pace trend (already available in RPC function)

**Trend Calculation Logic:**
- `workoutDaysChange`: Direct comparison using existing `workout_days_this_week` vs `workout_days_last_week`
- `workoutSessionsChange`: Calculate difference in session counts between periods
- `runSessionsChange`: Calculate difference in run counts between periods
- `avgWorkoutDurationChange`: Helper function to estimate duration changes
- `runPaceTrend`: Utilize existing pace trend analysis from RPC function

**Enhanced LLM Prompt:**
- Add dedicated "WEEK-OVER-WEEK TREND ANALYSIS" section with:
  - Formatted trend changes with +/- indicators
  - Specific numerical comparisons (This Week vs Last Week)
  - Clear trend direction indicators
- Update instructions to prioritize trend analysis
- Modify output format to emphasize trend-based insights
- Include trend-specific examples in actionable tips

**Cache Strategy Enhancement:**
- Include trend data in cache signature:
  - `workoutDaysChange`, `workoutSessionsChange`, `runSessionsChange`
  - `avgWorkoutDurationChange` for duration trends
- Maintain existing 30-minute cache duration
- Ensure cache invalidation when trend patterns change

## Consequences

### Positive
- **Trend Awareness**: Users receive specific feedback on their week-to-week progress patterns
- **Momentum Recognition**: Positive trends are celebrated with concrete numbers ("+2 workout days")
- **Early Warning System**: Declining patterns identified before becoming major issues
- **Actionable Insights**: Recommendations based on trend reversals or momentum maintenance
- **Enhanced Motivation**: Clear progress tracking increases user engagement and adherence
- **Data-Driven Coaching**: AI provides more contextual and relevant advice based on actual trends

### Neutral
- **Increased Complexity**: Additional data fetching and trend calculation logic
- **API Calls**: Two RPC calls instead of one (current + extended period)
- **Cache Key Expansion**: More granular caching based on trend state

### Negative
- **Performance Impact**: Slight increase in processing time due to additional RPC call
- **Data Dependency**: Requires sufficient historical data for meaningful trend analysis
- **Prompt Length**: Longer prompts may increase LLM processing time and costs

## Technical Implementation

**Helper Functions:**
```typescript
function calculateDurationChange(
  currentAvgDuration: number | null | undefined,
  extendedAvgDuration: number | null | undefined,
  currentWeekSessions: number
): number
```

**Trend Data Structure:**
```typescript
const weekOverWeekTrends = {
  workoutDaysChange: number,
  workoutSessionsChange: number,
  runSessionsChange: number,
  avgWorkoutDurationChange: number,
  runPaceTrend: string
}
```

**Data Fetching Pattern:**
- Parallel RPC calls for current week (7 days) and extended period (14 days)
- Error handling for both data sources
- Graceful degradation if trend data unavailable

## Implementation Notes
- Trend calculations handle null/undefined values gracefully
- Duration change calculation uses simplified estimation approach for MVP
- All trend data included in cache key for proper invalidation
- LLM prompt maintains backward compatibility while prioritizing trend insights
- Error handling ensures weekly review continues functioning if trend calculation fails

## Future Enhancements
- **Advanced Duration Calculations**: More sophisticated previous week duration estimation
- **Muscle Group Trends**: Week-over-week volume changes by muscle group
- **Exercise-Specific Trends**: Progressive overload trends for individual exercises
- **Longer-Term Trends**: Monthly and quarterly trend analysis
- **Trend Visualization**: Charts and graphs showing trend patterns over time

## Related
- Builds upon existing AI Weekly Review feature (ADR-002)
- Enhances program adherence integration (ADR-003)
- Utilizes existing `get_user_activity_summary` RPC function
- Supports the overall AI Coach system architecture 