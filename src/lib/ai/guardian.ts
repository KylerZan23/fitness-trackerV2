// src/lib/ai/guardian.ts

import { z } from 'zod';
import { 
  TrainingProgram, 
  TrainingProgramSchema, 
  TrainingPhase, 
  TrainingWeek, 
  WorkoutDay, 
  ExerciseDetail 
} from '@/lib/types/program';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  repairAttempts?: RepairAttempt[];
}

export interface ValidationError {
  type: 'SCHEMA' | 'SCIENTIFIC' | 'STRUCTURAL';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  message: string;
  location?: string;
  suggestedFix?: string;
}

export interface ValidationWarning {
  type: 'OPTIMIZATION' | 'BEST_PRACTICE';
  message: string;
  location?: string;
}

export interface RepairAttempt {
  type: string;
  attempted: boolean;
  successful: boolean;
  description: string;
}

/**
 * Guardian Layer - Ensures scientific and structural integrity of training programs
 * 
 * This layer performs comprehensive post-generation validation that enforces both 
 * structural integrity and scientific training principles (ADR-051 compliance), 
 * including anchor lift requirements (ADR-048), volume progression logic, and 
 * periodization coherence.
 */
export class GuardianLayer {
  /**
   * Main validation function
   */
  validateProgram(program: unknown): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      repairAttempts: []
    };

    try {
      // Step 1: Schema Validation (Zod)
      const validatedProgram = TrainingProgramSchema.parse(program);
      
      // Step 2: Scientific Principle Validation
      this.validateScientificPrinciples(validatedProgram, result);
      
      // Step 3: Structural Integrity Validation
      this.validateStructuralIntegrity(validatedProgram, result);
      
      // Step 4: Equipment Consistency Validation
      this.validateEquipmentConsistency(validatedProgram, result);
      
      // Determine overall validity
      result.isValid = result.errors.length === 0;
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        result.errors.push({
          type: 'SCHEMA',
          severity: 'CRITICAL',
          message: `Schema validation failed: ${error.message}`,
          suggestedFix: 'Regenerate program with correct schema structure'
        });
      } else {
        result.errors.push({
          type: 'STRUCTURAL',
          severity: 'CRITICAL',
          message: `Unexpected validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
      result.isValid = false;
    }

    return result;
  }

  /**
   * ADR-051: Scientific Principle Validation
   */
  private validateScientificPrinciples(program: TrainingProgram, result: ValidationResult): void {
    // Validate Anchor Lifts (ADR-048)
    this.validateAnchorLifts(program, result);
    
    // Validate Volume Progression (MEV/MAV/MRV)
    this.validateVolumeProgression(program, result);
    
    // Validate Periodization Logic
    this.validatePeriodization(program, result);
    
    // Validate Exercise Selection & Programming
    this.validateExerciseProgramming(program, result);
  }

  /**
   * Validate mandatory anchor lifts per workout (ADR-048)
   */
  private validateAnchorLifts(program: TrainingProgram, result: ValidationResult): void {
    program.phases.forEach((phase, phaseIdx) => {
      phase.weeks.forEach((week, weekIdx) => {
        week.days.forEach((day, dayIdx) => {
          if (!day.isRestDay && day.exercises.length > 0) {
            const anchorLifts = day.exercises.filter(ex => ex.isAnchorLift || ex.tier === 'Anchor');
            
            if (anchorLifts.length === 0) {
              result.errors.push({
                type: 'SCIENTIFIC',
                severity: 'HIGH',
                message: `No anchor lift found for ${day.focus}`,
                location: `Phase ${phaseIdx + 1}, Week ${weekIdx + 1}, ${day.dayOfWeek}`,
                suggestedFix: 'Designate the most neurologically demanding compound lift as anchor'
              });
            }
            
            if (anchorLifts.length > 1) {
              result.warnings.push({
                type: 'OPTIMIZATION',
                message: `Multiple anchor lifts detected for ${day.focus}`,
                location: `Phase ${phaseIdx + 1}, Week ${weekIdx + 1}, ${day.dayOfWeek}`
              });
            }
            
            // Anchor lift should be first exercise
            if (anchorLifts.length > 0 && day.exercises[0].tier !== 'Anchor') {
              result.warnings.push({
                type: 'BEST_PRACTICE',
                message: 'Anchor lift should be performed first in the workout',
                location: `Phase ${phaseIdx + 1}, Week ${weekIdx + 1}, ${day.dayOfWeek}`
              });
            }
          }
        });
      });
    });
  }

  /**
   * Validate volume progression follows MEV/MAV/MRV principles
   */
  private validateVolumeProgression(program: TrainingProgram, result: ValidationResult): void {
    program.phases.forEach((phase, phaseIdx) => {
      if (phase.phaseType === 'Accumulation') {
        // Accumulation phases should show progressive volume increase
        const weeklyVolumes = phase.weeks.map(week => this.calculateWeeklyVolume(week));
        
        for (let i = 1; i < weeklyVolumes.length; i++) {
          if (weeklyVolumes[i] < weeklyVolumes[i - 1]) {
            result.warnings.push({
              type: 'OPTIMIZATION',
              message: 'Volume decreased during accumulation phase',
              location: `Phase ${phaseIdx + 1}, Week ${i + 1}`
            });
          }
        }
      }
      
      if (phase.phaseType === 'Deload') {
        // Deload phases should have significantly reduced volume
        const weeklyVolumes = phase.weeks.map(week => this.calculateWeeklyVolume(week));
        const avgVolume = weeklyVolumes.reduce((a, b) => a + b, 0) / weeklyVolumes.length;
        
        if (avgVolume > 15) { // Arbitrary threshold for deload
          result.warnings.push({
            type: 'OPTIMIZATION',
            message: 'Deload phase volume may be too high',
            location: `Phase ${phaseIdx + 1}`
          });
        }
      }
    });
  }

  /**
   * Calculate weekly training volume (sets × exercises)
   */
  private calculateWeeklyVolume(week: TrainingWeek): number {
    return week.days.reduce((weekTotal, day) => {
      if (day.isRestDay) return weekTotal;
      
      const dayVolume = day.exercises.reduce((dayTotal, exercise) => {
        return dayTotal + exercise.sets;
      }, 0);
      
      return weekTotal + dayVolume;
    }, 0);
  }

  /**
   * Validate periodization logic and phase transitions
   */
  private validatePeriodization(program: TrainingProgram, result: ValidationResult): void {
    // Check phase sequence logic
    const phaseTypes = program.phases.map(p => p.phaseType);
    
    // Common periodization patterns
    const validPatterns = [
      ['Accumulation', 'Intensification', 'Realization'],
      ['Accumulation', 'Deload'],
      ['Accumulation', 'Intensification', 'Deload'],
      ['Accumulation', 'Accumulation', 'Intensification', 'Deload']
    ];
    
    const matchesPattern = validPatterns.some(pattern => 
      this.arraysEqual(phaseTypes.slice(0, pattern.length), pattern)
    );
    
    if (!matchesPattern && program.phases.length > 1) {
      result.warnings.push({
        type: 'OPTIMIZATION',
        message: 'Phase sequence may not follow established periodization patterns',
        location: 'Program structure'
      });
    }
    
    // Validate phase durations
    program.phases.forEach((phase, idx) => {
      if (phase.durationWeeks !== phase.weeks.length) {
        result.errors.push({
          type: 'STRUCTURAL',
          severity: 'HIGH',
          message: `Phase duration mismatch: declared ${phase.durationWeeks} weeks, but has ${phase.weeks.length} weeks`,
          location: `Phase ${idx + 1}: ${phase.phaseName}`
        });
      }
    });
  }

  /**
   * Validate exercise selection and programming parameters
   */
  private validateExerciseProgramming(program: TrainingProgram, result: ValidationResult): void {
    program.phases.forEach((phase, phaseIdx) => {
      phase.weeks.forEach((week, weekIdx) => {
        week.days.forEach((day, dayIdx) => {
          if (!day.isRestDay) {
            // Validate exercise hierarchy (Anchor -> Primary -> Secondary -> Accessory)
            const exerciseOrder = day.exercises.map(ex => ex.tier);
            const idealOrder = ['Anchor', 'Primary', 'Secondary', 'Accessory'];
            
            if (!this.isValidExerciseOrder(exerciseOrder, idealOrder)) {
              result.warnings.push({
                type: 'BEST_PRACTICE',
                message: 'Exercise order may not follow optimal hierarchy',
                location: `Phase ${phaseIdx + 1}, Week ${weekIdx + 1}, ${day.dayOfWeek}`
              });
            }
            
            // Validate set/rep ranges are reasonable
            day.exercises.forEach((exercise, exIdx) => {
              if (exercise.sets > 8) {
                result.warnings.push({
                  type: 'OPTIMIZATION',
                  message: `High set count (${exercise.sets}) for ${exercise.name}`,
                  location: `Phase ${phaseIdx + 1}, Week ${weekIdx + 1}, ${day.dayOfWeek}, Exercise ${exIdx + 1}`
                });
              }
              
              if (exercise.sets < 2 && exercise.tier !== 'Accessory') {
                result.errors.push({
                  type: 'SCIENTIFIC',
                  severity: 'MEDIUM',
                  message: `Low set count (${exercise.sets}) for ${exercise.name} - insufficient for ${exercise.tier} tier`,
                  location: `Phase ${phaseIdx + 1}, Week ${weekIdx + 1}, ${day.dayOfWeek}, Exercise ${exIdx + 1}`
                });
              }
            });
          }
        });
      });
    });
  }

  /**
   * Validate structural integrity and data consistency
   */
  private validateStructuralIntegrity(program: TrainingProgram, result: ValidationResult): void {
    // Validate total duration matches sum of phase durations
    const totalPhaseDuration = program.phases.reduce((sum, phase) => sum + phase.durationWeeks, 0);
    
    if (totalPhaseDuration !== program.durationWeeksTotal) {
      result.errors.push({
        type: 'STRUCTURAL',
        severity: 'HIGH',
        message: `Total duration mismatch: program declares ${program.durationWeeksTotal} weeks, but phases sum to ${totalPhaseDuration} weeks`,
        suggestedFix: 'Ensure phase durations sum to total program duration'
      });
    }
    
    // Validate week numbering is sequential
    let expectedWeekNumber = 1;
    program.phases.forEach((phase, phaseIdx) => {
      phase.weeks.forEach((week, weekIdx) => {
        if (week.weekNumber !== expectedWeekNumber) {
          result.errors.push({
            type: 'STRUCTURAL',
            severity: 'MEDIUM',
            message: `Week numbering error: expected week ${expectedWeekNumber}, found week ${week.weekNumber}`,
            location: `Phase ${phaseIdx + 1}, Week ${weekIdx + 1}`
          });
        }
        expectedWeekNumber++;
      });
    });
  }

  /**
   * Validate equipment consistency (placeholder for future equipment constraints)
   */
  private validateEquipmentConsistency(program: TrainingProgram, result: ValidationResult): void {
    // This would validate against user's available equipment
    // For now, just ensure no obvious inconsistencies
    
    program.phases.forEach((phase, phaseIdx) => {
      phase.weeks.forEach((week, weekIdx) => {
        week.days.forEach((day, dayIdx) => {
          const exerciseNames = day.exercises.map(ex => ex.name.toLowerCase());
          
          // Check for conflicting equipment needs (basic example)
          const hasBarbell = exerciseNames.some(name => name.includes('barbell'));
          const hasDumbbell = exerciseNames.some(name => name.includes('dumbbell'));
          const hasMachine = exerciseNames.some(name => name.includes('machine') || name.includes('cable'));
          
          if (hasBarbell && hasDumbbell && hasMachine && day.exercises.length > 6) {
            result.warnings.push({
              type: 'OPTIMIZATION',
              message: 'Workout may require too many different equipment types',
              location: `Phase ${phaseIdx + 1}, Week ${weekIdx + 1}, ${day.dayOfWeek}`
            });
          }
        });
      });
    });
  }

  // Helper methods
  private arraysEqual<T>(a: T[], b: T[]): boolean {
    return a.length === b.length && a.every((val, idx) => val === b[idx]);
  }

  private isValidExerciseOrder(actual: string[], ideal: string[]): boolean {
    const actualFiltered = actual.filter(tier => ideal.includes(tier));
    const actualIndices = actualFiltered.map(tier => ideal.indexOf(tier));
    
    // Check if indices are in non-decreasing order
    for (let i = 1; i < actualIndices.length; i++) {
      if (actualIndices[i] < actualIndices[i - 1]) {
        return false;
      }
    }
    
    return true;
  }
}

// Export singleton instance
export const guardianLayer = new GuardianLayer();

// Export factory for testing
export const createGuardianLayer = () => new GuardianLayer(); 