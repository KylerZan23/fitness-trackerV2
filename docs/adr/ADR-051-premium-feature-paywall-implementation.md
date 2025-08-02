# ADR-051: Premium Feature Paywall Implementation

## Status
**Accepted** - Implemented 2025-01-27

## Context
NeuralLift requires a comprehensive subscription-based access control system to monetize premium features while providing a compelling free trial experience. The application needed to restrict access to core premium features while maintaining a smooth user experience and clear upgrade paths.

### Business Requirements
- Lock AI Coach features behind subscription paywall
- Restrict training program generation for expired trial users
- Limit workout plan access to first 2 weeks during trial period
- Provide clear upgrade paths and pricing information
- Maintain professional user experience throughout

### Technical Requirements
- Middleware-level route protection for premium features
- Server action validation for premium functionality
- Progressive content unlocking based on subscription status
- Integration with existing Stripe payment system
- Consistent subscription status checking across application

## Decision
Implement a multi-layered paywall system that protects premium features at the route, server action, and component levels while providing clear upgrade paths and professional user experience.

### Architecture Overview

#### 1. Middleware Route Protection
**File:** `src/middleware.ts`
- **Premium Route Definitions**: Array of routes requiring active subscription
- **Automatic Redirects**: Expired users redirected to pricing page with context
- **Subscription Status Headers**: Read-only mode and trial status propagation
- **Cookie Preservation**: Maintain user session during redirects

```typescript
// Premium routes protected at middleware level
const premiumRoutes = ['/ai-coach']
const isPremiumRoute = premiumRoutes.some(route => request.nextUrl.pathname.startsWith(route))

// Redirect expired users with context
if (!hasActiveAccess && isPremiumRoute) {
  return NextResponse.redirect(
    new URL(`/pricing?expired=true&feature=${encodeURIComponent(request.nextUrl.pathname.substring(1))}`, request.url)
  )
}
```

#### 2. Server Action Protection
**File:** `src/app/_actions/aiProgramActions.ts`
- **Subscription Validation**: Enhanced `hasActiveSubscription()` checks
- **Error Response Enhancement**: Added `redirectToPricing` flag for client-side handling
- **Consistent Messaging**: Standardized error messages across all generation endpoints

```typescript
// Enhanced subscription checking with redirect support
const hasPaidAccess = await hasActiveSubscription(userId)
if (!hasPaidAccess) {
  return { 
    success: false, 
    error: 'Your free trial has expired. Please upgrade to premium to generate new programs.',
    redirectToPricing: true 
  }
}
```

#### 3. Component-Level Access Control
**File:** `src/components/program/SubscriptionGatedWeek.tsx`
- **Progressive Content Unlocking**: Trial users access first 2 weeks, premium users access all content
- **Professional Locked Content UI**: Premium-branded locked states with upgrade prompts
- **Subscription Status Caching**: Efficient client-side subscription checking
- **Contextual Upgrade Prompts**: Feature-specific upgrade messaging

```typescript
// Week-based access control
const TRIAL_WEEK_LIMIT = 2
const weekIsAccessible = userHasAccess || absoluteWeekIndex < TRIAL_WEEK_LIMIT
```

#### 4. Dedicated Pricing Page
**File:** `src/app/pricing/page.tsx`
- **Dynamic Messaging**: Context-aware messaging based on URL parameters
- **Stripe Integration**: Full checkout flow integration with existing payment system
- **Professional Design**: Clean pricing cards with feature comparison
- **FAQ Section**: Common questions and clear value proposition

### Implementation Details

#### Files Created
```
src/app/pricing/page.tsx                    # Dedicated pricing page
src/components/program/SubscriptionGatedWeek.tsx  # Week-based access control component
docs/adr/ADR-051-premium-feature-paywall-implementation.md  # This document
```

#### Files Modified
```
src/middleware.ts                           # Premium route protection
src/app/_actions/aiProgramActions.ts        # Enhanced subscription checks
src/app/program/page.tsx                    # Pricing redirect handling
src/components/program/ProgramPhaseDisplay.tsx  # Integration with gated weeks
README.md                                   # Documentation updates
```

#### Key Features

##### 1. Multi-Layer Protection Strategy
- **Route Level**: Middleware intercepts premium route access
- **Action Level**: Server actions validate subscription before execution
- **Component Level**: UI components check access for progressive disclosure

##### 2. Professional User Experience
- **Clear Visual Hierarchy**: Premium content clearly marked with crown icons and orange theming
- **Contextual Messaging**: Feature-specific upgrade prompts with relevant information
- **Seamless Integration**: Locked content integrates naturally with existing design system

##### 3. Business Intelligence Integration
- **Feature Tracking**: URL parameters track which features drive upgrade attempts
- **Trial Limitation Clarity**: Users understand exactly what trial includes and premium adds
- **Conversion Optimization**: Clear upgrade paths at point of feature restriction

##### 4. Technical Robustness
- **Error Handling**: Comprehensive error states with fallback behaviors
- **Performance Optimization**: Efficient subscription checks with caching
- **Type Safety**: Full TypeScript integration with proper error response types

## Consequences

### Positive
- **Revenue Protection**: Core premium features properly monetized
- **Clear Value Proposition**: Users understand trial limitations and premium benefits
- **Professional Experience**: Locked content maintains application quality standards
- **Conversion Optimization**: Multiple touchpoints for upgrade decision
- **Technical Robustness**: Multi-layer protection prevents access control bypassing

### Neutral
- **Code Complexity**: Additional subscription checking logic throughout application
- **Component Hierarchy**: New wrapper components for access control
- **Database Dependencies**: Subscription status checks on protected routes

### Potential Risks
- **User Experience**: Too aggressive restrictions could harm trial experience
- **Performance Impact**: Additional subscription checks on page loads
- **Maintenance Overhead**: Subscription logic spread across multiple layers

## Monitoring & Success Metrics
- **Trial Conversion Rate**: Percentage of trial users who upgrade to premium
- **Feature Access Attempts**: Number of times users hit paywalls
- **Upgrade Attribution**: Which features drive the most upgrade attempts
- **User Retention**: Impact of restrictions on trial user engagement
- **Technical Performance**: Subscription checking performance impact

## Future Considerations
- **Dynamic Feature Gating**: Configuration-based feature access control
- **Granular Permissions**: More nuanced access levels beyond trial/premium
- **Usage-Based Limits**: Count-based restrictions rather than binary access
- **Progressive Enhancement**: Gradually reveal premium features to trial users
- **A/B Testing Framework**: Testing different restriction strategies

## Related ADRs
- ADR-015: Subscription Management Database Foundation
- ADR-032: Environment Variable Validation
- ADR-046: Mandatory 7-Day Trial Read-Only Mode