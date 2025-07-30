# ADR-051: Enhanced Program Validation Schema

## Status
Accepted

## Context
The existing program validation in the application relied on basic Zod schemas that only validated structural integrity without ensuring adherence to evidence-based exercise science principles. As the AI program generation became more sophisticated with comprehensive scientific guidelines, we needed equally sophisticated validation to ensure generated programs respect volume landmarks, autoregulation protocols, weak point interventions, and other critical scientific constraints.

### Limitations of Previous Validation
- Basic structural validation only (required fields, data types)
- No enforcement of scientific principles (MEV/MAV/MRV compliance)
- Missing validation for autoregulation protocols and RPE progression
- No verification that identified weak points have appropriate interventions
- Lack of detailed error messages explaining violated scientific principles
- No comprehensive type safety for enhanced program structures

### Scientific Validation Requirements
- **Volume Landmark Compliance**: Ensure no muscle group exceeds calculated MRV
- **Autoregulation Protocol Validation**: Verify RPE targets are realistic and progressive
- **Weak Point Intervention Verification**: Confirm identified imbalances have interventions
- **Periodization Logic**: Validate phase progression follows scientific principles
- **Exercise Rationale**: Ensure exercises have scientific justification
- **Anchor Lift Requirements**: Validate mandatory anchor lifts on training days

## Decision
Implement a comprehensive enhanced program validation schema using Zod that enforces evidence-based exercise science principles while providing detailed error messages and type safety for the enhanced program structure.

### Core Components Implemented

#### 1. Enhanced Schema Structure

**ENHANCED_PROGRAM_VALIDATION**: Main validation schema including:
- Core program structure with enhanced fields
- Scientific rationale requirements
- Volume distribution tracking
- Autoregulation protocol validation
- Weak point intervention protocols
- Exercise rationale mapping

#### 2. Specialized Validation Schemas

**VolumeDistributionSchema**:
- Tracks weekly volume for each muscle group
- Validates percentage of MAV (0-120% maximum)
- Optional exercise breakdown tracking
- Prevents negative volume values

**AutoregulationProtocolSchema**:
- Phase-specific RPE targets (accumulation, intensification, realization, deload)
- Readiness adjustment guidelines for all scenarios
- Recovery marker and fatigue indicator requirements
- Custom validation ensuring logical RPE progression

**WeakPointInterventionSchema**:
- Specific target area enumeration
- Current vs target ratio validation
- Priority classification (High/Moderate/Low)
- Intervention exercise requirements
- Progression protocol definition
- Realistic reassessment periods (2-12 weeks)

**PhaseProgressionSchema**:
- Periodization model selection
- Primary adaptation and progression type
- Volume and intensity progression parameters
- Deload protocol specifications
- Scientific progression validation

#### 3. Enhanced Exercise and Program Structure

**EnhancedExerciseDetailSchema**:
- Anchor lift designation
- Tier classification (Tier_1, Tier_2, Tier_3)
- Muscle group targeting
- Weak point intervention mapping
- Stimulus-to-fatigue ratio classification
- Scientific rationale requirements

**Enhanced Workout and Phase Schemas**:
- Mandatory anchor lift validation on training days
- Session RPE targets and volume load tracking
- Coach tip requirements for enhanced programs
- Scientific rationale for each phase
- Primary adaptation and progression type specification

#### 4. Custom Validation Functions

**validateVolumeCompliance()**:
- Checks program against individual volume landmarks
- Ensures no muscle group exceeds MRV
- Validates minimum volume for primary muscle groups
- Provides specific violation messages with scientific context

**validateRPETargets()**:
- Verifies logical RPE progression across phases
- Ensures realistic RPE ranges (≤3 points)
- Validates deload RPE provides adequate recovery
- Checks target RPE falls within min-max ranges

**validateWeakPointAddressing()**:
- Confirms all identified weak points have interventions
- Validates intervention volume sufficiency
- Checks reassessment period appropriateness
- Ensures high-priority weak points receive adequate volume

**validateEnhancedProgram()**:
- Comprehensive validation combining all checks
- Separates schema errors from scientific violations
- Returns detailed feedback for program improvement

### Scientific Error Messages
Each validation function provides specific feedback about violated scientific principles:

```typescript
// Example error messages
"chest volume (28 sets) exceeds MRV (26 sets). This violates recovery capacity and may lead to overreaching."

"Accumulation RPE target cannot be higher than intensification phase. This violates progressive overload principles."

"No intervention found for identified weak point: WEAK_POSTERIOR_CHAIN. Each identified imbalance requires a specific corrective protocol."
```

## Consequences

### Positive
- **Scientific Accuracy**: All generated programs now validated against evidence-based principles
- **Type Safety**: Comprehensive TypeScript types for enhanced program structures
- **Educational Value**: Error messages teach scientific principles when violations occur
- **Quality Assurance**: Automatic detection of program generation issues
- **Developer Experience**: Clear validation feedback for debugging and improvement
- **User Safety**: Prevents programs that could lead to overtraining or imbalances

### Technical Benefits
- **Modular Design**: Individual schemas can be used independently
- **Extensible Framework**: Easy to add new validation rules as science evolves
- **Performance Optimized**: Efficient Zod validation with early termination
- **Integration Ready**: Seamless integration with existing program generation
- **Comprehensive Coverage**: Validates all aspects of enhanced program structure

### Considerations
- **Validation Complexity**: More sophisticated validation requires careful maintenance
- **Performance Impact**: Additional validation steps increase processing time
- **Error Handling**: More detailed error messages require proper UI handling
- **Schema Evolution**: Changes to validation require careful backward compatibility

## Implementation Details

### File Structure
```typescript
src/lib/validation/enhancedProgramSchema.ts
├── Core Schemas (ScientificRationale, VolumeDistribution, etc.)
├── Enhanced Program Structure (Exercise, Workout, Phase schemas)
├── Main ENHANCED_PROGRAM_VALIDATION schema
├── Custom Validation Functions
└── Type Exports and Interfaces
```

### Integration Points
- **AI Program Generation**: Validates LLM-generated programs before storage
- **Program Import/Export**: Ensures data integrity during program transfers
- **API Endpoints**: Server-side validation for program creation/updates
- **Development Tools**: Type safety for program manipulation functions

### Validation Workflow
1. **Schema Validation**: Basic structure and type checking
2. **Scientific Validation**: Volume, RPE, and weak point compliance
3. **Error Aggregation**: Collect all violations and errors
4. **Detailed Reporting**: Provide specific feedback for each violation

### Error Categories
- **Schema Errors**: Structural or type violations
- **Scientific Violations**: Exercise science principle breaches
- **Logic Errors**: Inconsistent program parameters
- **Safety Concerns**: Potentially harmful program configurations

## Research Foundation
The validation schema enforces principles from:
- Volume landmark research (Israetel et al., Schoenfeld et al.)
- Autoregulation methodologies (Helms, RTS)
- Periodization models (Bompa, Issurin, block periodization research)
- Weak point analysis standards (strength coaching literature)
- Exercise selection criteria (stimulus-to-fatigue ratio research)

## Long-term Vision
This validation framework establishes a foundation for:
- **Continuous Scientific Updates**: Easy integration of new research findings
- **Advanced Program Analysis**: Detailed program quality metrics
- **AI Training Feedback**: Validation results to improve LLM generation
- **Research Integration**: Data collection on program effectiveness
- **Professional Standards**: Validation comparable to elite coaching practices

## Usage Examples

### Basic Validation
```typescript
import { ENHANCED_PROGRAM_VALIDATION, validateEnhancedProgram } from '@/lib/validation/enhancedProgramSchema'

const result = validateEnhancedProgram(program, volumeLandmarks, weakPoints)
if (!result.isValid) {
  console.log('Violations:', result.violations)
  console.log('Errors:', result.errors)
}
```

### Volume Compliance Check
```typescript
import { validateVolumeCompliance } from '@/lib/validation/enhancedProgramSchema'

const compliance = validateVolumeCompliance(program, individualLandmarks)
if (!compliance.isValid) {
  compliance.violations.forEach(violation => {
    console.log('Volume violation:', violation)
  })
}
```

## Confidence Assessment
**Implementation Confidence: 10/10**
- Complete validation framework with comprehensive scientific principles
- Full type safety and error handling
- Modular, extensible design for future enhancements
- Seamless integration with existing program generation system 