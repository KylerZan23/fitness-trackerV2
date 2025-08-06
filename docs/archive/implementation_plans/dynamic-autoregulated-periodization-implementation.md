# Dynamic Autoregulated Periodization Implementation Plan

## Scientific Rationale

While the current `llmProgramContent.ts` guidelines mention periodization, the core program generation prompt can be enhanced to dynamically structure the entire mesocycle (the 4-6 week training block) with principles of autoregulation. For non-beginners, simply increasing weight linearly each week is suboptimal. Modern programming uses autoregulation via RPE (Rate of Perceived Exertion) or RIR (Reps in Reserve) to adjust daily intensity based on the athlete's readiness, leading to more consistent long-term progress.

## Current State Analysis

### Existing RPE/RIR Usage
- **ExerciseDetail interface**: Already includes `rpe?: number` field (1-10 scale)
- **Weight prescription**: Basic RPE guidance exists for exercises without 1RM data
- **Daily adaptation**: `getDailyAdaptedWorkout` function includes RPE adjustment logic
- **Expert guidelines**: Many guidelines in `llmProgramContent.ts` already mention RPE targets (7-8, 8-9, etc.)

### User Experience Level Determination
The system uses `experienceLevel` from user profiles with three categories:
- **Beginner**: Uses `BEGINNER_GUIDELINES` (typically <6 months experience)
- **Intermediate**: Uses `INTERMEDIATE_GUIDELINES` (6-24 months experience)  
- **Advanced**: Uses `ADVANCED_GUIDELINES` (24+ months experience)

### Current Periodization Limitations
1. **Linear progression focus**: Heavy emphasis on percentage-based loading
2. **Lack of systematic mesocycle structure**: No explicit week-to-week periodization strategy
3. **Missing autoregulation instructions**: Limited guidance on RPE-based adaptations
4. **No deload timing**: Insufficient systematic recovery planning

## Implementation Strategy

### Enhancement Areas

#### 1. **4-Week Undulating Periodization Model** (for Intermediate/Advanced)
- **Week 1 (Volume Accumulation)**: RPE 7-8 (2-3 RIR), higher volume
- **Week 2 (Volume Accumulation)**: RPE 7-8, slight load increase, additional sets
- **Week 3 (Intensification)**: RPE 8-9 (1-2 RIR), reduced accessory volume
- **Week 4 (Deload)**: RPE 5-6 (4-5 RIR), 40-50% volume reduction

#### 2. **Linear Progression Model** (for Beginners)
- Consistent set/rep schemes
- Simple weight increases (2.5kg/5lbs per week)
- Focus on technique mastery
- Conservative RPE targets (6-7)

#### 3. **Enhanced Weight Prescription**
- Systematic RPE guidance for all exercises
- Clear RIR instructions for autoregulation
- Exercise-specific RPE targets
- Progressive intensity guidelines

## Technical Implementation

### Files to Modify
1. **`src/app/_actions/aiProgramActions.ts`**: Enhance `constructLLMPrompt` function
2. **Documentation**: Create ADR for the enhancement

### Code Changes

#### Enhanced Prompt Instructions
Add specific periodization model instructions based on user experience level:
- Beginner: Linear progression with conservative RPE
- Intermediate/Advanced: 4-week undulating model with autoregulation

#### Weight Prescription Enhancement
- All exercises get RPE guidance when 1RM unavailable
- Clear RIR instructions for progression
- Exercise-specific intensity recommendations

## Expected Outcomes

### Performance Benefits
1. **Better progression**: Autoregulation prevents overreaching and undertraining
2. **Improved adherence**: RPE-based training is more intuitive and sustainable
3. **Reduced injury risk**: Built-in recovery and load management
4. **Enhanced results**: Systematic periodization optimizes adaptations

### User Experience Benefits
1. **More scientific approach**: Evidence-based periodization models
2. **Better progression tracking**: Clear RPE targets for each workout
3. **Adaptive training**: Programs that respond to user readiness
4. **Professional-level programming**: Matches commercial coaching standards

## Success Metrics

### Technical Validation
- [ ] Enhanced prompt generates valid JSON with RPE fields populated
- [ ] Different experience levels receive appropriate periodization models
- [ ] Weight prescriptions include systematic RPE guidance
- [ ] Programs show clear week-to-week progression strategies

### User Experience Validation  
- [ ] Intermediate/Advanced users receive undulating periodization
- [ ] Beginner users receive linear progression model
- [ ] All exercises have appropriate RPE/RIR guidance
- [ ] Deload weeks are systematically programmed

## Risk Mitigation

### Potential Issues
1. **Prompt complexity**: Enhanced instructions may increase token usage
2. **LLM understanding**: Model may not correctly interpret periodization instructions
3. **User confusion**: RPE concepts may be unclear to beginners

### Mitigation Strategies
1. **Structured instructions**: Clear, hierarchical prompt organization
2. **Experience-based guidance**: Different instructions for different levels
3. **Educational notes**: Include RPE explanations in program notes

## Timeline

1. **Phase 1**: Analyze current prompt structure ✅
2. **Phase 2**: Implement enhanced periodization instructions
3. **Phase 3**: Test with different user profiles
4. **Phase 4**: Create documentation (ADR)

## Confidence Assessment

**Implementation Confidence: 9/10**
- Clear understanding of current system architecture
- Well-defined scientific rationale
- Existing RPE infrastructure in place
- Systematic approach to enhancement 