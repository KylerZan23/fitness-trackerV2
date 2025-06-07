# ADR-002: AI Program Generation Personalization Enhancements

## Status
Accepted

## Date
2025-01-06

## Context
The AI training program generation system needed significant enhancements to improve user safety, personalization, and program quality. Users were receiving generic programs that didn't adequately account for their specific injuries, limitations, or preferences, and lacked detailed guidance on exercise execution.

## Decision
We enhanced the AI program generation system with three critical personalization features:

### 1. Mandatory Injury/Limitation & Preference Handling
- **Implementation**: Added explicit injury-aware exercise selection logic to the LLM prompt
- **Safety Focus**: AI must avoid exercises that could aggravate user-reported conditions
- **Substitution Logic**: Provides specific safer alternatives (e.g., knee pain → Leg Press vs Deep Squats)
- **Preference Compliance**: Enforces user exercise likes/dislikes in program selection

### 2. Detailed Exercise Notes/Form Cues
- **Implementation**: Enhanced `ExerciseDetail.notes` field population with mandatory form guidance
- **Compound Lift Focus**: All major lifts (Squat, Bench, Deadlift, Overhead Press) receive critical form cues
- **Experience-Level Adaptation**: Beginners receive more detailed safety reminders
- **Injury Context**: Notes when exercises are modified due to limitations

### 3. Program Rationale in generalAdvice
- **Implementation**: Enhanced `TrainingProgram.generalAdvice` with structured explanations
- **User Understanding**: 2-3 sentence explanation of program structure and reasoning
- **Goal Alignment**: Clear connection between user inputs and program design decisions

## Technical Implementation

### Architecture Decisions
- **Prompt Engineering Approach**: Enhanced existing LLM prompt rather than post-processing
- **Field Utilization**: Leveraged existing optional fields (`notes`, `generalAdvice`) to maintain backward compatibility
- **Data Source**: Used existing `OnboardingData` fields (`injuriesLimitations`, `exercisePreferences`)
- **Integration Point**: Modified `constructLLMPrompt` function in `aiProgramActions.ts`

### Safety Considerations
- **Conservative Approach**: Prioritizes user safety over program complexity
- **Explicit Examples**: Provides concrete injury-exercise avoidance examples to LLM
- **Beginner Protection**: Extra safety measures for inexperienced users
- **Clear Communication**: Users understand why modifications were made

## Consequences

### Positive
- **Improved Safety**: Significantly reduced risk of injury-aggravating recommendations
- **Enhanced Personalization**: Programs truly reflect individual user needs and limitations
- **Better User Experience**: Clear guidance and rationale increase user confidence and adherence
- **Backward Compatibility**: Changes are additive and don't break existing functionality
- **Scalable Architecture**: Prompt-based approach allows easy future enhancements

### Negative
- **Increased Prompt Complexity**: Longer prompts may increase LLM API costs
- **Dependency on User Input Quality**: Effectiveness relies on accurate user-reported injuries/preferences
- **Potential Over-Caution**: Conservative approach might limit program variety for some users

### Neutral
- **Token Usage**: Slight increase in prompt tokens, but offset by improved user outcomes
- **Maintenance**: Requires monitoring of injury-exercise relationships for accuracy

## Alternatives Considered

### 1. Post-Processing Approach
- **Rejected**: Would lose context and coherence that LLM provides
- **Issue**: Difficult to maintain exercise flow and program balance

### 2. Separate Injury Database
- **Rejected**: Added complexity without significant benefit
- **Issue**: Would require extensive medical expertise and maintenance

### 3. Rule-Based Exercise Filtering
- **Rejected**: Too rigid and couldn't adapt to nuanced user descriptions
- **Issue**: Limited ability to handle complex injury combinations

## Implementation Details

### Files Modified
- `src/app/_actions/aiProgramActions.ts` - Enhanced `constructLLMPrompt` function
- `README.md` - Updated with new capabilities
- `IMPLEMENTATION_PLAN_AI_PERSONALIZATION.md` - Detailed implementation documentation

### Key Code Changes
```typescript
// Added to constructLLMPrompt function
**Mandatory Injury/Limitation & Preference Handling**:
Based on the \`USER GOALS & PREFERENCES -> Injuries/Limitations\` field (verbatim: '${onboarding.injuriesLimitations || 'None specified'}') and \`USER GOALS & PREFERENCES -> Exercise Preferences\` field (verbatim: '${onboarding.exercisePreferences || 'None specified'}'):
- You MUST adapt exercise selection. IF specific injuries are mentioned (e.g., 'knee pain', 'shoulder impingement', 'lower back sensitivity'), AVOID exercises that typically aggravate these conditions.
- SUGGEST suitable, safer alternatives for the target muscle group...
```

### Testing Strategy
- Validate with various injury scenarios (knee, shoulder, back issues)
- Verify form cues appear for compound movements
- Confirm generalAdvice provides meaningful rationale
- Test with different experience levels and equipment combinations

## Future Considerations
- Monitor user feedback on injury accommodations
- Expand form cue database based on common user questions
- Add injury-specific progression protocols
- Implement feedback loop for program rationale effectiveness
- Consider integration with physiotherapy guidelines

## References
- Task Group I.A.1, I.B.1, I.B.2 requirements
- Exercise science literature on injury prevention
- User feedback on program personalization needs
- OpenAI GPT-4o-mini prompt engineering best practices 