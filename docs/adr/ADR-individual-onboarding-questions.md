# ADR: Individual Question-Based Onboarding Experience

**Date:** 2024-12-19  
**Status:** Proposed  
**Decision Makers:** Development Team  
**Impact:** High - Complete UX restructure of onboarding flow

## Context

The current onboarding system groups multiple questions into 3 steps, which can feel overwhelming and less engaging for users. To improve user engagement and create a more personalized experience, we want to implement an individual question-based onboarding where each question gets its own dedicated page.

## Decision

We will restructure the onboarding experience to present one question per page, creating a more engaging, progressive disclosure experience that feels more like a conversation than a form.

## Architecture Overview

### Current State
- 3 steps with multiple questions per step
- Form validation per step
- Static progress tracking
- Grouped question validation

### Target State
- 15+ individual question pages
- Per-question validation and state management
- Dynamic progress tracking with conditional questions
- Engaging, conversational UI design

## Implementation Plan

### Phase 1: Core Architecture (Week 1)

#### 1.1 Create Question Framework
```typescript
// Question interface definition
interface Question {
  id: string
  title: string
  description?: string
  component: React.ComponentType<QuestionProps>
  validation: z.ZodSchema
  isOptional?: boolean
  shouldShow?: (answers: Partial<OnboardingFormData>) => boolean
  category: 'profile' | 'training' | 'strength' | 'preferences'
  order: number
}

// Question component props
interface QuestionProps {
  value: any
  onChange: (value: any) => void
  error?: string
  profile?: UserProfile
}
```

#### 1.2 Question Registry System
```typescript
// Central registry of all questions
export const ONBOARDING_QUESTIONS: Question[] = [
  {
    id: 'primaryGoal',
    title: "What's your main fitness goal? 🎯",
    description: "This helps us tailor your entire program",
    component: PrimaryGoalQuestion,
    validation: z.enum(['Muscle Gain', 'Strength Gain', 'Endurance Improvement', 'Sport-Specific', 'General Fitness']),
    category: 'profile',
    order: 1
  },
  // ... more questions
]
```

#### 1.3 Question Flow Engine
```typescript
export class OnboardingFlowEngine {
  private questions: Question[]
  private answers: Partial<OnboardingFormData>
  
  getNextQuestion(): Question | null
  getPreviousQuestion(): Question | null
  shouldShowQuestion(question: Question): boolean
  calculateProgress(): { current: number; total: number; percentage: number }
  getQuestionsToShow(): Question[]
}
```

### Phase 2: Individual Question Components (Week 1-2)

#### 2.1 Question Components Structure
```
src/components/onboarding/questions/
├── BaseQuestionLayout.tsx       # Common layout wrapper
├── PrimaryGoalQuestion.tsx      # "What's your main fitness goal?"
├── SecondaryGoalQuestion.tsx    # "Any secondary goals?"
├── SportDetailsQuestion.tsx     # "What sport?" (conditional)
├── TrainingFocusQuestion.tsx    # "What's your training style?"
├── ExperienceLevelQuestion.tsx  # "What's your experience level?"
├── TrainingFrequencyQuestion.tsx # "How many days per week?"
├── SessionDurationQuestion.tsx  # "How long per session?"
├── EquipmentAccessQuestion.tsx  # "What equipment do you have?"
├── SquatStrengthQuestion.tsx    # "Squat 1RM estimate?"
├── BenchStrengthQuestion.tsx    # "Bench press 1RM?"
├── DeadliftStrengthQuestion.tsx # "Deadlift 1RM?"
├── OHPStrengthQuestion.tsx      # "Overhead press 1RM?"
├── StrengthAssessmentQuestion.tsx # "How did you determine these?"
├── ExercisePreferencesQuestion.tsx # "Exercise preferences?"
└── InjuriesQuestion.tsx         # "Any injuries/limitations?"
```

#### 2.2 Base Question Layout
```typescript
interface BaseQuestionLayoutProps {
  title: string
  description?: string
  children: React.ReactNode
  progress: { current: number; total: number; percentage: number }
  onNext: () => void
  onPrevious: () => void
  onSkip?: () => void
  canGoNext: boolean
  canGoPrevious: boolean
  isOptional?: boolean
}

export function BaseQuestionLayout({ ... }: BaseQuestionLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full max-w-2xl px-4">
        {/* Progress indicator */}
        <div className="mb-8">
          <CircularProgress percentage={progress.percentage} />
          <p className="text-center text-sm text-gray-600 mt-2">
            Question {progress.current} of {progress.total}
          </p>
        </div>
        
        {/* Question card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl mb-2">{title}</CardTitle>
            {description && (
              <CardDescription className="text-lg">{description}</CardDescription>
            )}
          </CardHeader>
          
          <CardContent className="pb-8">
            {children}
          </CardContent>
          
          <CardFooter className="flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={onPrevious} disabled={!canGoPrevious}>
              Previous
            </Button>
            
            <div className="flex gap-3">
              {isOptional && (
                <Button variant="ghost" onClick={onSkip}>
                  Skip
                </Button>
              )}
              <Button onClick={onNext} disabled={!canGoNext}>
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
```

### Phase 3: Enhanced UX Features (Week 2)

#### 3.1 Conditional Question Logic
```typescript
// Example conditional logic
const QUESTION_CONDITIONS: Record<string, (answers: Partial<OnboardingFormData>) => boolean> = {
  secondaryGoal: (answers) => !!answers.primaryGoal,
  sportDetails: (answers) => answers.primaryGoal === 'Sport-Specific' || answers.secondaryGoal === 'Sport-Specific',
  strengthAssessment: (answers) => 
    !!(answers.squat1RMEstimate || answers.benchPress1RMEstimate || 
       answers.deadlift1RMEstimate || answers.overheadPress1RMEstimate)
}
```

#### 3.2 Smart Progress Tracking
```typescript
export function calculateDynamicProgress(
  answers: Partial<OnboardingFormData>,
  allQuestions: Question[]
): ProgressInfo {
  const questionsToShow = allQuestions.filter(q => 
    q.shouldShow ? q.shouldShow(answers) : true
  )
  
  const answeredQuestions = questionsToShow.filter(q => 
    answers[q.id] !== undefined && answers[q.id] !== null
  )
  
  return {
    current: answeredQuestions.length,
    total: questionsToShow.length,
    percentage: Math.round((answeredQuestions.length / questionsToShow.length) * 100)
  }
}
```

#### 3.3 Enhanced Visual Components
```typescript
// Circular progress component
export function CircularProgress({ percentage }: { percentage: number }) {
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={`${2 * Math.PI * 40}`}
          strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
          className="text-indigo-600 transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold text-gray-700">{percentage}%</span>
      </div>
    </div>
  )
}
```

### Phase 4: Advanced Features (Week 3)

#### 4.1 Question Animations
- Smooth slide transitions between questions
- Fade in/out effects
- Progress bar animations

#### 4.2 State Persistence
```typescript
// Auto-save progress to localStorage/database
export function useOnboardingPersistence() {
  const [answers, setAnswers] = useState<Partial<OnboardingFormData>>({})
  
  // Save to localStorage on each answer
  useEffect(() => {
    localStorage.setItem('onboarding-progress', JSON.stringify(answers))
  }, [answers])
  
  // Optionally save to database every few questions
  useEffect(() => {
    const saveToDatabase = debounce(async (data) => {
      await savePartialOnboardingData(data)
    }, 2000)
    
    saveToDatabase(answers)
  }, [answers])
}
```

#### 4.3 Review & Summary Page
```typescript
export function OnboardingReviewPage({ answers }: { answers: OnboardingFormData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Review Your Responses</h2>
      
      {Object.entries(QUESTION_CATEGORIES).map(([category, questions]) => (
        <div key={category} className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3 capitalize">{category}</h3>
          {questions.map(question => (
            <div key={question.id} className="flex justify-between items-center py-2">
              <span className="text-gray-700">{question.title}</span>
              <Button variant="ghost" size="sm" onClick={() => editQuestion(question.id)}>
                Edit
              </Button>
            </div>
          ))}
        </div>
      ))}
      
      <Button onClick={generateProgram} className="w-full bg-indigo-600 hover:bg-indigo-700">
        Generate My Training Program
      </Button>
    </div>
  )
}
```

## File Structure Changes

### New Files to Create
```
src/components/onboarding/
├── questions/                    # Individual question components
├── OnboardingFlowEngine.ts      # Question flow logic
├── QuestionRegistry.ts          # Central question definitions
├── hooks/
│   ├── useOnboardingFlow.ts     # Flow management hook
│   └── useOnboardingPersistence.ts # State persistence
└── types/
    └── onboarding-flow.ts       # Flow-specific types
```

### Files to Modify
- `src/app/onboarding/page.tsx` - Complete restructure to use new flow engine
- `src/lib/types/onboarding.ts` - Add flow-related types
- `src/app/_actions/onboardingActions.ts` - Handle partial data saves

## Benefits

1. **Improved User Engagement** - Single question focus reduces cognitive load
2. **Better Completion Rates** - Progressive disclosure encourages completion
3. **Enhanced Personalization** - More conversational, tailored experience
4. **Flexible Question Flow** - Easy to add/remove/reorder questions
5. **Better Analytics** - Track where users drop off in the flow
6. **Mobile-First Design** - Better mobile experience with focused questions

## Risks & Mitigation

### Risk: Increased Development Complexity
**Mitigation:** Modular component architecture with reusable base components

### Risk: Performance with Many Components
**Mitigation:** Lazy loading of question components, efficient state management

### Risk: User Drop-off with More Steps
**Mitigation:** Smart skip options, progress persistence, engaging UX design

## Success Metrics

- **Completion Rate:** Target 85%+ completion (vs current baseline)
- **Time to Complete:** Target 3-5 minutes for full onboarding
- **User Satisfaction:** Post-onboarding survey scores
- **Drop-off Analysis:** Identify which questions cause abandonment

## Dependencies

- React Hook Form (existing)
- Zod validation (existing)
- UI components (existing)
- Animation library (new - framer-motion or similar)

## Timeline

- **Week 1:** Core architecture and question framework
- **Week 2:** Individual question components and basic flow
- **Week 3:** Enhanced UX features and animations
- **Week 4:** Testing, optimization, and deployment

## Conclusion

This architecture provides a scalable, maintainable solution for creating an engaging, personalized onboarding experience that can significantly improve user engagement and program personalization quality. 