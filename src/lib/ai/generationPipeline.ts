// src/lib/ai/generationPipeline.ts

import { openaiService } from '@/lib/services/openaiService';
import { guardianLayer, ValidationResult } from '@/lib/ai/guardian';
import { 
  createMacroStructurePrompt, 
  createSessionDetailPrompt, 
  createNarrativePrompt,
  UserProfile,
  determineSplitType,
  generateWorkoutFocus,
  isRestDay
} from '@/lib/ai/prompts';
import {
  TrainingProgram,
  TrainingProgramSchema,
  ProgramScaffold,
  ProgramScaffoldSchema,
  WorkoutDay,
  WorkoutDaySchema,
  NarrativeContent,
  NarrativeContentSchema,
  DayOfWeek
} from '@/lib/types/program';

export interface GenerationResult {
  success: boolean;
  program?: TrainingProgram;
  validationResult?: ValidationResult;
  error?: string;
  metadata: {
    totalGenerationTime: number;
    stepsCompleted: number;
    llmCalls: number;
    retryAttempts: number;
  };
}

export interface GenerationConfig {
  maxRetries: number;
  enableParallelGeneration: boolean;
  validationLevel: 'strict' | 'lenient';
  logLevel: 'verbose' | 'normal' | 'minimal';
}

const DEFAULT_CONFIG: GenerationConfig = {
  maxRetries: 3,
  enableParallelGeneration: true,
  validationLevel: 'strict',
  logLevel: 'normal'
};

/**
 * Main Generation Pipeline Service
 * Orchestrates the 3-step program generation process
 */
export class GenerationPipeline {
  private config: GenerationConfig;
  private logger: (message: string, level?: string) => void;

  constructor(config: Partial<GenerationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = this.createLogger();
  }

  /**
   * Main entry point - generates complete training program
   */
  async generateProgram(userProfile: UserProfile): Promise<GenerationResult> {
    const startTime = Date.now();
    const metadata = {
      totalGenerationTime: 0,
      stepsCompleted: 0,
      llmCalls: 0,
      retryAttempts: 0
    };

    try {
      this.logger(`Starting program generation for ${userProfile.name}`, 'info');

      // Step 1: Generate macro-structure
      this.logger('Step 1: Generating program macro-structure...', 'info');
      const scaffold = await this.generateMacroStructure(userProfile);
      metadata.stepsCompleted = 1;
      metadata.llmCalls++;

      // Step 2: Generate session details (parallel)
      this.logger('Step 2: Generating workout sessions...', 'info');
      const detailedProgram = await this.generateSessionDetails(userProfile, scaffold);
      metadata.stepsCompleted = 2;
      metadata.llmCalls += this.countWorkoutDays(scaffold);

      // Step 3: Generate narrative content
      this.logger('Step 3: Generating narrative content...', 'info');
      const narrativeContent = await this.generateNarrativeContent(userProfile, scaffold);
      metadata.stepsCompleted = 3;
      metadata.llmCalls++;

      // Combine all components into final program
      const finalProgram = this.assembleProgram(detailedProgram, narrativeContent, scaffold);

      // Step 4: Guardian validation
      this.logger('Step 4: Running Guardian validation...', 'info');
      const validationResult = guardianLayer.validateProgram(finalProgram);

      // Calculate final metadata
      metadata.totalGenerationTime = Date.now() - startTime;

      if (validationResult.isValid) {
        this.logger(`Program generation completed successfully in ${metadata.totalGenerationTime}ms`, 'success');
        return {
          success: true,
          program: finalProgram,
          validationResult,
          metadata
        };
      } else {
        const criticalErrors = validationResult.errors.filter(e => e.severity === 'CRITICAL');
        this.logger(`Program failed validation with ${criticalErrors.length} critical errors`, 'error');
        
        if (this.config.validationLevel === 'lenient' && criticalErrors.length === 0) {
          this.logger('Accepting program with warnings (lenient mode)', 'warning');
          return {
            success: true,
            program: finalProgram,
            validationResult,
            metadata
          };
        }

        return {
          success: false,
          validationResult,
          error: `Validation failed: ${criticalErrors.map(e => e.message).join('; ')}`,
          metadata
        };
      }

    } catch (error) {
      metadata.totalGenerationTime = Date.now() - startTime;
      this.logger(`Program generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown generation error',
        metadata
      };
    }
  }

  /**
   * Step 1: Generate program macro-structure
   */
  private async generateMacroStructure(userProfile: UserProfile): Promise<ProgramScaffold> {
    const prompt = createMacroStructurePrompt(userProfile);
    
    try {
      const scaffold = await openaiService.generateWithRetry(
        prompt,
        ProgramScaffoldSchema,
        this.config.maxRetries
      );

      this.logger(`Generated scaffold: ${scaffold.programName} (${scaffold.durationWeeksTotal} weeks)`, 'verbose');
      return scaffold;

    } catch (error) {
      throw new Error(`Failed to generate macro-structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Step 2: Generate detailed workout sessions
   */
  private async generateSessionDetails(
    userProfile: UserProfile, 
    scaffold: ProgramScaffold
  ): Promise<TrainingProgram> {
    const splitType = determineSplitType(userProfile.trainingFrequencyDays);
    const workoutPromises: Array<Promise<{ weekIdx: number, phaseIdx: number, dayIdx: number, workout: WorkoutDay }>> = [];

    // Create prompts for all workout days
    scaffold.phases.forEach((phase, phaseIdx) => {
      phase.weeks.forEach((week, weekIdx) => {
        const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        daysOfWeek.forEach((dayOfWeek, dayIdx) => {
          const focus = generateWorkoutFocus(dayOfWeek, userProfile.trainingFrequencyDays, splitType);
          const isRest = isRestDay(dayOfWeek, userProfile.trainingFrequencyDays);

          if (isRest) {
            // Handle rest days synchronously
            const restDay: WorkoutDay = {
              dayOfWeek,
              focus: 'Rest',
              isRestDay: true,
              exercises: [],
              estimatedDuration: undefined
            };

            workoutPromises.push(Promise.resolve({
              weekIdx,
              phaseIdx,
              dayIdx,
              workout: restDay
            }));
          } else {
            // Generate training days with LLM
            const prompt = createSessionDetailPrompt(
              userProfile,
              dayOfWeek,
              focus,
              week.weekNumber,
              week.phaseWeek,
              week.intensityFocus,
              week.progressionStrategy
            );

            const workoutPromise = openaiService.generateWithRetry(
              prompt,
              WorkoutDaySchema,
              this.config.maxRetries
            ).then(workout => ({
              weekIdx,
              phaseIdx,
              dayIdx,
              workout
            }));

            workoutPromises.push(workoutPromise);
          }
        });
      });
    });

    try {
      // Execute all workout generation in parallel (or series based on config)
      const workoutResults = this.config.enableParallelGeneration 
        ? await Promise.all(workoutPromises)
        : await this.executeSequentially(workoutPromises);

      // Assemble results back into the program structure
      const detailedProgram = this.assembleWorkoutResults(scaffold, workoutResults);
      
      this.logger(`Generated ${workoutResults.length} workout sessions`, 'verbose');
      return detailedProgram;

    } catch (error) {
      throw new Error(`Failed to generate workout sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Step 3: Generate narrative content
   */
  private async generateNarrativeContent(
    userProfile: UserProfile, 
    scaffold: ProgramScaffold
  ): Promise<NarrativeContent> {
    const prompt = createNarrativePrompt(userProfile, scaffold);
    
    try {
      const narrative = await openaiService.generateWithRetry(
        prompt,
        NarrativeContentSchema,
        this.config.maxRetries
      );

      this.logger('Generated narrative content successfully', 'verbose');
      return narrative;

    } catch (error) {
      throw new Error(`Failed to generate narrative content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute promises sequentially (fallback for parallel generation issues)
   */
  private async executeSequentially<T>(promises: Array<Promise<T>>): Promise<T[]> {
    const results: T[] = [];
    for (const promise of promises) {
      results.push(await promise);
    }
    return results;
  }

  /**
   * Assemble workout results back into the program structure
   */
  private assembleWorkoutResults(
    scaffold: ProgramScaffold,
    workoutResults: Array<{ weekIdx: number, phaseIdx: number, dayIdx: number, workout: WorkoutDay }>
  ): TrainingProgram {
    // Create deep copy of scaffold to avoid mutation
    const program: TrainingProgram = {
      programName: scaffold.programName,
      description: scaffold.description,
      durationWeeksTotal: scaffold.durationWeeksTotal,
      periodizationModel: scaffold.periodizationModel,
      coachIntro: '', // Will be filled by narrative step
      generalAdvice: '', // Will be filled by narrative step
      phases: scaffold.phases.map(phase => ({
        ...phase,
        weeks: phase.weeks.map(week => ({
          ...week,
          days: [] // Will be filled below
        }))
      }))
    };

    // Insert workout results into the correct positions
    workoutResults.forEach(({ weekIdx, phaseIdx, dayIdx, workout }) => {
      if (!program.phases[phaseIdx].weeks[weekIdx].days) {
        program.phases[phaseIdx].weeks[weekIdx].days = [];
      }
      program.phases[phaseIdx].weeks[weekIdx].days[dayIdx] = workout;
    });

    return program;
  }

  /**
   * Combine detailed program with narrative content
   */
  private assembleProgram(
    detailedProgram: TrainingProgram,
    narrativeContent: NarrativeContent,
    scaffold: ProgramScaffold
  ): TrainingProgram {
    return {
      ...detailedProgram,
      coachIntro: narrativeContent.coachIntro,
      generalAdvice: narrativeContent.generalAdvice,
      // Add metadata for Guardian validation
      anchorLifts: this.extractAnchorLifts(detailedProgram),
      totalVolumeProgression: this.calculateVolumeProgression(detailedProgram)
    };
  }

  /**
   * Extract anchor lifts for validation metadata
   */
  private extractAnchorLifts(program: TrainingProgram): string[] {
    const anchorLifts = new Set<string>();
    
    program.phases.forEach(phase => {
      phase.weeks.forEach(week => {
        week.days.forEach(day => {
          day.exercises.forEach(exercise => {
            if (exercise.isAnchorLift || exercise.tier === 'Anchor') {
              anchorLifts.add(exercise.name);
            }
          });
        });
      });
    });

    return Array.from(anchorLifts);
  }

  /**
   * Calculate volume progression for validation
   */
  private calculateVolumeProgression(program: TrainingProgram): string {
    const phaseVolumes = program.phases.map(phase => {
      const weeklyVolumes = phase.weeks.map(week => {
        return week.days.reduce((weekTotal, day) => {
          if (day.isRestDay) return weekTotal;
          return weekTotal + day.exercises.reduce((dayTotal, ex) => dayTotal + ex.sets, 0);
        }, 0);
      });
      
      return {
        phase: phase.phaseName,
        avgVolume: weeklyVolumes.reduce((a, b) => a + b, 0) / weeklyVolumes.length
      };
    });

    return phaseVolumes.map(p => `${p.phase}: ${p.avgVolume.toFixed(1)} sets/week`).join(', ');
  }

  /**
   * Count total workout days for metadata
   */
  private countWorkoutDays(scaffold: ProgramScaffold): number {
    return scaffold.phases.reduce((total, phase) => {
      return total + (phase.weeks.length * 7); // 7 days per week, but rest days are handled locally
    }, 0);
  }

  /**
   * Create logger based on config
   */
  private createLogger(): (message: string, level?: string) => void {
    return (message: string, level: string = 'info') => {
      if (this.config.logLevel === 'minimal' && level === 'verbose') return;
      if (this.config.logLevel === 'normal' && level === 'verbose') return;

      const timestamp = new Date().toISOString();
      const prefix = `[GenerationPipeline ${timestamp}]`;
      
      switch (level) {
        case 'error':
          console.error(`${prefix} ERROR: ${message}`);
          break;
        case 'warning':
          console.warn(`${prefix} WARN: ${message}`);
          break;
        case 'success':
          console.log(`${prefix} SUCCESS: ${message}`);
          break;
        case 'verbose':
          console.debug(`${prefix} DEBUG: ${message}`);
          break;
        default:
          console.log(`${prefix} ${message}`);
      }
    };
  }
}

// Export singleton instance
export const generationPipeline = new GenerationPipeline();

// Export factory for custom configs
export const createGenerationPipeline = (config?: Partial<GenerationConfig>) => 
  new GenerationPipeline(config);

// Export convenience function for simple usage
export const generateProgram = async (userProfile: UserProfile): Promise<GenerationResult> => {
  return generationPipeline.generateProgram(userProfile);
}; 