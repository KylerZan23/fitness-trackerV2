# Neural Onboarding Interface Implementation Plan

## Overview
Build a modern, engaging Coach Neural onboarding interface to replace the removed program generation functionality with a simplified, AI-powered approach.

## Analysis of Requirements

### Existing System Understanding
- Current onboarding uses complex question flow with conditional logic
- Questions cover: primaryGoal, experienceLevel, sessionDuration, equipment, personal records
- Current system uses QuestionRegistry.ts with validation schemas
- Existing hooks: useOnboardingFlow, useOnboardingValidation, useProgressPersistence

### Neural Type System
- Simplified onboarding data structure (src/types/neural.ts)
- Required fields: primaryFocus, experienceLevel, sessionDuration, equipmentAccess
- Optional: personalRecords, additionalInfo
- Integration with Neural API service for program generation

### Design Requirements
- Multi-step onboarding with progress indicator
- Modern, engaging UI with Neural branding
- Form validation and state management
- Accessible design with proper focus management
- Professional styling with Neural color scheme

## Component Architecture

### 1. NeuralProgressIndicator.tsx
**Purpose**: Visual progress through onboarding steps
**Features**:
- Clean progress bar with step indicators
- Neural branding colors (primary blue gradient)
- Step names and completion states
- Responsive design

### 2. NeuralQuestionCard.tsx
**Purpose**: Reusable question component
**Features**:
- Support for single-select, multi-select, number inputs
- Consistent styling across question types
- Built-in validation display
- Accessible keyboard navigation
- Professional card-based layout

### 3. NeuralOnboardingFlow.tsx
**Purpose**: Main orchestrator component
**Features**:
- State management for form data
- Progress tracking
- Integration with Neural program generation
- Modern, engaging animations
- Error handling and loading states

## Technical Implementation

### Data Structure Mapping
```typescript
// Current complex schema → Neural simplified schema
primaryGoal → primaryFocus: 'hypertrophy' | 'strength' | 'general_fitness'
experienceLevel → experienceLevel: 'beginner' | 'intermediate' | 'advanced'
sessionDuration → sessionDuration: 30 | 45 | 60 | 90
equipment → equipmentAccess: 'full_gym' | 'dumbbells_only' | 'bodyweight_only'
strength questions → personalRecords: { squat?, bench?, deadlift? }
```

### State Management
- React hooks (useState, useReducer)
- Form validation with Zod schemas
- Progress persistence to localStorage
- Integration with Neural API

### Styling Approach
- Tailwind CSS with Neural brand colors
- Gradient backgrounds and modern shadows
- Smooth animations with Framer Motion
- Responsive design patterns
- Accessibility-first approach

## Implementation Steps

1. **Create NeuralProgressIndicator** ✅
   - Progress bar with Neural branding
   - Step indicators and completion states
   - Responsive layout

2. **Create NeuralQuestionCard** ✅
   - Reusable question component
   - Multiple input type support
   - Validation and error display
   - Accessible design

3. **Create NeuralOnboardingFlow** ✅
   - Main flow orchestrator
   - State management and validation
   - Neural API integration
   - Modern UI with animations

4. **Integration & Testing** ✅
   - Test all question types
   - Validate Neural API integration
   - Accessibility testing
   - Mobile responsiveness

5. **Documentation Updates** ✅
   - Update README with new capabilities
   - Create ADR for Neural onboarding
   - Update component documentation

## Neural Branding Guidelines

### Colors
- Primary: Blue gradient (#3B82F6 to #6366F1)
- Secondary: Purple accent (#8B5CF6)
- Success: Green (#10B981)
- Background: Clean whites and light grays

### Typography
- Font: Inter (existing system font)
- Headers: font-bold, proper hierarchy
- Body: font-medium for readability

### Components
- Card-based layouts with subtle shadows
- Rounded corners (rounded-lg, rounded-xl)
- Gradient backgrounds for key elements
- Brain icon for Neural branding

## Success Criteria

- [ ] Significantly more engaging than previous system
- [ ] All question types properly supported
- [ ] Neural API integration working
- [ ] Accessible design (WCAG 2.1 AA)
- [ ] Mobile responsive
- [ ] Proper error handling
- [ ] Loading states and animations
- [ ] Form persistence across sessions

## Assumptions & Uncertainties

### Assumptions
- Neural API is stable and available
- Existing authentication system will handle user identification
- Users prefer simplified onboarding over complex questionnaire
- Neural branding should follow existing design patterns

### Uncertainties to Clarify
- Specific animation preferences for transitions
- Exact Neural logo/icon requirements
- Integration points with existing onboarding system
- Migration strategy from old to new onboarding

## Next Steps After Implementation

1. A/B testing against existing onboarding
2. User feedback collection
3. Performance metrics tracking
4. Iteration based on usage patterns
5. Integration with broader Neural ecosystem
