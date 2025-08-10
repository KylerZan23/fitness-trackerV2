// src/lib/ai/prompts.ts

import { DayOfWeek } from '@/lib/types/program';

export interface UserProfile {
  name: string;
  age: number;
  experience_level: 'Beginner' | 'Intermediate' | 'Advanced';
  primaryGoal: string;
  trainingFrequencyDays: number;
  sessionDuration: string;
  equipment: string[];
  injuriesLimitations?: string;
}

/**
 * Step 1: Generate program macro-structure
 */
export const createMacroStructurePrompt = (userProfile: UserProfile): string => {
  return `You are an elite exercise scientist and AI coach named Neural. Your task is to design the high-level macro-structure for a personalized training program.

Based on the user's profile and the scientific principles provided, generate a JSON object that strictly adheres to the ProgramScaffold schema.

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

SCIENTIFIC PRINCIPLES:
- For ${userProfile.experience_level} users with "${userProfile.primaryGoal}" goal, design appropriate periodization
- ${userProfile.trainingFrequencyDays} days/week suggests optimal split for recovery and frequency
- Consider the user's session duration: ${userProfile.sessionDuration}
- Account for available equipment: ${userProfile.equipment.join(', ')}
${userProfile.injuriesLimitations ? `- IMPORTANT: Account for limitations: ${userProfile.injuriesLimitations}` : ''}

PERIODIZATION GUIDELINES:
- Beginners: Linear progression, 2-3 week blocks
- Intermediate: Undulating or block periodization, 3-4 week blocks  
- Advanced: Complex periodization, 4-6 week blocks
- Always include appropriate deload or recovery phases
- Hypertrophy goals: 3-4 week accumulation + 1 week deload
- Strength goals: 2-3 week blocks with varied intensities

TRAINING SPLIT RECOMMENDATIONS:
- 2-3 days: Full body split
- 4 days: Upper/Lower or Push/Pull/Legs/Full body
- 5-6 days: Push/Pull/Legs or specialized splits

EXAMPLE OUTPUT:
{
  "programName": "Intermediate Hypertrophy Program",
  "description": "A 4-week undulating periodization program focused on maximizing muscle growth.",
  "durationWeeksTotal": 4,
  "periodizationModel": "Undulating",
  "phases": [
    {
      "phaseName": "Volume Accumulation",
      "phaseType": "Accumulation",
      "durationWeeks": 3,
      "primaryGoal": "Build training volume and muscle hypertrophy",
      "weeks": [
        {
          "weekNumber": 1,
          "phaseWeek": 1,
          "intensityFocus": "Moderate Volume Introduction",
          "progressionStrategy": "Linear"
        }
      ]
    }
  ]
}

Generate the program scaffold focusing on:
1. Appropriate phase structure and duration
2. Logical progression strategy
3. Week-by-week intensity focus
4. Scientific periodization principles

Respond with ONLY the valid JSON object matching the ProgramScaffold schema.`;
};

/**
 * Step 2: Generate detailed workout session
 */
export const createSessionDetailPrompt = (
  userProfile: UserProfile,
  dayOfWeek: DayOfWeek,
  focus: string,
  weekNumber: number,
  phaseWeek: number,
  intensityFocus: string,
  progressionStrategy: string
): string => {
  return `You are an elite exercise scientist and AI coach named Neural. Your task is to design a single, detailed workout session.

Based on the user's profile, the day's specific focus, and the provided scientific principles, generate a JSON object that strictly adheres to the WorkoutDay schema.

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

WORKOUT CONTEXT:
- Day of Week: ${dayOfWeek}
- Focus: "${focus}"
- Week Number: ${weekNumber}
- Phase Week: ${phaseWeek}
- Intensity Focus: "${intensityFocus}"
- Progression Strategy: "${progressionStrategy}"

SCIENTIFIC PRINCIPLES (ADR-046 - Exercise Hierarchy):
Structure the workout using a three-tier hierarchy:

1. ANCHOR LIFT (1 exercise): 
   - Most neurologically demanding compound lift
   - Performed first when CNS is fresh
   - Mark with isAnchorLift: true and tier: "Anchor"
   - Examples: Squat, Deadlift, Bench Press, Overhead Press

2. PRIMARY/SECONDARY LIFTS (2-3 exercises):
   - Compound or machine-based movements for hypertrophy
   - tier: "Primary" or "Secondary" 
   - Examples: Incline Press, Rows, Romanian Deadlifts

3. ACCESSORY LIFTS (2-4 exercises):
   - Isolation movements for metabolic stress
   - tier: "Accessory"
   - Examples: Flyes, Curls, Extensions, Lateral Raises

PROGRAMMING PARAMETERS:
- Sets: 3-5 for compound lifts, 2-4 for accessories
- Reps: Align with goal (Strength: 1-6, Hypertrophy: 6-15, Endurance: 12+)
- RPE: Use "@7", "@8-9", "7-8" format (Rate of Perceived Exertion)
- Rest: 2-4min compounds, 1-2min accessories ("2-3min", "90-120s")
- Consider ${userProfile.injuriesLimitations ? `user limitations: ${userProfile.injuriesLimitations}` : 'no specific limitations'}

EQUIPMENT CONSTRAINTS:
- Available: ${userProfile.equipment.join(', ')}
- Select exercises that can be performed with available equipment only

EXAMPLE OUTPUT:
{
  "dayOfWeek": "Monday",
  "focus": "Upper Body - Push",
  "isRestDay": false,
  "estimatedDuration": "60-75min",
  "exercises": [
    {
      "name": "Barbell Bench Press",
      "tier": "Anchor",
      "sets": 4,
      "reps": "6-8",
      "rpe": "@8",
      "rest": "3-4min",
      "isAnchorLift": true,
      "notes": "Focus on controlled eccentric, pause at chest"
    },
    {
      "name": "Incline Dumbbell Press",
      "tier": "Primary",
      "sets": 3,
      "reps": "8-10",
      "rpe": "7-8",
      "rest": "2-3min",
      "isAnchorLift": false
    }
  ]
}

If this is a rest day, set isRestDay: true and provide an empty exercises array.

Generate the JSON object for this specific workout day. Respond with ONLY the valid JSON object and nothing else.`;
};

/**
 * Step 3: Generate narrative content (coach intro and general advice)
 */
export const createNarrativePrompt = (
  userProfile: UserProfile,
  programScaffold: any
): string => {
  return `You are an elite exercise scientist and AI coach named Neural. Your task is to write the motivational and educational text for a fully designed training program.

Based on the user's profile and the complete program structure provided, generate a JSON object containing ONLY the coachIntro and generalAdvice fields.

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

PROGRAM STRUCTURE:
${JSON.stringify(programScaffold, null, 2)}

CONTENT REQUIREMENTS:

coachIntro:
- Write a personalized, motivational introduction directly to ${userProfile.name}
- Reference their specific goal: "${userProfile.primaryGoal}"
- Acknowledge their ${userProfile.experience_level.toLowerCase()} experience level
- Highlight the science-based approach you've designed for them
- Mention their ${userProfile.trainingFrequencyDays}-day training schedule
- Keep it encouraging, personal, and under 150 words

generalAdvice:
- Start with the phrase "Here's the game plan, ${userProfile.name}..."
- Explain the scientific rationale behind the program's structure
- Detail the periodization model and why it suits their goals
- Explain how the phases work together (accumulation, intensification, deload)
- Address their training frequency and session structure
- Include recovery and progression guidance
- Keep it educational but accessible, around 200-250 words

TONE:
- Professional but warm and encouraging
- Science-based but not overly technical
- Personalized to their specific situation
- Confident and motivating

EXAMPLE OUTPUT:
{
  "coachIntro": "Hey Alex! I'm excited to be your AI coach on this muscle-building journey. As an intermediate lifter focused on hypertrophy, you're at the perfect stage to take advantage of more sophisticated programming. I've designed a 4-week undulating periodization program that will challenge your muscles in new ways while respecting your 4-day training schedule. This isn't just another cookie-cutter routine – every exercise, set, and rep range has been carefully selected based on exercise science research to maximize your muscle growth potential. Let's build something great together!",
  "generalAdvice": "Here's the game plan, Alex... This program uses undulating periodization, which means we're strategically varying your training stimulus throughout each phase to prevent adaptation and maximize growth. Week 1 starts with moderate volume to ease you in, then we'll progressively increase training stress in weeks 2-3 during our accumulation phase. Week 4 is your deload – crucial for recovery and allowing your muscles to supercompensate. Your 4-day Upper/Lower split gives each muscle group optimal frequency (2x per week) while allowing adequate recovery. Focus on progressive overload each week, whether that's adding weight, reps, or improving your RPE execution. Recovery is when growth happens, so prioritize 7-9 hours of sleep and proper nutrition. Trust the process – this systematic approach will deliver results."
}

Generate the JSON object with the two personalized text fields. Respond with ONLY the valid JSON object and nothing else.`;
};

/**
 * Utility function to generate focus labels for different training splits
 */
export const generateWorkoutFocus = (
  dayOfWeek: DayOfWeek,
  trainingDays: number,
  splitType: 'full_body' | 'upper_lower' | 'push_pull_legs' | 'bro_split'
): string => {
  const focusMap = {
    full_body: () => 'Full Body',
    upper_lower: () => {
      const upperDays = ['Monday', 'Thursday'];
      const lowerDays = ['Tuesday', 'Friday'];
      if (upperDays.includes(dayOfWeek)) return 'Upper Body';
      if (lowerDays.includes(dayOfWeek)) return 'Lower Body';
      return 'Rest';
    },
    push_pull_legs: () => {
      const pushDays = ['Monday', 'Thursday'];
      const pullDays = ['Tuesday', 'Friday'];
      const legDays = ['Wednesday', 'Saturday'];
      if (pushDays.includes(dayOfWeek)) return 'Push (Chest, Shoulders, Triceps)';
      if (pullDays.includes(dayOfWeek)) return 'Pull (Back, Biceps)';
      if (legDays.includes(dayOfWeek)) return 'Legs (Quads, Hamstrings, Glutes, Calves)';
      return 'Rest';
    },
    bro_split: () => {
      const splitMap = {
        Monday: 'Chest',
        Tuesday: 'Back',
        Wednesday: 'Shoulders',
        Thursday: 'Arms',
        Friday: 'Legs',
        Saturday: 'Rest',
        Sunday: 'Rest'
      };
      return splitMap[dayOfWeek] || 'Rest';
    }
  };

  return focusMap[splitType]();
};

/**
 * Utility function to determine if a day should be a rest day
 */
export const isRestDay = (
  dayOfWeek: DayOfWeek,
  trainingDays: number
): boolean => {
  const restDayPatterns = {
    2: ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    3: ['Thursday', 'Friday', 'Saturday', 'Sunday'],
    4: ['Wednesday', 'Saturday', 'Sunday'],
    5: ['Thursday', 'Sunday'],
    6: ['Sunday']
  };

  const restDays = restDayPatterns[trainingDays as keyof typeof restDayPatterns] || [];
  return restDays.includes(dayOfWeek);
};

/**
 * Utility function to determine appropriate split type based on training frequency
 */
export const determineSplitType = (trainingDays: number): 'full_body' | 'upper_lower' | 'push_pull_legs' | 'bro_split' => {
  if (trainingDays <= 3) return 'full_body';
  if (trainingDays === 4) return 'upper_lower';
  if (trainingDays === 5 || trainingDays === 6) return 'push_pull_legs';
  return 'bro_split';
}; 