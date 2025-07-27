import { findMuscleGroupForExercise, MuscleGroup } from '@/lib/types'

describe('Enhanced Muscle Group Categorization', () => {
  describe('Exact matches (existing functionality)', () => {
    it('should correctly categorize predefined exercises', () => {
      expect(findMuscleGroupForExercise('Squats')).toBe(MuscleGroup.LEGS)
      expect(findMuscleGroupForExercise('Bench Press')).toBe(MuscleGroup.CHEST)
      expect(findMuscleGroupForExercise('Pull-Ups')).toBe(MuscleGroup.BACK)
      expect(findMuscleGroupForExercise('Overhead Press')).toBe(MuscleGroup.SHOULDERS)
      expect(findMuscleGroupForExercise('Bicep Curls')).toBe(MuscleGroup.ARMS)
      expect(findMuscleGroupForExercise('Planks')).toBe(MuscleGroup.CORE)
      expect(findMuscleGroupForExercise('Running')).toBe(MuscleGroup.CARDIO)
    })

    it('should be case insensitive for exact matches', () => {
      expect(findMuscleGroupForExercise('SQUATS')).toBe(MuscleGroup.LEGS)
      expect(findMuscleGroupForExercise('bench press')).toBe(MuscleGroup.CHEST)
      expect(findMuscleGroupForExercise('Pull-ups')).toBe(MuscleGroup.BACK)
    })
  })

  describe('Fuzzy matching for variations', () => {
    it('should handle minor spelling variations', () => {
      expect(findMuscleGroupForExercise('Squats')).toBe(MuscleGroup.LEGS) // exact
      expect(findMuscleGroupForExercise('Squat')).toBe(MuscleGroup.LEGS) // fuzzy
      expect(findMuscleGroupForExercise('Bench Presses')).toBe(MuscleGroup.CHEST) // fuzzy
      expect(findMuscleGroupForExercise('Pull Up')).toBe(MuscleGroup.BACK) // fuzzy
    })
  })

  describe('LLM-generated exercise name variations', () => {
    describe('Legs exercises', () => {
      it('should categorize squat variations', () => {
        expect(findMuscleGroupForExercise('Barbell Squats')).toBe(MuscleGroup.LEGS)
        expect(findMuscleGroupForExercise('Dumbbell Squats')).toBe(MuscleGroup.LEGS)
        expect(findMuscleGroupForExercise('Goblet Squats')).toBe(MuscleGroup.LEGS)
        expect(findMuscleGroupForExercise('Front Squats')).toBe(MuscleGroup.LEGS)
        expect(findMuscleGroupForExercise('Bulgarian Split Squats')).toBe(MuscleGroup.LEGS)
      })

      it('should categorize deadlift variations', () => {
        // Romanian deadlifts are often categorized as back due to posterior chain focus
        expect(findMuscleGroupForExercise('Romanian Deadlifts')).toBe(MuscleGroup.BACK)
        expect(findMuscleGroupForExercise('Sumo Deadlifts')).toBe(MuscleGroup.LEGS)
        expect(findMuscleGroupForExercise('Single Leg Deadlifts')).toBe(MuscleGroup.LEGS)
        expect(findMuscleGroupForExercise('Barbell Deadlifts')).toBe(MuscleGroup.LEGS)
      })

      it('should categorize lunge variations', () => {
        expect(findMuscleGroupForExercise('Walking Lunges')).toBe(MuscleGroup.LEGS)
        expect(findMuscleGroupForExercise('Reverse Lunges')).toBe(MuscleGroup.LEGS)
        expect(findMuscleGroupForExercise('Forward Lunges')).toBe(MuscleGroup.LEGS)
        expect(findMuscleGroupForExercise('Dumbbell Lunges')).toBe(MuscleGroup.LEGS)
      })

      it('should categorize leg-specific exercises', () => {
        expect(findMuscleGroupForExercise('Leg Press')).toBe(MuscleGroup.LEGS)
        expect(findMuscleGroupForExercise('Leg Curls')).toBe(MuscleGroup.LEGS)
        expect(findMuscleGroupForExercise('Leg Extensions')).toBe(MuscleGroup.LEGS)
        expect(findMuscleGroupForExercise('Calf Raises')).toBe(MuscleGroup.LEGS)
        expect(findMuscleGroupForExercise('Hip Thrusts')).toBe(MuscleGroup.LEGS)
      })
    })

    describe('Chest exercises', () => {
      it('should categorize bench press variations', () => {
        expect(findMuscleGroupForExercise('Dumbbell Bench Press')).toBe(MuscleGroup.CHEST)
        expect(findMuscleGroupForExercise('Incline Bench Press')).toBe(MuscleGroup.CHEST)
        expect(findMuscleGroupForExercise('Decline Bench Press')).toBe(MuscleGroup.CHEST)
        expect(findMuscleGroupForExercise('Barbell Bench Press')).toBe(MuscleGroup.CHEST)
      })

      it('should categorize push-up variations', () => {
        expect(findMuscleGroupForExercise('Push-Ups')).toBe(MuscleGroup.CHEST)
        expect(findMuscleGroupForExercise('Push Ups')).toBe(MuscleGroup.CHEST)
        expect(findMuscleGroupForExercise('Diamond Push-Ups')).toBe(MuscleGroup.CHEST)
        expect(findMuscleGroupForExercise('Incline Push-Ups')).toBe(MuscleGroup.CHEST)
      })

      it('should categorize fly variations', () => {
        expect(findMuscleGroupForExercise('Dumbbell Flys')).toBe(MuscleGroup.CHEST)
        expect(findMuscleGroupForExercise('Cable Flys')).toBe(MuscleGroup.CHEST)
        expect(findMuscleGroupForExercise('Chest Flys')).toBe(MuscleGroup.CHEST)
      })
    })

    describe('Back exercises', () => {
      it('should categorize pull-up variations', () => {
        expect(findMuscleGroupForExercise('Wide Grip Pull-Ups')).toBe(MuscleGroup.BACK)
        expect(findMuscleGroupForExercise('Chin-Ups')).toBe(MuscleGroup.BACK)
        expect(findMuscleGroupForExercise('Assisted Pull-Ups')).toBe(MuscleGroup.BACK)
        expect(findMuscleGroupForExercise('Lat Pulldowns')).toBe(MuscleGroup.BACK)
      })

      it('should categorize row variations', () => {
        expect(findMuscleGroupForExercise('Bent-Over Rows')).toBe(MuscleGroup.BACK)
        expect(findMuscleGroupForExercise('Seated Cable Rows')).toBe(MuscleGroup.BACK)
        expect(findMuscleGroupForExercise('Dumbbell Rows')).toBe(MuscleGroup.BACK)
        expect(findMuscleGroupForExercise('Barbell Rows')).toBe(MuscleGroup.BACK)
        expect(findMuscleGroupForExercise('T-Bar Rows')).toBe(MuscleGroup.BACK)
      })
    })

    describe('Shoulder exercises', () => {
      it('should categorize overhead press variations', () => {
        expect(findMuscleGroupForExercise('Dumbbell Overhead Press')).toBe(MuscleGroup.SHOULDERS)
        expect(findMuscleGroupForExercise('Military Press')).toBe(MuscleGroup.SHOULDERS)
        expect(findMuscleGroupForExercise('Seated Shoulder Press')).toBe(MuscleGroup.SHOULDERS)
        expect(findMuscleGroupForExercise('Arnold Press')).toBe(MuscleGroup.SHOULDERS)
      })

      it('should categorize raise variations', () => {
        expect(findMuscleGroupForExercise('Lateral Raises')).toBe(MuscleGroup.SHOULDERS)
        expect(findMuscleGroupForExercise('Front Raises')).toBe(MuscleGroup.SHOULDERS)
        expect(findMuscleGroupForExercise('Rear Delt Raises')).toBe(MuscleGroup.SHOULDERS)
        expect(findMuscleGroupForExercise('Side Raises')).toBe(MuscleGroup.SHOULDERS)
      })
    })

    describe('Arms exercises', () => {
      it('should categorize bicep variations', () => {
        expect(findMuscleGroupForExercise('Barbell Curls')).toBe(MuscleGroup.ARMS)
        expect(findMuscleGroupForExercise('Dumbbell Curls')).toBe(MuscleGroup.ARMS)
        expect(findMuscleGroupForExercise('Hammer Curls')).toBe(MuscleGroup.ARMS)
        expect(findMuscleGroupForExercise('Preacher Curls')).toBe(MuscleGroup.ARMS)
      })

      it('should categorize tricep variations', () => {
        expect(findMuscleGroupForExercise('Tricep Dips')).toBe(MuscleGroup.ARMS)
        expect(findMuscleGroupForExercise('Skull Crushers')).toBe(MuscleGroup.ARMS)
        expect(findMuscleGroupForExercise('Tricep Pushdowns')).toBe(MuscleGroup.ARMS)
        expect(findMuscleGroupForExercise('Close-Grip Bench Press')).toBe(MuscleGroup.ARMS)
        expect(findMuscleGroupForExercise('Overhead Tricep Extension')).toBe(MuscleGroup.ARMS)
      })
    })

    describe('Core exercises', () => {
      it('should categorize plank variations', () => {
        expect(findMuscleGroupForExercise('Side Planks')).toBe(MuscleGroup.CORE)
        expect(findMuscleGroupForExercise('Elbow Planks')).toBe(MuscleGroup.CORE)
        expect(findMuscleGroupForExercise('Front Planks')).toBe(MuscleGroup.CORE)
      })

      it('should categorize crunch and ab variations', () => {
        expect(findMuscleGroupForExercise('Bicycle Crunches')).toBe(MuscleGroup.CORE)
        expect(findMuscleGroupForExercise('Sit-Ups')).toBe(MuscleGroup.CORE)
        expect(findMuscleGroupForExercise('Russian Twists')).toBe(MuscleGroup.CORE)
        expect(findMuscleGroupForExercise('Hanging Leg Raises')).toBe(MuscleGroup.CORE)
        expect(findMuscleGroupForExercise('Mountain Climbers')).toBe(MuscleGroup.CORE)
      })
    })

    describe('Cardio exercises', () => {
      it('should categorize running variations', () => {
        expect(findMuscleGroupForExercise('Treadmill Running')).toBe(MuscleGroup.CARDIO)
        expect(findMuscleGroupForExercise('Jogging')).toBe(MuscleGroup.CARDIO)
        expect(findMuscleGroupForExercise('Sprints')).toBe(MuscleGroup.CARDIO)
      })

      it('should categorize other cardio exercises', () => {
        expect(findMuscleGroupForExercise('Stationary Bike')).toBe(MuscleGroup.CARDIO)
        expect(findMuscleGroupForExercise('Rowing Machine')).toBe(MuscleGroup.CARDIO)
        expect(findMuscleGroupForExercise('Jump Rope')).toBe(MuscleGroup.CARDIO)
        expect(findMuscleGroupForExercise('Burpees')).toBe(MuscleGroup.CARDIO)
        expect(findMuscleGroupForExercise('Box Jumps')).toBe(MuscleGroup.CARDIO)
      })
    })
  })

  describe('Complex exercise names', () => {
    it('should handle equipment-specific variations', () => {
      expect(findMuscleGroupForExercise('Machine Chest Press')).toBe(MuscleGroup.CHEST)
      expect(findMuscleGroupForExercise('Cable Lateral Raises')).toBe(MuscleGroup.SHOULDERS)
      expect(findMuscleGroupForExercise('Dumbbell Romanian Deadlifts')).toBe(MuscleGroup.LEGS)
    })

    it('should handle descriptive exercise names', () => {
      expect(findMuscleGroupForExercise('Seated Dumbbell Shoulder Press')).toBe(MuscleGroup.SHOULDERS)
      expect(findMuscleGroupForExercise('Standing Barbell Curls')).toBe(MuscleGroup.ARMS)
      expect(findMuscleGroupForExercise('Lying Tricep Extensions')).toBe(MuscleGroup.ARMS)
    })
  })

  describe('Edge cases', () => {
    it('should handle empty or invalid input', () => {
      expect(findMuscleGroupForExercise('')).toBe(MuscleGroup.OTHER)
      expect(findMuscleGroupForExercise('   ')).toBe(MuscleGroup.OTHER)
      expect(findMuscleGroupForExercise('Random Unknown Exercise')).toBe(MuscleGroup.OTHER)
    })

    it('should handle ambiguous exercises correctly', () => {
      // These exercises might have keywords from multiple groups
      // The algorithm should pick the most relevant one
      expect(findMuscleGroupForExercise('Dumbbell Row')).toBe(MuscleGroup.BACK)
      expect(findMuscleGroupForExercise('Cable Row')).toBe(MuscleGroup.BACK)
    })
  })

  describe('Performance considerations', () => {
    it('should categorize exercises efficiently', () => {
      const start = performance.now()
      
      const testExercises = [
        'Barbell Squats',
        'Dumbbell Bench Press',
        'Pull-Ups',
        'Overhead Press',
        'Bicep Curls',
        'Planks',
        'Running'
      ]
      
      testExercises.forEach(exercise => {
        findMuscleGroupForExercise(exercise)
      })
      
      const end = performance.now()
      const duration = end - start
      
      // Should complete all categorizations in under 10ms
      expect(duration).toBeLessThan(10)
    })
  })
}) 