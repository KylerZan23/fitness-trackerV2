# ADR-052: Dedicated Upgrade Page with Dynamic Progress Tracking

## Status
Accepted

## Context
Users who reach their trial limit or attempt to access locked premium features need a compelling upgrade experience that reminds them of their investment in the platform and clearly presents subscription options. The existing pricing page serves as a general landing page but lacks personalization and context about the user's fitness journey.

## Decision
We will implement a dedicated `/upgrade` page that dynamically displays the user's workout progress and provides contextual messaging based on how they reached the page (trial expired vs. feature locked).

### Implementation Details

#### Dynamic User Progress Display
- Fetch and display user workout statistics using existing `getUserWorkoutStats()` function
- Show compelling metrics: total workouts completed, total weight lifted, average workouts per week
- Display user's most active day and monthly workout count
- Present data in visually appealing cards with icons and clear typography

#### Contextual Messaging System
- Support query parameters for context:
  - `?expired=true` for trial expiration scenarios
  - `?feature=X` for feature-specific upgrade prompts
  - `?from=X` for intelligent back navigation
- Dynamic header messaging based on context:
  - Trial expired: "Your 7-Day Trial Has Ended"
  - Feature locked: "Unlock [feature name]"
- Contextual icons and color schemes for different scenarios

#### Integrated Stripe Checkout
- Reuse existing `createCheckoutSession` server action for consistency
- Present both monthly ($9.99) and annual ($39.99) subscription options
- Maintain feature parity with pricing page (same feature lists and styling)
- Include trust indicators: 7-day trial, cancel anytime, secure payment via Stripe

#### Professional UI Design
- Gradient background for visual appeal
- Card-based layout for progress metrics and pricing options
- "Most Popular" badge on annual plan highlighting 67% savings
- Error handling with user-friendly messaging
- Loading states during checkout process
- Mobile-responsive design matching app aesthetic

## Rationale

### Benefits
1. **Increased Conversion**: Personal progress data creates emotional connection and demonstrates value
2. **Context Awareness**: Different messaging for different scenarios improves user experience
3. **Consistency**: Reuses existing pricing components and Stripe integration patterns
4. **Trust Building**: Professional design with clear trust indicators reduces upgrade friction
5. **Maintainability**: Leverages existing server actions and UI components

### Technical Considerations
- Uses existing `getUserWorkoutStats()` function for data fetching
- Reuses proven Stripe checkout flow from pricing page
- Implements proper error handling and loading states
- Supports URL parameters for flexible routing from different app sections

### User Experience Impact
- Users see tangible evidence of their fitness journey progress
- Clear value proposition with personalized data
- Seamless transition from locked features to subscription purchase
- Professional upgrade experience builds trust in premium features

## Alternatives Considered

### Option 1: Enhanced Pricing Page
- **Rejected**: Would dilute the general landing page purpose and complicate routing logic

### Option 2: Modal-Based Upgrade Flow
- **Rejected**: Less compelling than full-page experience and harder to show comprehensive progress data

### Option 3: Generic Upgrade Page
- **Rejected**: Misses opportunity to leverage user's investment and progress data for higher conversion

## Implementation Notes

### Query Parameter Support
```typescript
// Example usage from different app sections
router.push('/upgrade?expired=true')
router.push('/upgrade?feature=AI%20Coach&from=ai-coach')
```

### Progress Data Integration
- Fetches data on page load using existing server actions
- Graceful handling of users with minimal workout data
- Skeleton loading states while data loads

### Stripe Integration
- Uses existing environment variables for price IDs
- Maintains same success/cancel URL patterns as pricing page
- Consistent error handling and user feedback

## Success Metrics
- Upgrade conversion rate from trial expiration scenarios
- Upgrade conversion rate from feature-locked scenarios
- Time spent on upgrade page vs. pricing page
- User feedback on upgrade experience

## Migration Path
- No database changes required
- New route doesn't affect existing pricing page functionality
- Can be deployed independently and tested with feature flags

## Future Considerations
- A/B testing different progress metrics displays
- Integration with goal-setting features once implemented
- Expansion to include social proof (community activity, etc.)
- Potential integration with achievement/badge systems

## Dependencies
- Existing `getUserWorkoutStats()` function in `profileActions.ts`
- Existing `createCheckoutSession()` function in `stripeActions.ts`
- Existing UI components (Card, Button, Badge, etc.)
- Stripe environment variables and configuration

## Date
January 2025