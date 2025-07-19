# ADR-030: Complete Application Rebranding to NeuralLift

## Status
Implemented

## Context
The fitness tracking application was previously branded as "FitTrackAI" and "Fitness Tracker V2" across various parts of the codebase. To establish a stronger, more focused brand identity, we decided to rebrand the entire application to "NeuralLift" with the new domain neurallift.ai.

This rebranding reflects the application's focus on AI-powered strength training optimization and neural adaptation principles in fitness programming.

## Decision
We will completely rebrand the application from "FitTrackAI"/"Fitness Tracker V2" to "NeuralLift" across all:

1. **Application metadata and configuration**
2. **User-facing content and UI elements**  
3. **Backend systems and AI prompts**
4. **Documentation and development resources**
5. **Storage keys and client identifiers**

### New Brand Identity
- **Brand Name**: NeuralLift
- **Domain**: neurallift.ai
- **Tagline Focus**: AI-powered strength training and progress optimization
- **Package Name**: neurallift
- **Client Identifier**: neurallift

## Implementation Details

### Core Application Changes
- Updated `package.json` name from "fitness-tracker-v2" to "neurallift"
- Modified app metadata in `layout.tsx` and `metadata.ts` for SEO and branding
- Updated Supabase client identifier from "fitness-tracker-v2" to "neurallift"

### User-Facing Content Updates
- Replaced all instances of "FitTrackAI" and "FitnessTracker" in landing pages
- Updated testimonials to reference "NeuralLift"
- Modified authentication pages (login/signup) branding
- Enhanced messaging to focus on AI-powered strength training

### Backend System Updates  
- Updated AI coach system prompts to reference "NeuralLift"
- Changed Strava token storage key from "fitness_tracker_strava_tokens" to "neurallift_strava_tokens"
- Modified client headers and internal references

### Documentation Updates
- Updated main README.md title and setup instructions
- Modified database setup documentation
- Updated relevant implementation plans and ADRs
- Enhanced code comments with new brand references

## Consequences

### Positive
- **Stronger Brand Identity**: "NeuralLift" better communicates the AI-driven strength focus
- **Improved SEO**: neurallift.ai domain is more memorable and brandable
- **Consistent Messaging**: Unified branding across all touchpoints
- **Future-Proofed**: Brand scales with product vision of neural optimization

### Considerations
- **User Impact**: Existing users will need to reconnect Strava due to storage key changes
- **External Services**: Strava app registration and other integrations may need updates
- **Domain Migration**: SEO impact during domain transition period
- **Session Management**: Some users may need to re-authenticate

### Technical Risks Mitigated
- **Supabase Configuration**: Did not modify `supabase/config.toml` project_id to maintain database connectivity
- **Backward Compatibility**: Maintained all existing functionality during rebranding

## Monitoring and Validation

### Success Metrics
- [ ] All application pages display "NeuralLift" branding correctly
- [ ] Authentication flows work without breaking
- [ ] Supabase connection remains stable
- [ ] AI coach system references new brand name
- [ ] Documentation accurately reflects new brand

### Post-Implementation Tasks
- [ ] Update domain DNS to neurallift.ai
- [ ] Update external service registrations (Strava, analytics, etc.)
- [ ] Monitor for any broken references or authentication issues
- [ ] Update CI/CD configurations if needed
- [ ] Consider implementing redirects from old domain

## Related ADRs
- This rebranding maintains all existing architectural decisions
- No changes to core database schema or API structure
- Existing testing strategy (ADR-011) remains applicable

## Date
January 2025 