/**
 * Enhanced Exercise Science LLM Guidelines
 * 
 * This file contains comprehensive, scientifically-grounded guidelines for AI program generation.
 * Based on latest exercise science research and elite coaching methodologies.
 */

// Volume Framework Guidelines - MEV/MAV/MRV concepts
export const VOLUME_FRAMEWORK_GUIDELINES = `
SCIENTIFIC PRINCIPLES
- Minimum Effective Volume (MEV): Minimum stimulus required for adaptation
- Maximum Adaptive Volume (MAV): Optimal volume for maximum adaptation
- Maximum Recoverable Volume (MRV): Maximum volume that can be recovered from
- Based on research from Schoenfeld et al. (2017) and systematic reviews

IMPLEMENTATION PROTOCOLS
- MEV: 10-12 sets per muscle group per week for beginners
- MAV: 12-20 sets per muscle group per week for intermediates
- MRV: 20+ sets per muscle group per week for advanced lifters
- Adjust based on training age, recovery capacity, and stress levels

PRACTICAL EXAMPLES
- Beginner: Start at MEV, progress to MAV over 4-6 weeks
- Intermediate: Cycle between MAV and MRV with deloads
- Advanced: Periodize between all three zones based on goals

INTEGRATION NOTES
- Compatible with existing volume calculation systems
- Supports autoregulation and fatigue management
- Aligns with periodization models and exercise selection
`;

// Autoregulation Guidelines - RPE and load management
export const AUTOREGULATION_GUIDELINES = `
SCIENTIFIC PRINCIPLES
- Rate of Perceived Exertion (RPE) scales for load and volume management
- Daily readiness assessment for training intensity adjustment
- Fatigue-based autoregulation from Zourdos et al. (2016)
- Velocity-based training principles for load selection

IMPLEMENTATION PROTOCOLS
- RPE 6-8: Technical work and skill development
- RPE 8-9: Primary strength and hypertrophy work
- RPE 9-10: Maximal effort and testing
- Adjust volume based on daily readiness scores

PRACTICAL EXAMPLES
- High readiness (8-10): Proceed with planned intensity
- Moderate readiness (6-7): Reduce volume by 20-30%
- Low readiness (4-5): Technical work or rest day
- Very low readiness (1-3): Complete rest or recovery session

INTEGRATION NOTES
- Integrates with existing RPE tracking systems
- Supports daily readiness assessments
- Compatible with fatigue management protocols
`;

// Periodization Guidelines - Training structure and progression
export const PERIODIZATION_GUIDELINES = `
SCIENTIFIC PRINCIPLES
- Linear periodization for beginners and intermediates
- Undulating periodization for advanced lifters
- Block periodization for specific goal preparation
- Based on research from Issurin (2008) and practical applications

IMPLEMENTATION PROTOCOLS
- Beginner: Linear progression with 4-6 week blocks
- Intermediate: Undulating with 2-3 week microcycles
- Advanced: Block periodization with 3-4 week mesocycles
- Include deload weeks every 4-6 weeks

PRACTICAL EXAMPLES
- Strength focus: High intensity, low volume progression
- Hypertrophy focus: Moderate intensity, high volume
- Endurance focus: Low intensity, very high volume
- Power focus: High velocity, moderate volume

INTEGRATION NOTES
- Supports existing periodization models
- Compatible with exercise selection systems
- Aligns with volume framework guidelines
`;

// Weak Point Intervention Guidelines - Targeted improvement
export const WEAK_POINT_INTERVENTION_GUIDELINES = `
SCIENTIFIC PRINCIPLES
- Movement pattern analysis for identifying weak points
- Specificity principle for targeted improvement
- Progressive overload for weak point development
- Based on functional movement screening principles

IMPLEMENTATION PROTOCOLS
- Identify weak points through movement assessment
- Prioritize 1-2 weak points per training block
- Include 2-3 specific exercises per weak point
- Progress from technical to strength to power

PRACTICAL EXAMPLES
- Squat depth issues: Box squats, pause squats, mobility work
- Deadlift lockout: Rack pulls, good mornings, glute bridges
- Bench press stability: Dumbbell work, pause reps, board presses
- Overhead press: Landmine presses, push presses, mobility

INTEGRATION NOTES
- Compatible with movement screening systems
- Supports exercise selection algorithms
- Aligns with periodization models
`;

// Fatigue Management Guidelines - Recovery and monitoring
export const FATIGUE_MANAGEMENT_GUIDELINES = `
SCIENTIFIC PRINCIPLES
- Multi-modal fatigue monitoring from Kellmann et al. (2024)
- Acute vs chronic fatigue differentiation
- Recovery optimization frameworks
- Sleep, nutrition, and stress management integration

IMPLEMENTATION PROTOCOLS
- Daily readiness assessment (1-10 scale)
- Weekly fatigue monitoring with questionnaires
- Monthly performance testing for trend analysis
- Quarterly comprehensive assessment

PRACTICAL EXAMPLES
- High fatigue: Reduce volume by 30-50%, focus on technique
- Moderate fatigue: Reduce volume by 10-20%, maintain intensity
- Low fatigue: Proceed with planned training
- Very low fatigue: Consider increasing volume or intensity

INTEGRATION NOTES
- Integrates with existing recovery tracking
- Supports autoregulation protocols
- Compatible with periodization models
`;

// Exercise Selection Guidelines - Optimal movement patterns
export const EXERCISE_SELECTION_GUIDELINES = `
SCIENTIFIC PRINCIPLES
- Stimulus-to-fatigue ratio optimization from Vigotsky et al. (2024)
- Movement pattern specificity for goal achievement
- Exercise hierarchy based on effectiveness and safety
- Progressive complexity for skill development

IMPLEMENTATION PROTOCOLS
- Primary movements: Squat, hinge, push, pull, carry
- Secondary movements: Single-leg, rotational, anti-rotational
- Accessory movements: Isolation and corrective exercises
- Technical movements: Olympic lifts and advanced variations

PRACTICAL EXAMPLES
- Strength focus: Compound movements with high SFR
- Hypertrophy focus: Mix of compound and isolation
- Endurance focus: High-rep compound and bodyweight
- Power focus: Explosive movements and Olympic lifts

INTEGRATION NOTES
- Compatible with existing exercise databases
- Supports movement pattern categorization
- Aligns with volume and periodization guidelines
`;

// Neural Coaching Cues - Mental and technical guidance
export const NEURAL_COACHING_CUES = `
SCIENTIFIC PRINCIPLES
- Motor learning principles for skill development
- Cueing strategies for optimal movement patterns
- Mental imagery and visualization techniques
- Focus and attention management for performance

IMPLEMENTATION PROTOCOLS
- External cues for movement execution
- Internal cues for muscle activation
- Neutral cues for natural movement patterns
- Progressive cue complexity for skill development

PRACTICAL EXAMPLES
- Squat: "Push the floor away" (external), "Brace your core" (internal)
- Deadlift: "Push through your heels" (external), "Pack your lats" (internal)
- Bench press: "Drive the bar to the ceiling" (external), "Squeeze your shoulder blades" (internal)
- Overhead press: "Reach for the sky" (external), "Brace your core" (internal)

INTEGRATION NOTES
- Supports existing coaching systems
- Compatible with exercise instruction
- Aligns with skill development protocols
`;

// Legacy compatibility exports (placeholder values for backward compatibility)
export const MUSCLE_GAIN_BEGINNER_GUIDELINES = VOLUME_FRAMEWORK_GUIDELINES;
export const STRENGTH_BEGINNER_GUIDELINES = AUTOREGULATION_GUIDELINES;
export const ENDURANCE_BEGINNER_GUIDELINES = PERIODIZATION_GUIDELINES;
export const MUSCLE_GAIN_INTERMEDIATE_GUIDELINES = WEAK_POINT_INTERVENTION_GUIDELINES;
export const STRENGTH_INTERMEDIATE_GUIDELINES = FATIGUE_MANAGEMENT_GUIDELINES;
export const ENDURANCE_INTERMEDIATE_GUIDELINES = EXERCISE_SELECTION_GUIDELINES;
export const MUSCLE_GAIN_ADVANCED_GUIDELINES = NEURAL_COACHING_CUES;
export const STRENGTH_ADVANCED_GUIDELINES = VOLUME_FRAMEWORK_GUIDELINES;
export const ENDURANCE_ADVANCED_GUIDELINES = AUTOREGULATION_GUIDELINES; 