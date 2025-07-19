# NeuralLift Rebranding Implementation Plan

## Overview
Complete rebranding of the fitness tracking application from "FitTrackAI" / "Fitness Tracker V2" to "NeuralLift" with new domain neurallift.ai.

## Scope of Changes

### 1. Core Application Files
- [ ] `package.json` - Update app name from "fitness-tracker-v2" to "neurallift"
- [ ] `src/app/layout.tsx` - Update title and description metadata
- [ ] `src/app/metadata.ts` - Update default metadata title
- [ ] `src/lib/supabase.ts` - Update client info header from "fitness-tracker-v2" to "neurallift"

### 2. User-Facing Content
- [ ] `src/app/page.tsx` - Replace "FitTrackAI" with "NeuralLift" (2 instances)
- [ ] `src/components/landing/Testimonials.tsx` - Update testimonial quotes mentioning "FitTrackAI" 
- [ ] `src/app/login/page.tsx` - Replace "FitnessTracker" with "NeuralLift" (2 instances)
- [ ] `src/app/signup/page.tsx` - Replace "FitnessTracker" with "NeuralLift" (1 instance)

### 3. AI/Backend Systems
- [ ] `src/app/_actions/aiCoachActions.ts` - Update AI coach system prompt from "FitnessTracker V2" to "NeuralLift"
- [ ] `src/lib/strava/token-store.ts` - Update storage key from "fitness_tracker_strava_tokens" to "neurallift_strava_tokens"

### 4. Documentation
- [ ] `README.md` - Update main title from "FitnessTracker V2" to "NeuralLift"
- [ ] `README.md` - Update git clone instructions (if repo will be renamed)
- [ ] `src/utils/db/README.md` - Update app reference from "FitnessTracker" to "NeuralLift"
- [ ] `docs/adr/` files - Update relevant ADRs that reference the old name
- [ ] `docs/implementation_plans/` - Update active implementation plans
- [ ] `docs/archive/` - Consider updating or noting historical nature

### 5. Configuration Files
- [ ] `src/lib/units.ts` - Update comment referencing "fitness tracker application"
- [ ] **CAUTION**: `supabase/config.toml` project_id - Verify if this can be changed without breaking Supabase connection

## Brand Guidelines for NeuralLift

### Naming Conventions
- **Brand Name**: NeuralLift
- **Domain**: neurallift.ai  
- **Package Name**: neurallift
- **Client Identifier**: neurallift
- **Storage Keys**: neurallift_*

### Messaging Updates
- Replace "FitTrackAI" → "NeuralLift"
- Replace "FitnessTracker" → "NeuralLift"  
- Replace "Fitness Tracker V2" → "NeuralLift"
- Update taglines to focus on AI-powered strength and neural optimization
- Maintain focus on personalized AI coaching and strength training

## Implementation Phases

### Phase 1: Core Application (High Priority)
1. Package metadata and build configs
2. App metadata and titles
3. Main landing page branding
4. Authentication pages

### Phase 2: Backend Systems (Medium Priority)  
1. AI system prompts
2. Storage keys and client identifiers
3. API headers

### Phase 3: Documentation (Lower Priority)
1. README and setup docs
2. Current ADRs and implementation plans
3. Code comments and internal references

## Risk Considerations

1. **Supabase Configuration**: Changing project_id in supabase/config.toml could break database connection
2. **Strava Integration**: Updating storage keys will require users to reconnect Strava
3. **Search Engine Indexing**: Domain change will impact SEO
4. **User Sessions**: Some updates may require users to re-authenticate

## Post-Implementation Tasks

- [ ] Update domain DNS settings to neurallift.ai
- [ ] Update any external service registrations (Strava app, etc.)
- [ ] Test all authentication flows
- [ ] Verify Supabase connection remains intact
- [ ] Update any CI/CD configurations
- [ ] Consider redirect from old domain (if applicable)

## Dependencies
- Verify Supabase project configuration compatibility
- Coordinate with domain registrar for neurallift.ai setup
- Update any external API registrations 