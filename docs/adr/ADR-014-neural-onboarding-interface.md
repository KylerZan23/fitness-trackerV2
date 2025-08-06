# ADR-014: Neural Onboarding Interface

## Status
Accepted

## Context
The existing complex onboarding system with conditional logic and multiple question types was being replaced by the simplified Neural type system. We needed a modern, engaging interface that would collect the required data for Neural program generation while providing a significantly better user experience than the previous system.

## Decision

### Components Implemented

#### 1. NeuralProgressIndicator
- **Purpose**: Visual progress tracking with Neural branding
- **Features**:
  - Clean progress bar with blue-to-purple gradient
  - Step indicators with completion states
  - Neural branding with Brain icon and brand colors
  - Responsive design for all screen sizes
  - Progress statistics and completion percentage

#### 2. NeuralQuestionCard  
- **Purpose**: Reusable question component for all input types
- **Features**:
  - Multiple input types: single-select, multi-select, number, text
  - Accessible design with keyboard navigation
  - Professional styling with hover effects and validation states
  - Built-in error display and help text
  - Auto-focus and smooth animations

#### 3. NeuralOnboardingFlow
- **Purpose**: Main orchestrator for the onboarding experience
- **Features**:
  - Multi-step flow with state management
  - Form validation with Zod schemas
  - Session persistence via localStorage
  - Integration with Neural API
  - Modern UI with engaging animations

#### 4. API Integration
- **Endpoints**:
  - `POST /api/neural/generate-program` - Creates Neural programs
  - `GET/PATCH /api/users/[userId]/onboarding-status` - Status management
- **Features**:
  - User authentication and authorization
  - Error handling with user-friendly messages
  - Database persistence of responses and metadata

### Technical Architecture

#### Data Flow
1. User progresses through onboarding steps
2. Responses are validated and stored in component state
3. State is persisted to localStorage for session recovery
4. On completion, data is sent to Neural API
5. Generated program is stored in database
6. User profile is updated with completion status

#### Type Safety
- Zod schemas for runtime validation
- TypeScript interfaces for compile-time safety
- Union types for enum-like options
- Optional fields for personal records

#### State Management
- React hooks (useState, useCallback, useEffect)
- Local state for form data and errors
- Persistent state via localStorage
- Loading and submission states

### User Experience Improvements

#### Simplified Flow
- Reduced from complex conditional logic to 5 clear steps
- Each step focuses on one key aspect
- Optional strength assessment step
- Clear progress indication

#### Modern Interface
- Neural branding with blue-purple gradients
- Card-based layouts with shadows and animations
- Responsive design for mobile and desktop
- Accessibility features with proper ARIA labels

#### Engagement Features
- Emoji icons for visual appeal
- Smooth animations and transitions
- Immediate validation feedback
- Progress persistence across sessions

## Consequences

### Positive
- **Significantly more engaging** than previous system
- **Simplified data collection** aligned with Neural requirements
- **Modern UI** that matches Neural branding
- **Accessible design** following WCAG guidelines
- **Mobile responsive** for all devices
- **Type-safe** with comprehensive validation
- **Extensible** for future question types

### Considerations
- **New dependency** on Neural API service
- **localStorage usage** for session persistence
- **Additional API endpoints** for status management
- **Migration** from existing onboarding system required

## Implementation Details

### Component Structure
```
src/components/onboarding/
├── NeuralProgressIndicator.tsx    # Progress tracking
├── NeuralQuestionCard.tsx         # Reusable question component  
└── NeuralOnboardingFlow.tsx       # Main orchestrator
```

### API Structure
```
src/app/api/
├── neural/generate-program/       # Neural program generation
└── users/[userId]/onboarding-status/  # Status management
```

### Type Definitions
- Neural types in `src/types/neural.ts`
- Component props with comprehensive TypeScript
- Zod schemas for validation

### Integration Points
- Neural API service for program generation
- Supabase for user authentication and data storage
- localStorage for session persistence
- Existing profile system for completion tracking

## Alternatives Considered

### 1. Extend Existing System
- **Rejected**: Too complex and not aligned with Neural simplification goals
- Would require maintaining conditional logic and deep nesting

### 2. Simple Form-Based Approach
- **Rejected**: Not engaging enough compared to step-by-step flow
- Worse user experience on mobile devices

### 3. Wizard Component Library
- **Rejected**: Would add external dependency and reduce customization
- Neural branding requirements need custom implementation

## Success Metrics

### Technical Metrics
- [ ] Component render performance under 100ms
- [ ] API response times under 2 seconds
- [ ] Zero accessibility violations in audit
- [ ] Mobile responsiveness on all major devices

### User Experience Metrics  
- [ ] Increased completion rates vs old onboarding
- [ ] Reduced support tickets related to onboarding
- [ ] Positive user feedback on interface design
- [ ] Successful Neural program generation rates

### Integration Metrics
- [ ] Seamless data flow to Neural API
- [ ] Proper error handling and recovery
- [ ] Session persistence working correctly
- [ ] Database updates completing successfully

## Future Considerations

### Potential Enhancements
1. **Animation Library**: Framer Motion for enhanced animations
2. **Multi-language Support**: i18n for international users
3. **Advanced Validation**: Real-time validation during typing
4. **Progressive Web App**: Offline capability for onboarding
5. **Analytics Integration**: Detailed funnel analysis

### Monitoring & Maintenance
1. **Performance Monitoring**: Track component render times
2. **Error Tracking**: Monitor API failures and validation errors
3. **User Journey Analytics**: Understand drop-off points
4. **A/B Testing**: Test different question orderings and designs

## Related ADRs
- ADR-007: Strava API Integration
- ADR-013: Specialized Fitness Goals Expansion
- Neural Type System Architecture (Neural services)

## Implementation Timeline
- **Week 1**: Component development and basic functionality
- **Week 2**: API integration and error handling
- **Week 3**: Polish, accessibility, and mobile optimization
- **Week 4**: Testing, documentation, and deployment

---

**Authors**: AI Development Team  
**Date**: 2024-01-15  
**Reviewers**: Product Team, UX Team
