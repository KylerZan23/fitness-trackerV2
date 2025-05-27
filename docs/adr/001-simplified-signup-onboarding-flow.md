# ADR-001: Simplified Signup with Mandatory Onboarding Flow

## Status
Accepted

## Date
2024-12-19

## Context
The previous signup flow collected comprehensive user information (name, email, password, age, fitness goals) during initial registration, followed by an optional onboarding questionnaire. This approach had several issues:

1. **High Signup Friction**: Users faced a lengthy form that could discourage completion
2. **Incomplete Profiles**: Users could bypass the detailed onboarding questionnaire, resulting in insufficient data for AI training program generation
3. **Inconsistent User Experience**: Some users had complete profiles while others had minimal data
4. **Poor Conversion**: The optional nature of onboarding meant many users never completed their profile setup

## Decision
We have decided to implement a two-phase signup flow:

### Phase 1: Minimal Signup
- Collect only essential information: name, email, password
- Use `minimalSignupSchema` for validation
- Create basic user account with Supabase Auth
- Set `onboarding_completed: false` in user profile

### Phase 2: Mandatory Onboarding
- Immediate redirect to comprehensive onboarding questionnaire after email confirmation
- Collect detailed fitness information required for AI program generation
- Prevent dashboard access until onboarding is completed
- Set `onboarding_completed: true` upon completion

## Consequences

### Positive
- **Reduced Signup Friction**: Simpler initial form increases signup completion rates
- **Guaranteed Complete Profiles**: All users must complete comprehensive onboarding
- **Better AI Program Generation**: Ensures all users have sufficient data for personalized programs
- **Consistent User Experience**: All users follow the same onboarding path
- **Improved Conversion Funnel**: Clear progression from signup → onboarding → dashboard

### Negative
- **Additional Step**: Users must complete two phases instead of one
- **Potential Drop-off**: Some users might abandon during onboarding phase
- **Email Confirmation Dependency**: Users must confirm email before accessing onboarding

### Neutral
- **Code Complexity**: Minimal increase due to schema changes and flow updates
- **Database Impact**: No significant changes to existing schema

## Implementation Details

### Files Modified
- `src/lib/schemas.ts`: Added `minimalSignupSchema`
- `src/app/signup/page.tsx`: Simplified signup form
- `src/app/auth/confirm/page.tsx`: Updated profile creation and redirect logic
- `README.md`: Updated documentation
- `PROMPT_1_IMPLEMENTATION.md`: Implementation documentation

### Flow Diagram
```
Old Flow:
Signup (comprehensive) → Email Confirmation → Dashboard (optional onboarding)

New Flow:
Signup (minimal) → Email Confirmation → Onboarding (mandatory) → Dashboard
```

### Technical Changes
- Created `minimalSignupSchema` with only name, email, password validation
- Modified signup handler to redirect to `/onboarding` instead of showing success message
- Updated auth confirmation to create profile with `onboarding_completed: false`
- Auth confirmation now redirects to `/onboarding` instead of `/dashboard`

## Alternatives Considered

### 1. Progressive Disclosure in Single Form
- **Pros**: Single step process
- **Cons**: Still creates a lengthy form, doesn't solve the core friction issue

### 2. Optional Onboarding with Dashboard Prompts
- **Pros**: Allows immediate dashboard access
- **Cons**: Doesn't guarantee profile completion, inconsistent user experience

### 3. Social Login Integration
- **Pros**: Reduces signup friction through third-party auth
- **Cons**: Doesn't solve the profile completion issue, adds external dependencies

## Success Metrics
- Signup completion rate increase
- Onboarding completion rate
- User retention after onboarding
- AI training program generation success rate
- User satisfaction with the signup experience

## Future Considerations
- Monitor onboarding abandonment rates
- Consider progress indicators during onboarding
- Potential A/B testing of onboarding question order
- Social login integration to further reduce friction
- Mobile-specific onboarding optimizations

## Related Decisions
- Future ADRs may address onboarding question optimization
- Potential ADRs for social authentication integration
- Performance monitoring and analytics integration 