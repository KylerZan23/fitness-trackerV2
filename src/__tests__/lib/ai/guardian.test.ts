// src/__tests__/lib/ai/guardian.test.ts

import { guardianLayer, createGuardianLayer, ValidationResult } from '@/lib/ai/guardian';
import { TrainingProgram } from '@/lib/types/program';

describe('GuardianLayer', () => {
  let guardian: ReturnType<typeof createGuardianLayer>;

  beforeEach(() => {
    guardian = createGuardianLayer();
  });

  describe('validateProgram', () => {
    it('should validate a well-structured program successfully', () => {
      const validProgram: TrainingProgram = {
        programName: 'Test Program',
        description: 'A test program',
        durationWeeksTotal: 4,
        coachIntro: 'Welcome to your program',
        generalAdvice: 'Follow the program as written',
        periodizationModel: 'Linear',
        phases: [
          {
            phaseName: 'Accumulation',
            phaseType: 'Accumulation',
            durationWeeks: 4,
            primaryGoal: 'Build volume',
            weeks: [
              {
                weekNumber: 1,
                phaseWeek: 1,
                progressionStrategy: 'Linear',
                intensityFocus: 'Volume Accumulation',
                days: [
                  {
                    dayOfWeek: 'Monday',
                    focus: 'Upper Body - Push',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Bench Press',
                        tier: 'Anchor',
                        sets: 3,
                        reps: '5-8',
                        rpe: '7-8',
                        rest: '3-4min',
                        isAnchorLift: true
                      },
                      {
                        name: 'Incline Dumbbell Press',
                        tier: 'Primary',
                        sets: 3,
                        reps: '8-10',
                        rpe: '7-8',
                        rest: '2-3min',
                        isAnchorLift: false
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Tuesday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Wednesday',
                    focus: 'Lower Body',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Squat',
                        tier: 'Anchor',
                        sets: 3,
                        reps: '5-8',
                        rpe: '7-8',
                        rest: '3-4min',
                        isAnchorLift: true
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Thursday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Friday',
                    focus: 'Upper Body - Pull',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Deadlift',
                        tier: 'Anchor',
                        sets: 3,
                        reps: '5-8',
                        rpe: '7-8',
                        rest: '3-4min',
                        isAnchorLift: true
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Saturday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Sunday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  }
                ]
              },
              {
                weekNumber: 2,
                phaseWeek: 2,
                progressionStrategy: 'Linear',
                intensityFocus: 'Volume Accumulation',
                days: [
                  {
                    dayOfWeek: 'Monday',
                    focus: 'Upper Body - Push',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Bench Press',
                        tier: 'Anchor',
                        sets: 3,
                        reps: '5-8',
                        rpe: '7-8',
                        rest: '3-4min',
                        isAnchorLift: true
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Tuesday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Wednesday',
                    focus: 'Lower Body',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Squat',
                        tier: 'Anchor',
                        sets: 3,
                        reps: '5-8',
                        rpe: '7-8',
                        rest: '3-4min',
                        isAnchorLift: true
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Thursday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Friday',
                    focus: 'Upper Body - Pull',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Deadlift',
                        tier: 'Anchor',
                        sets: 3,
                        reps: '5-8',
                        rpe: '7-8',
                        rest: '3-4min',
                        isAnchorLift: true
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Saturday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Sunday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  }
                ]
              },
              {
                weekNumber: 3,
                phaseWeek: 3,
                progressionStrategy: 'Linear',
                intensityFocus: 'Volume Accumulation',
                days: [
                  {
                    dayOfWeek: 'Monday',
                    focus: 'Upper Body - Push',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Bench Press',
                        tier: 'Anchor',
                        sets: 3,
                        reps: '5-8',
                        rpe: '7-8',
                        rest: '3-4min',
                        isAnchorLift: true
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Tuesday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Wednesday',
                    focus: 'Lower Body',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Squat',
                        tier: 'Anchor',
                        sets: 3,
                        reps: '5-8',
                        rpe: '7-8',
                        rest: '3-4min',
                        isAnchorLift: true
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Thursday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Friday',
                    focus: 'Upper Body - Pull',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Deadlift',
                        tier: 'Anchor',
                        sets: 3,
                        reps: '5-8',
                        rpe: '7-8',
                        rest: '3-4min',
                        isAnchorLift: true
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Saturday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Sunday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  }
                ]
              },
              {
                weekNumber: 4,
                phaseWeek: 4,
                progressionStrategy: 'Linear',
                intensityFocus: 'Volume Accumulation',
                days: [
                  {
                    dayOfWeek: 'Monday',
                    focus: 'Upper Body - Push',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Bench Press',
                        tier: 'Anchor',
                        sets: 3,
                        reps: '5-8',
                        rpe: '7-8',
                        rest: '3-4min',
                        isAnchorLift: true
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Tuesday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Wednesday',
                    focus: 'Lower Body',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Squat',
                        tier: 'Anchor',
                        sets: 3,
                        reps: '5-8',
                        rpe: '7-8',
                        rest: '3-4min',
                        isAnchorLift: true
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Thursday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Friday',
                    focus: 'Upper Body - Pull',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Deadlift',
                        tier: 'Anchor',
                        sets: 3,
                        reps: '5-8',
                        rpe: '7-8',
                        rest: '3-4min',
                        isAnchorLift: true
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Saturday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Sunday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = guardian.validateProgram(validProgram);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing anchor lifts', () => {
      const invalidProgram: TrainingProgram = {
        programName: 'Test Program',
        description: 'A test program',
        durationWeeksTotal: 1,
        coachIntro: 'Welcome to your program',
        generalAdvice: 'Follow the program as written',
        periodizationModel: 'Linear',
        phases: [
          {
            phaseName: 'Accumulation',
            phaseType: 'Accumulation',
            durationWeeks: 1,
            primaryGoal: 'Build volume',
            weeks: [
              {
                weekNumber: 1,
                phaseWeek: 1,
                progressionStrategy: 'Linear',
                intensityFocus: 'Volume Accumulation',
                days: [
                  {
                    dayOfWeek: 'Monday',
                    focus: 'Upper Body - Push',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Push-ups',
                        tier: 'Primary',
                        sets: 3,
                        reps: '8-10',
                        rpe: '7-8',
                        rest: '2-3min',
                        isAnchorLift: false
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Tuesday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Wednesday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Thursday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Friday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Saturday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Sunday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = guardian.validateProgram(invalidProgram);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('SCIENTIFIC');
      expect(result.errors[0].severity).toBe('HIGH');
      expect(result.errors[0].message).toContain('No anchor lift found');
    });

    it('should detect structural duration mismatch', () => {
      const invalidProgram: TrainingProgram = {
        programName: 'Test Program',
        description: 'A test program',
        durationWeeksTotal: 8, // Declares 8 weeks
        coachIntro: 'Welcome to your program',
        generalAdvice: 'Follow the program as written',
        periodizationModel: 'Linear',
        phases: [
          {
            phaseName: 'Accumulation',
            phaseType: 'Accumulation',
            durationWeeks: 4, // But only has 4 weeks
            primaryGoal: 'Build volume',
            weeks: [
              {
                weekNumber: 1,
                phaseWeek: 1,
                progressionStrategy: 'Linear',
                intensityFocus: 'Volume Accumulation',
                days: [
                  {
                    dayOfWeek: 'Monday',
                    focus: 'Upper Body - Push',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Bench Press',
                        tier: 'Anchor',
                        sets: 3,
                        reps: '5-8',
                        rpe: '7-8',
                        rest: '3-4min',
                        isAnchorLift: true
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Tuesday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Wednesday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Thursday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Friday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Saturday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Sunday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = guardian.validateProgram(invalidProgram);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors.some(e => e.type === 'STRUCTURAL' && e.severity === 'HIGH' && e.message.includes('Total duration mismatch'))).toBe(true);
      expect(result.errors.some(e => e.type === 'STRUCTURAL' && e.severity === 'HIGH' && e.message.includes('Phase duration mismatch'))).toBe(true);
    });

    it('should detect invalid set counts', () => {
      const invalidProgram: TrainingProgram = {
        programName: 'Test Program',
        description: 'A test program',
        durationWeeksTotal: 1,
        coachIntro: 'Welcome to your program',
        generalAdvice: 'Follow the program as written',
        periodizationModel: 'Linear',
        phases: [
          {
            phaseName: 'Accumulation',
            phaseType: 'Accumulation',
            durationWeeks: 1,
            primaryGoal: 'Build volume',
            weeks: [
              {
                weekNumber: 1,
                phaseWeek: 1,
                progressionStrategy: 'Linear',
                intensityFocus: 'Volume Accumulation',
                days: [
                  {
                    dayOfWeek: 'Monday',
                    focus: 'Upper Body - Push',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Bench Press',
                        tier: 'Anchor',
                        sets: 1, // Valid schema but low for anchor lift
                        reps: '5-8',
                        rpe: '7-8',
                        rest: '3-4min',
                        isAnchorLift: true
                      },
                      {
                        name: 'Push-ups',
                        tier: 'Primary',
                        sets: 1, // Valid schema but low for primary exercise
                        reps: '8-10',
                        rpe: '7-8',
                        rest: '2-3min',
                        isAnchorLift: false
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Tuesday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Wednesday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Thursday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Friday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Saturday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Sunday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = guardian.validateProgram(invalidProgram);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors.some(e => e.type === 'SCIENTIFIC' && e.severity === 'MEDIUM' && e.message.includes('Low set count'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('Bench Press') && e.message.includes('Anchor tier'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('Push-ups') && e.message.includes('Primary tier'))).toBe(true);
    });

    it('should detect schema validation errors', () => {
      const invalidProgram = {
        programName: '', // Invalid: empty string
        description: 'A test program',
        durationWeeksTotal: 4,
        coachIntro: 'Welcome to your program',
        generalAdvice: 'Follow the program as written',
        periodizationModel: 'Linear',
        phases: []
      };

      const result = guardian.validateProgram(invalidProgram);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('SCHEMA');
      expect(result.errors[0].severity).toBe('CRITICAL');
      expect(result.errors[0].message).toContain('Schema validation failed');
    });

    it('should warn about high set counts', () => {
      const programWithHighSets: TrainingProgram = {
        programName: 'Test Program',
        description: 'A test program',
        durationWeeksTotal: 1,
        coachIntro: 'Welcome to your program',
        generalAdvice: 'Follow the program as written',
        periodizationModel: 'Linear',
        phases: [
          {
            phaseName: 'Accumulation',
            phaseType: 'Accumulation',
            durationWeeks: 1,
            primaryGoal: 'Build volume',
            weeks: [
              {
                weekNumber: 1,
                phaseWeek: 1,
                progressionStrategy: 'Linear',
                intensityFocus: 'Volume Accumulation',
                days: [
                  {
                    dayOfWeek: 'Monday',
                    focus: 'Upper Body - Push',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Bench Press',
                        tier: 'Anchor',
                        sets: 3,
                        reps: '5-8',
                        rpe: '7-8',
                        rest: '3-4min',
                        isAnchorLift: true
                      },
                      {
                        name: 'Push-ups',
                        tier: 'Primary',
                        sets: 10, // High set count
                        reps: '8-10',
                        rpe: '7-8',
                        rest: '2-3min',
                        isAnchorLift: false
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Tuesday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Wednesday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Thursday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Friday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Saturday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Sunday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = guardian.validateProgram(programWithHighSets);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('OPTIMIZATION');
      expect(result.warnings[0].message).toContain('High set count');
    });

    it('should warn about anchor lift not being first', () => {
      const programWithWrongOrder: TrainingProgram = {
        programName: 'Test Program',
        description: 'A test program',
        durationWeeksTotal: 1,
        coachIntro: 'Welcome to your program',
        generalAdvice: 'Follow the program as written',
        periodizationModel: 'Linear',
        phases: [
          {
            phaseName: 'Accumulation',
            phaseType: 'Accumulation',
            durationWeeks: 1,
            primaryGoal: 'Build volume',
            weeks: [
              {
                weekNumber: 1,
                phaseWeek: 1,
                progressionStrategy: 'Linear',
                intensityFocus: 'Volume Accumulation',
                days: [
                  {
                    dayOfWeek: 'Monday',
                    focus: 'Upper Body - Push',
                    isRestDay: false,
                    exercises: [
                      {
                        name: 'Push-ups',
                        tier: 'Primary',
                        sets: 3,
                        reps: '8-10',
                        rpe: '7-8',
                        rest: '2-3min',
                        isAnchorLift: false
                      },
                      {
                        name: 'Bench Press',
                        tier: 'Anchor',
                        sets: 3,
                        reps: '5-8',
                        rpe: '7-8',
                        rest: '3-4min',
                        isAnchorLift: true
                      }
                    ]
                  },
                  {
                    dayOfWeek: 'Tuesday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Wednesday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Thursday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Friday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Saturday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  },
                  {
                    dayOfWeek: 'Sunday',
                    focus: 'Rest',
                    isRestDay: true,
                    exercises: []
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = guardian.validateProgram(programWithWrongOrder);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(2);
      expect(result.warnings.some(w => w.type === 'BEST_PRACTICE' && w.message.includes('Anchor lift should be performed first'))).toBe(true);
      expect(result.warnings.some(w => w.type === 'BEST_PRACTICE' && w.message.includes('Exercise order may not follow optimal hierarchy'))).toBe(true);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(guardianLayer).toBeDefined();
      expect(typeof guardianLayer.validateProgram).toBe('function');
    });

    it('should create new instances for testing', () => {
      const testGuardian = createGuardianLayer();
      expect(testGuardian).toBeDefined();
      expect(testGuardian).not.toBe(guardianLayer);
    });
  });
}); 