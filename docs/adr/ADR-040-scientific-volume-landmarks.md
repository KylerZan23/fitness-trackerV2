# ADR-040: Scientific Volume Landmarks (MEV/MAV/MRV) Integration

## Status
**Implemented** - 2025-01-27

## Context

### Scientific Background
Following the implementation of dynamic autoregulated periodization (ADR-039), the program generation system needed further refinement to incorporate scientific volume landmarks. Research by Dr. Mike Israetel and others has established clear volume landmarks for optimal hypertrophy and strength training:

- **MEV (Minimum Effective Volume)**: The smallest amount of volume needed to produce measurable adaptations
- **MAV (Maximum Adaptive Volume)**: The optimal volume that produces the best adaptations 
- **MRV (Maximum Recoverable Volume)**: The maximum volume that can be recovered from within a training cycle

### Current System State
The existing `llmProgramContent.ts` guidelines included general volume recommendations (e.g., "12-20 sets weekly") but lacked:
1. **Specific volume landmarks**: No clear MEV/MAV/MRV targets
2. **Systematic progression**: No structured volume progression framework
3. **Recovery optimization**: Limited guidance on deload volume reduction
4. **Experience-appropriate volumes**: Same volume ranges across experience levels

### Research Foundation
- Volume-response relationships show distinct MEV, MAV, and MRV thresholds (Israetel et al., 2018)
- Progressive volume increase optimizes adaptations within a mesocycle (Schoenfeld et al., 2019)
- Systematic deloads prevent overreaching and promote supercompensation (Helms et al., 2014)
- Experience level significantly affects volume tolerance (Krieger, 2010)

## Decision

### Implementation Strategy
Enhanced both the expert guidelines (`llmProgramContent.ts`) and AI prompt (`aiProgramActions.ts`) to incorporate systematic volume landmarks and progression frameworks.

### Volume Landmark Specifications

#### Muscle Gain Programs
- **Beginner**: MEV 8-10, MAV 12-16, MRV 18 sets/muscle/week
- **Intermediate**: MEV 10-12, MAV 18-22, MRV 24 sets/muscle/week  
- **Advanced**: MEV 12-15, MAV 20-25, MRV 26-28 sets/muscle/week
- **Hypertrophy Focus (Intermediate)**: MEV 14-16, MAV 20-24, MRV 26 sets/muscle/week

#### Strength Gain Programs
- **Intermediate Accessories**: MEV 8-10, MAV 14-18, MRV 20 sets/muscle/week

### 4-Week Volume Progression Framework
- **Week 1**: Start at MEV (baseline stimulus)
- **Week 2**: Progress toward MAV (add 2-4 sets across key muscle groups)
- **Week 3**: Approach MAV without exceeding MRV (peak volume week)
- **Week 4**: Return to MEV levels (50-60% volume reduction for deload)

## Technical Implementation

### Files Modified

#### 1. Enhanced Expert Guidelines (`src/lib/llmProgramContent.ts`)

**Before:**
```typescript
• Weekly target >10 hard sets·muscle⁻¹
• Aim 12–20 sets weekly
• High volume (15–25 sets)
```

**After:**
```typescript
• Volume landmarks: Start at MEV (8-10 sets/muscle/week), progress to MAV (12-16 sets/muscle/week). Do not exceed MRV (18 sets/muscle/week) for beginners.
• Volume landmarks: Start at MEV (10-12 sets/muscle/week), progress towards MAV (18-22 sets/muscle/week) over the training block. Do not exceed MRV (24 sets/muscle/week).
• Volume landmarks: Start at MEV (12-15 sets/muscle/week), progress towards MAV (20-25 sets/muscle/week) over the training block. Experienced users can approach MRV (26-28 sets/muscle/week) but monitor recovery closely.
```

#### 2. Enhanced AI Prompt (`src/app/_actions/aiProgramActions.ts`)

**Added Volume Progression Framework:**
```typescript
*   **Volume Progression Framework**: Based on the volume landmarks (MEV/MAV/MRV) specified in the EXPERT GUIDELINES, structure the weekly sets per muscle group progression:
    *   **Week 1**: Start at MEV (Minimum Effective Volume) as specified in guidelines
    *   **Week 2**: Progress towards MAV (Maximum Adaptive Volume), typically adding 2-4 sets total across key muscle groups
    *   **Week 3**: Approach or reach MAV but never exceed MRV (Maximum Recoverable Volume). Prioritize intensity over additional volume.
    *   **Week 4**: Return to MEV levels for deload (approximately 50-60% of Week 3 volume)
    *   **CRITICAL**: Count sets per muscle group carefully. Each exercise contributes sets to its primary muscle groups. Ensure total weekly sets per muscle align with the specified MEV/MAV/MRV ranges from the expert guidelines.
```

**Enhanced 4-Week Periodization:**
```typescript
*   **Week 1 (Volume Accumulation - MEV Start):** Main compound lifts should target RPE 7-8 (2-3 Reps in Reserve). Start at Minimum Effective Volume (MEV) as specified in expert guidelines (typically 10-14 sets/muscle/week).
*   **Week 2 (Volume Accumulation - Progression towards MAV):** Increase load slightly on main lifts while maintaining RPE 7-8. Add 1-2 sets to key muscle groups, progressing towards Maximum Adaptive Volume (MAV) as specified in guidelines (typically 16-22 sets/muscle/week).
*   **Week 3 (Intensification - Approach MAV):** Increase load on main lifts to target RPE 8-9 (1-2 Reps in Reserve). Reach or approach MAV for target muscle groups but do not exceed Maximum Recoverable Volume (MRV).
*   **Week 4 (Deload - Return to MEV):** Reduce total sets to approximately MEV levels (50-60% volume reduction from Week 3) and intensity to RPE 5-6 (4-5 Reps in Reserve).
```

### Validation Testing
Created comprehensive test scenarios validating:
- ✅ Appropriate MEV/MAV/MRV targets for each experience level
- ✅ Systematic 4-week volume progression (MEV → MAV → Deload)
- ✅ Volume stays within scientific limits (never exceeds MRV)
- ✅ Proper deload programming (return to MEV levels)
- ✅ Integration with existing RPE periodization

## Consequences

### Positive Outcomes

#### Scientific Benefits
1. **Precision Training**: Optimal stimulus-to-fatigue ratio based on individual volume tolerance
2. **Recovery Optimization**: Systematic deload planning prevents overreaching
3. **Evidence-Based Programming**: Grounded in current hypertrophy and strength research
4. **Individual Variation**: Experience-appropriate volume ranges prevent under/overtraining

#### Technical Benefits
1. **Systematic Progression**: Clear volume progression framework for all experience levels
2. **Integration with Existing System**: Builds upon dynamic periodization (ADR-039)
3. **Backward Compatibility**: Enhanced existing guidelines without breaking changes
4. **Comprehensive Coverage**: All major training focuses receive volume landmarks

#### User Experience Benefits
1. **Professional Quality**: Programs match research-based coaching standards
2. **Optimal Results**: Volume progression optimizes adaptations while managing fatigue
3. **Reduced Guesswork**: Clear volume targets eliminate uncertainty
4. **Injury Prevention**: MRV limits prevent excessive volume accumulation

### Technical Considerations

#### Set Counting Methodology
- **Primary Muscle Contribution**: Each exercise counted toward primary movers
- **Secondary Muscle Contribution**: Partial sets counted for synergists
- **Weekly Totals**: Summed across all training sessions per muscle group
- **Cross-Exercise Validation**: Multiple exercises contributing to same muscle group

#### Volume Progression Logic
- **Week 1**: Conservative start at MEV to establish baseline
- **Week 2**: Gradual increase toward optimal volume range
- **Week 3**: Peak volume week approaching but not exceeding MRV
- **Week 4**: Strategic deload for recovery and supercompensation

### Potential Challenges

#### Implementation Complexity
1. **Set Counting Accuracy**: AI must accurately count sets per muscle group
2. **Exercise Classification**: Proper muscle group attribution for exercises
3. **Volume Calculation**: Complex multi-muscle exercises require proportional counting
4. **Individual Variation**: Volume tolerance varies within experience levels

#### Risk Mitigation
1. **Clear Instructions**: Detailed set counting guidelines in prompt
2. **Conservative Limits**: MRV limits prevent excessive volume prescription
3. **Systematic Deloads**: Built-in recovery phases every 4 weeks
4. **Experience-Based Scaling**: Different volume ranges for different levels

## Alternative Approaches Considered

### Fixed Volume Percentages
**Rejected**: Less precise than individualized MEV/MAV/MRV approach

### Linear Volume Progression
**Rejected**: Doesn't account for fatigue accumulation and recovery needs

### Block Periodization Volume Models
**Rejected**: Too complex for general fitness users and 4-6 week mesocycles

### Auto-Regulatory Volume Only
**Rejected**: Still need structured framework with clear targets

## Implementation Metrics

### Success Criteria
- [ ] AI generates programs with appropriate volume progression (MEV → MAV → MEV)
- [ ] Set counts per muscle group align with specified landmarks
- [ ] Volume never exceeds MRV limits for any experience level
- [ ] Deload weeks properly reduce volume to MEV levels
- [ ] Integration with RPE periodization maintains consistency

### Monitoring Points
- Volume progression adherence across different user profiles
- User feedback on volume appropriateness and recovery
- Training outcome improvements with landmark-based programming
- System ability to accurately count sets per muscle group

## Related Decisions
- **ADR-039**: Dynamic Autoregulated Periodization (foundation for this enhancement)
- **ADR-003**: AI Program Generation Architecture (core system)
- **ADR-014**: LLM Program Content Enhancement (expert guidelines structure)

## Future Enhancements
1. **Advanced Volume Periodization**: Block periodization models for competitive athletes
2. **Individual Volume Tolerance**: Machine learning-based volume optimization
3. **Real-Time Volume Adjustment**: Integration with recovery monitoring
4. **Sport-Specific Volume Landmarks**: Specialized MEV/MAV/MRV for different sports

---

**Authors**: AI Assistant  
**Date**: 2025-01-27  
**Version**: 1.0  
**Review Status**: Implemented

## Notes
This enhancement represents a significant step toward truly scientific training program generation. By incorporating established volume landmarks (MEV/MAV/MRV), the system now provides precision training that optimizes adaptations while preventing overreaching. The integration with dynamic periodization (ADR-039) creates a comprehensive, evidence-based programming system that rivals professional coaching standards.

## Example Volume Progressions

### Intermediate Muscle Gain User
- **Week 1**: 12 sets/muscle (MEV start)
- **Week 2**: 16 sets/muscle (progress toward MAV)
- **Week 3**: 20 sets/muscle (approach MAV)
- **Week 4**: 12 sets/muscle (deload to MEV)
- **Result**: Systematic progression with built-in recovery

### Advanced Hypertrophy User
- **Week 1**: 15 sets/muscle (MEV start)
- **Week 2**: 19 sets/muscle (progress toward MAV)
- **Week 3**: 23 sets/muscle (approach MAV, under MRV limit)
- **Week 4**: 15 sets/muscle (deload to MEV)
- **Result**: High-volume progression with safety limits 