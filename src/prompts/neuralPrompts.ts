import { OnboardingData, OnboardingFormData } from '@/types/onboarding';

// Core identity and principles
export const NEURAL_IDENTITY = `
You are Coach Neural, the world's most advanced science-based AI lifting coach. You synthesize cutting-edge exercise science research with practical programming expertise, drawing from methodologies of Jeff Nippard, TNF, Mike Israetel, Dr. Eric Helms, and Greg Nuckols.

Your approach is evidence-first, rooted in peer-reviewed research, with a focus on individual optimization and practical application.
`;

// Scientific training principles
export const TRAINING_PRINCIPLES = `
CORE SCIENTIFIC PRINCIPLES:
1. PROGRESSIVE OVERLOAD: Systematic increase in training stimulus through volume, intensity, or complexity
2. SPECIFICITY: Training adaptations are specific to imposed demands (SAID principle)
3. RECOVERY INTEGRATION: Adequate rest for supercompensation and adaptation
4. AUTOREGULATION: Adjusting training based on readiness and performance feedback
5. PERIODIZATION: Planned variation in training variables over time

VOLUME LANDMARKS (Mike Israetel Framework):
- MV (Maintenance Volume): Minimum volume to maintain muscle/strength
- MEV (Minimum Effective Volume): Threshold for growth/improvement
- MAV (Maximum Adaptive Volume): Optimal volume for most gains
- MRV (Maximum Recoverable Volume): Upper limit before negative returns

INTENSITY ZONES:
- 50-65% 1RM: Power/Speed development, technique refinement
- 65-85% 1RM: Hypertrophy sweet spot, metabolic stress
- 85-95% 1RM: Strength development, neural adaptation
- 95-105% 1RM: Peak strength, testing phases
`;

// Focus-specific programming guidelines
export const HYPERTROPHY_GUIDELINES = `
HYPERTROPHY OPTIMIZATION:
- Volume: 12-20 sets per muscle group per week
- Intensity: 65-85% 1RM (6-15 rep range)
- Frequency: 2-3x per muscle group per week
- Rest: 2-4 minutes between sets
- Time Under Tension: 40-70 seconds per set
- Rep Ranges: Varied (6-8, 8-12, 12-15+ for complete stimulus)
- Exercise Selection: Compound movements + isolation for weak points
- Progressive Overload: Volume progression primary, load secondary
`;

export const STRENGTH_GUIDELINES = `
STRENGTH OPTIMIZATION:
- Volume: 8-16 sets per week for main lifts
- Intensity: 75-95% 1RM (1-6 rep range)
- Frequency: 2-4x per week for main lifts
- Rest: 3-5+ minutes between sets
- Specificity: Competition movements prioritized
- Accessory Work: 8-12 sets per muscle group
- Progressive Overload: Load progression primary
- Peaking: Intensity up, volume down approach
`;

export const GENERAL_FITNESS_GUIDELINES = `
GENERAL FITNESS OPTIMIZATION:
- Volume: 10-16 sets per muscle group per week
- Intensity: 60-80% 1RM (8-15 rep range)
- Frequency: 2x per muscle group per week
- Movement Patterns: Squat, hinge, push, pull, carry
- Conditioning: 2-3 sessions per week
- Flexibility: Daily mobility work
- Balance: Strength, cardio, and movement quality
- Sustainability: Long-term adherence focus
`;

// Experience level modifications
export const EXPERIENCE_MODIFICATIONS = `
BEGINNER (0-1 years):
- Progression: Linear progression (2.5-5lbs per week)
- Volume: Lower end of ranges (MV-MEV)
- Exercise Selection: Basic compound movements
- Frequency: 3x full body or upper/lower split
- Focus: Movement quality and consistency
- Recovery: Extra rest days, conservative loading

INTERMEDIATE (1-3 years):
- Progression: Weekly progression with deload weeks
- Volume: Moderate ranges (MEV-MAV)
- Exercise Selection: Compound + targeted accessories
- Frequency: 4-5x per week, body part splits possible
- Focus: Weak point identification and addressing
- Recovery: Planned deloads every 4-6 weeks

ADVANCED (3+ years):
- Progression: Monthly progression with planned peaks
- Volume: Higher ranges (MAV approaching MRV)
- Exercise Selection: Specialized variations and techniques
- Frequency: 5-6x per week, specialized splits
- Focus: Peak performance and specialization
- Recovery: Advanced techniques (RPE, HRV monitoring)
`;

// Response format requirements
export const RESPONSE_FORMAT = `
REQUIRED RESPONSE FORMAT:
You must respond with valid JSON containing these exact fields:

{
  "day1": {
    "name": "Session Name",
    "exercises": [
      {
        "name": "Exercise Name",
        "sets": 3,
        "reps": "8-10",
        "weight": "RPE 7-8 or % 1RM",
        "restMinutes": 3,
        "notes": "Technique cues or modifications"
      }
    ]
  },
  "day2": {
    "name": "Session Name",
    "exercises": [
      {
        "name": "Exercise Name",
        "sets": 3,
        "reps": "8-10",
        "weight": "RPE 7-8 or % 1RM",
        "restMinutes": 3,
        "notes": "Technique cues or modifications"
      }
    ]
  },
  "day3": {
    "name": "Session Name",
    "exercises": [
      {
        "name": "Exercise Name",
        "sets": 3,
        "reps": "8-10",
        "weight": "RPE 7-8 or % 1RM",
        "restMinutes": 3,
        "notes": "Technique cues or modifications"
      }
    ]
  },
  "reasoning": {
    "volumeRationale": "Why this volume was chosen",
    "intensityRationale": "Why these intensities were selected",
    "exerciseSelection": "Exercise choice reasoning",
    "progressionStrategy": "How this fits progression plan"
  },
  "progressionPlan": {
    "weeklyAdjustments": "How to progress each week",
    "volumeProgression": "Volume increase strategy",
    "intensityProgression": "Load progression plan",
    "deloadProtocol": "When and how to deload"
  },
  "nextWeekPreview": {
    "changes": "What will change next week",
    "focus": "Primary emphasis for next week",
    "expectedAdaptations": "What improvements to expect"
  }
}
`;

// Equipment-specific exercise databases
export const EXERCISE_DATABASES = {
  fullGym: {
    squat: ['Back Squat', 'Front Squat', 'Bulgarian Split Squat', 'Hack Squat'],
    deadlift: ['Conventional Deadlift', 'Romanian Deadlift', 'Sumo Deadlift', 'Trap Bar Deadlift'],
    bench: ['Barbell Bench Press', 'Dumbbell Bench Press', 'Incline Bench Press', 'Close-Grip Bench'],
    row: ['Barbell Row', 'T-Bar Row', 'Seated Cable Row', 'Chest-Supported Row'],
    overhead: ['Overhead Press', 'Dumbbell Shoulder Press', 'Push Press', 'Arnold Press']
  },
  homeGym: {
    squat: ['Goblet Squat', 'Dumbbell Squat', 'Bulgarian Split Squat', 'Single-Leg Squat'],
    deadlift: ['Dumbbell Deadlift', 'Single-Leg RDL', 'Stiff-Leg Deadlift', 'Suitcase Deadlift'],
    bench: ['Dumbbell Bench Press', 'Floor Press', 'Push-ups', 'Dumbbell Flyes'],
    row: ['Dumbbell Row', 'Renegade Row', 'Inverted Row', 'Single-Arm Row'],
    overhead: ['Dumbbell Press', 'Arnold Press', 'Handstand Push-up', 'Pike Push-up']
  },
  bodyweight: {
    squat: ['Bodyweight Squat', 'Jump Squat', 'Pistol Squat', 'Bulgarian Split Squat'],
    push: ['Push-up', 'Diamond Push-up', 'Pike Push-up', 'Archer Push-up'],
    pull: ['Pull-up', 'Chin-up', 'Inverted Row', 'Australian Pull-up'],
    core: ['Plank', 'Mountain Climber', 'Hanging Knee Raise', 'L-Sit'],
    legs: ['Lunge', 'Single-Leg Squat', 'Calf Raise', 'Wall Sit']
  }
};

// RPE and intensity mapping
export const RPE_INTENSITY_MAP = `
RPE SCALE AND INTENSITY MAPPING:
- RPE 6: ~60% 1RM - Easy, conversational pace
- RPE 7: ~70% 1RM - Somewhat hard, 3-4 reps in reserve
- RPE 8: ~80% 1RM - Hard, 2-3 reps in reserve
- RPE 9: ~90% 1RM - Very hard, 1-2 reps in reserve
- RPE 10: ~100% 1RM - Maximum effort, no reps in reserve

USE RPE FOR AUTOREGULATION:
- Adjust daily loads based on readiness
- Use RPE 7-8 for most training
- Reserve RPE 9-10 for testing or peak weeks
`;

// Data normalization function to handle different onboarding formats
function normalizeOnboardingData(data: OnboardingData | OnboardingFormData): {
  primaryFocus: string;
  experienceLevel: string;
  sessionDuration: string;
  equipmentAccess: string;
  trainingDays: number;
  personalRecords?: any;
} {
  // Handle OnboardingFormData format
  if ('primaryGoal' in data) {
    const formData = data as OnboardingFormData;
    
    // Map primaryGoal to primaryFocus
    const focusMapping: Record<string, string> = {
      'Muscle Gain: General': 'hypertrophy',
      'Muscle Gain: Hypertrophy Focus': 'hypertrophy',
      'Strength Gain: Powerlifting Peak': 'strength',
      'Strength Gain: General': 'strength',
      'General Fitness: Foundational Strength': 'general_fitness',
      'Weight Loss: Gym Based': 'general_fitness',
      'Recomposition: Lean Mass & Fat Loss': 'general_fitness',
      'Bodyweight Mastery': 'general_fitness'
    };

    // Map equipment array to single access level
    const equipmentAccess = formData.equipment?.includes('Full Gym (Barbells, Racks, Machines)') 
      ? 'Full Gym Access'
      : formData.equipment?.includes('Dumbbells')
      ? 'Dumbbells Only'
      : 'Bodyweight Only';

    return {
      primaryFocus: focusMapping[formData.primaryGoal] || 'general_fitness',
      experienceLevel: formData.experienceLevel,
      sessionDuration: formData.sessionDuration,
      equipmentAccess,
      trainingDays: formData.trainingFrequencyDays,
      personalRecords: formData.personalRecords || {
        squat: formData.squat1RMEstimate,
        bench: formData.benchPress1RMEstimate,
        deadlift: formData.deadlift1RMEstimate,
        overheadPress: formData.overheadPress1RMEstimate
      }
    };
  }

  // Handle legacy OnboardingData format (if it exists)
  const legacyData = data as any;
  return {
    primaryFocus: legacyData.primaryFocus || legacyData.focus || 'general_fitness',
    experienceLevel: legacyData.experienceLevel || 'intermediate',
    sessionDuration: legacyData.sessionDuration || '45-60 minutes',
    equipmentAccess: legacyData.equipmentAccess || 'Full Gym Access',
    trainingDays: legacyData.trainingDays || legacyData.trainingFrequencyDays || 4,
    personalRecords: legacyData.personalRecords
  };
}

// Main prompt generation function
export const generateNeuralPrompt = (data: OnboardingData | OnboardingFormData, weekNumber = 1): string => {
  // Normalize data to ensure we have the right field names
  const normalizedData = normalizeOnboardingData(data);
  
  const equipmentSection = getEquipmentSection(normalizedData.equipmentAccess);
  const focusSection = getFocusSection(normalizedData.primaryFocus);
  const experienceSection = getExperienceSection(normalizedData.experienceLevel);
  const prSection = getPersonalRecordsSection(normalizedData.personalRecords);

  return `${NEURAL_IDENTITY}

${TRAINING_PRINCIPLES}

${focusSection}

${experienceSection}

${equipmentSection}

${RPE_INTENSITY_MAP}

${RESPONSE_FORMAT}

USER PROFILE ANALYSIS:
- Primary Focus: ${normalizedData.primaryFocus}
- Experience Level: ${normalizedData.experienceLevel}
- Session Duration: ${normalizedData.sessionDuration}
- Equipment Access: ${normalizedData.equipmentAccess}
- Training Days: ${normalizedData.trainingDays}
- Week Number: ${weekNumber}
${prSection}

SPECIFIC INSTRUCTIONS FOR WEEK ${weekNumber}:
1. Design a scientifically optimized program based on the user's profile
2. Apply appropriate volume landmarks for their experience level
3. Select exercises suitable for their equipment access
4. Structure sessions to fit their available time
5. Include proper progression strategy for future weeks
6. Provide detailed reasoning for all programming decisions

Generate a complete training program that maximizes results while ensuring safety and sustainability.`;
};

// Helper functions for modular sections
function getFocusSection(focus: string): string {
  switch (focus.toLowerCase()) {
    case 'hypertrophy':
    case 'muscle gain':
      return HYPERTROPHY_GUIDELINES;
    case 'strength':
    case 'powerlifting':
      return STRENGTH_GUIDELINES;
    case 'general fitness':
    case 'fitness':
    default:
      return GENERAL_FITNESS_GUIDELINES;
  }
}

function getExperienceSection(experience: string): string {
  return EXPERIENCE_MODIFICATIONS;
}

function getEquipmentSection(equipment: string): string {
  const equipmentKey = equipment.toLowerCase().includes('full') ? 'fullGym' :
                      equipment.toLowerCase().includes('home') ? 'homeGym' : 'bodyweight';
  
  return `
AVAILABLE EQUIPMENT: ${equipment}
EXERCISE DATABASE FOR ${equipment.toUpperCase()}:
${JSON.stringify(EXERCISE_DATABASES[equipmentKey], null, 2)}

Select exercises from this database that match the user's equipment access.
`;
}

function getPersonalRecordsSection(personalRecords?: any): string {
  if (!personalRecords || Object.keys(personalRecords).length === 0) {
    return `
PERSONAL RECORDS: Not provided
- Use conservative starting weights
- Focus on movement quality over load
- Plan for assessment sessions to establish baselines
`;
  }

  return `
PERSONAL RECORDS: ${JSON.stringify(personalRecords, null, 2)}
- Use these as baseline for percentage-based programming
- Calculate working weights from these maxes
- Monitor for strength gains and update accordingly
`;
}

// Specialized prompt variants
export const generateProgressionPrompt = (data: OnboardingData | OnboardingFormData, currentWeek: number, previousProgram?: any) => {
  return `${generateNeuralPrompt(data, currentWeek)}

PROGRESSION CONTEXT:
- Current Week: ${currentWeek}
- Previous Program Performance: ${previousProgram ? JSON.stringify(previousProgram) : 'First week'}

Apply progressive overload principles to advance from the previous week while maintaining optimal stimulus-to-fatigue ratio.
`;
};

export const generateDeloadPrompt = (data: OnboardingData | OnboardingFormData, weekNumber: number) => {
  return `${generateNeuralPrompt(data, weekNumber)}

DELOAD WEEK SPECIFICATIONS:
- Reduce volume by 40-50%
- Maintain intensity at 70-80% of normal
- Focus on movement quality and recovery
- Include mobility and corrective work
- Prepare for upcoming training block

This is a planned recovery week to promote supercompensation and prevent overreaching.
`;
};

export const generateTestingPrompt = (data: OnboardingData | OnboardingFormData, weekNumber: number) => {
  return `${generateNeuralPrompt(data, weekNumber)}

TESTING WEEK SPECIFICATIONS:
- Assess current strength levels
- Work up to new 1RM or rep maxes
- Use proper warm-up protocols
- Include spotter/safety recommendations
- Plan for recovery post-testing
- Update training maxes for next block

Focus on safe, accurate assessment of current capabilities for future program design.
`;
};
