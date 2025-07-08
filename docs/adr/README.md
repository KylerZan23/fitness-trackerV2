# Architecture Decision Records (ADR) Index

This directory contains all Architecture Decision Records (ADRs) for the Fitness Tracker application. ADRs document important architectural and design decisions made during the development of the application.

## About ADRs

Architecture Decision Records capture important architectural decisions along with their context and consequences. They help developers understand:
- Why certain decisions were made
- What alternatives were considered
- What the implications of decisions are
- The context in which decisions were made

## ADR List

### Authentication & User Management

* [001-simplified-signup-onboarding-flow.md](./001-simplified-signup-onboarding-flow.md) - Documents the decision to move to a two-phase signup and onboarding process, reducing initial friction while ensuring complete user profiles.

* [006-auth-token-verification-improvement.md](./006-auth-token-verification-improvement.md) - Enhances authentication token verification and error handling mechanisms.

* [005-rls-policy-redesign.md](./005-rls-policy-redesign.md) - Redesigns Row Level Security policies for better data protection and access control.

* [001-profile-picture-schema-fix.md](./001-profile-picture-schema-fix.md) - Fixes profile picture schema and upload functionality issues.

* [profile-picture-upload.md](./profile-picture-upload.md) - Documents the implementation of profile picture upload functionality.

### Strava Integration

* [001-strava-token-refresh-server-side-only.md](./001-strava-token-refresh-server-side-only.md) - Implements secure server-side token refresh to fix client-side security violations and ensure proper Strava API integration.

* [007-strava-api-integration.md](./007-strava-api-integration.md) - Documents the complete Strava API integration architecture and implementation details.

### AI Coach & Program Generation

* [002-ai-program-personalization-enhancements.md](./002-ai-program-personalization-enhancements.md) - Enhances AI program generation with better personalization based on user data and preferences.

* [003-ai-coach-program-adherence-integration.md](./003-ai-coach-program-adherence-integration.md) - Integrates program adherence tracking with AI coach recommendations for better user guidance.

* [004-ai-coach-specific-actionable-focus-areas.md](./004-ai-coach-specific-actionable-focus-areas.md) - Implements specific, actionable focus areas for AI coach recommendations based on user behavior and progress.

* [005-ai-feedback-system-database-backend.md](./005-ai-feedback-system-database-backend.md) - Creates database backend for collecting and processing user feedback on AI-generated programs.

* [002-ai-coach-recommendation-caching.md](./002-ai-coach-recommendation-caching.md) - Implements caching system for AI coach recommendations to improve performance and reduce API calls.

* [ADR-003-ai-program-generation-architecture.md](./ADR-003-ai-program-generation-architecture.md) - Documents the overall architecture for AI program generation including LLM integration and data flow.

### User Experience & Interface

* [ADR-001-Add-Profile-Focus-Experience.md](./ADR-001-Add-Profile-Focus-Experience.md) - Adds primary training focus and experience level fields to user profiles for better personalization.

* [ADR-002-Remove-Training-Style-Question.md](./ADR-002-Remove-Training-Style-Question.md) - Removes the training style question from onboarding to simplify the user experience and reduce complexity.

* [imperial-units-support.md](./imperial-units-support.md) - Implements support for imperial units alongside metric units for international users.

* [ADR-001-muscle-group-categorization.md](./ADR-001-muscle-group-categorization.md) - Documents the categorization system for muscle groups used in workout tracking and analytics.

* [ADR-individual-onboarding-questions.md](./ADR-individual-onboarding-questions.md) - Defines the individual question approach for the onboarding flow to collect user preferences and fitness data.

* [ADR-004-server-actions-testing-foundation.md](./ADR-004-server-actions-testing-foundation.md) - Establishes comprehensive testing foundation for server actions with proper mocking strategies and authentication testing patterns.

### Technical Infrastructure

* [0001-revert-tailwind-css-to-v3.md](./0001-revert-tailwind-css-to-v3.md) - Documents the decision to revert from Tailwind CSS v4 Alpha to v3 for stability and compatibility with existing components.

* [00X-goals-feature-schema.md](./00X-goals-feature-schema.md) - Defines the database schema and architecture for the goals tracking feature.

## ADR Naming Convention

ADRs in this directory follow these naming patterns:
- `NNN-descriptive-title.md` - Numbered ADRs (e.g., `001-simplified-signup-onboarding-flow.md`)
- `ADR-NNN-descriptive-title.md` - ADRs with explicit ADR prefix (e.g., `ADR-001-Add-Profile-Focus-Experience.md`)
- `descriptive-title.md` - Descriptive title only for specific features (e.g., `profile-picture-upload.md`)

## ADR Status

ADRs can have the following statuses:
- **Accepted** - The decision has been made and implemented
- **Proposed** - The decision is under consideration
- **Superseded** - The decision has been replaced by a newer ADR
- **Deprecated** - The decision is no longer relevant

## Contributing

When creating new ADRs:
1. Use the next available number in the sequence
2. Follow the established format with Context, Decision, and Consequences sections
3. Include the date and status
4. Add an entry to this index
5. Consider the impact on existing ADRs

## Related Documentation

- `/docs/implementation_plans/` - Current and ongoing implementation plans
- `/docs/archive/` - Historical documentation and legacy plans
- `/src/lib/` - Implementation details for architectural decisions
- `/supabase/migrations/` - Database schema changes related to ADRs

---

Last updated: January 2025 