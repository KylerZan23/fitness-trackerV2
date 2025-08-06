# ADR-003: AI Coach Program Adherence Integration

## Status
Accepted

## Context
The AI Weekly Review feature was previously generating insights based solely on raw workout activity data and user profile information. While this provided valuable feedback, it lacked the contextual understanding of whether users were following their structured training programs effectively.

Users following structured training programs need feedback that:
- Assesses adherence to their planned workout schedule
- References specific program phases and focus areas
- Provides program-aligned recommendations for improvement
- Celebrates program compliance achievements

## Decision
We will integrate the existing `getProgramAdherenceData` functionality into the `getAIWeeklyReview` server action to provide program-aware weekly analysis.

### Implementation Details

**Data Integration:**
- Fetch active training program using `getActiveTrainingProgram()`
- Retrieve program adherence metrics via `getProgramAdherenceData()`
- Include program data in cache key calculation for proper invalidation
- Handle cases where no active program exists gracefully

**Enhanced LLM Prompt:**
- Add program adherence context section with:
  - Program name, phase, and week information
  - Planned workout focuses and completion status
  - Specific adherence analysis instructions
- Modify existing instructions to prioritize program compliance
- Update output format examples to reference program-specific recommendations

**Cache Strategy:**
- Include program adherence data in cache signature:
  - `programName`, `currentPhase`, `currentWeek`
  - `workoutsCompletedThisWeek` for adherence tracking
- Maintain 30-minute cache duration for performance
- Ensure cache invalidation when program progress changes

## Consequences

### Positive
- **Contextual Insights**: Weekly reviews now understand user's structured program context
- **Program-Aligned Recommendations**: Tips and suggestions align with planned workout focuses
- **Adherence Tracking**: Users receive feedback on program compliance and catch-up strategies
- **Enhanced Motivation**: Celebrates program consistency and provides specific next steps
- **Backward Compatibility**: Gracefully handles users without active programs

### Neutral
- **Increased Complexity**: Additional data fetching and prompt engineering
- **Cache Key Changes**: More granular caching based on program state

### Negative
- **Dependency Risk**: Weekly review now depends on program service availability
- **Prompt Length**: Longer prompts may increase LLM processing time slightly

## Implementation Notes
- Program adherence data fetching is wrapped in try-catch to ensure resilience
- Weekly review continues to function if program data is unavailable
- Existing cache infrastructure is reused with enhanced key generation
- LLM prompt maintains backward compatibility for users without programs

## Related
- Builds upon existing `getProgramAdherenceData` from AI Coach recommendations
- Enhances the AI Weekly Review feature (implemented in previous ADR)
- Supports the overall AI Coach system architecture 