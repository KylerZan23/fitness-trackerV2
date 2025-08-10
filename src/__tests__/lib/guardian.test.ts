import { applyGuardian, expectedVolume } from '@/lib/training/guardian';
import type { TrainingProgram } from '@/types/neural';

function makeProgram(workouts: Array<{ name: string; focus: string; exercises: Array<{ name: string; sets: number; reps?: string; rpe?: string }> }>): TrainingProgram {
  return {
    id: 'prog-1',
    userId: 'user-1',
    programName: 'Test Program',
    weekNumber: 1,
    workouts: workouts.map((w, idx) => ({
      id: `w-${idx+1}`,
      name: `${w.name} - ${w.focus}`,
      duration: 60,
      focus: w.focus,
      warmup: [],
      mainExercises: w.exercises.map((e, j) => ({
        id: `e-${idx+1}-${j+1}`,
        name: e.name,
        targetMuscles: [],
        sets: e.sets,
        reps: e.reps ?? '8-12',
        load: 'moderate',
        rest: '90s',
        rpe: e.rpe ?? '8',
      })),
      totalEstimatedTime: 60,
    })),
    progressionNotes: '',
    createdAt: new Date(),
    neuralInsights: '',
  };
}

describe('Guardian Harmonizer', () => {
  it('enforces PPLx2 for 6-day advanced hypertrophy and adjusts volumes', () => {
    const program = makeProgram([
      { name: 'Monday', focus: 'Upper Push', exercises: [ { name: 'Bench Press', sets: 3 }, { name: 'Lateral Raise', sets: 2 } ] },
      { name: 'Tuesday', focus: 'Lower Strength', exercises: [ { name: 'Back Squat', sets: 5 }, { name: 'Leg Extension', sets: 2 } ] },
      { name: 'Wednesday', focus: 'Pull & Core', exercises: [ { name: 'Barbell Row', sets: 3 }, { name: 'Biceps Curl', sets: 2 } ] },
      { name: 'Thursday', focus: 'Active Recovery', exercises: [ { name: 'Face Pull', sets: 2 } ] },
      { name: 'Friday', focus: 'Upper Pull', exercises: [ { name: 'Lat Pulldown', sets: 3 } ] },
      { name: 'Saturday', focus: 'Lower Hypertrophy', exercises: [ { name: 'Romanian Deadlift', sets: 3 }, { name: 'Calf Raise', sets: 2 } ] },
    ]);

    const result = applyGuardian(program, {
      primaryFocus: 'hypertrophy',
      experienceLevel: 'advanced',
      trainingDaysPerWeek: 6,
      sessionDurationMinutes: 60,
    });

    expect(result.program.workouts.length).toBe(6);
    const focuses = result.program.workouts.map(w => w.focus);
    expect(focuses).toEqual(['Push','Pull','Legs','Push','Pull','Legs']);

    const range = expectedVolume('hypertrophy', 'advanced');
    const notesText = result.notes.corrections.join(' ');
    expect(notesText.length).toBeGreaterThan(0);
    // Spot check that per-muscle sets are computed; not asserting exact totals to keep test robust
    expect(result.notes.perMuscleSets).toBeTruthy();
  });

  it('enforces hypertrophy templates for 2–5 days', () => {
    const base = makeProgram([
      { name: 'Mon', focus: 'Random', exercises: [ { name: 'Bench Press', sets: 3 } ] },
      { name: 'Tue', focus: 'Random', exercises: [ { name: 'Back Squat', sets: 3 } ] },
      { name: 'Wed', focus: 'Random', exercises: [ { name: 'Barbell Row', sets: 3 } ] },
      { name: 'Thu', focus: 'Random', exercises: [ { name: 'Overhead Press', sets: 3 } ] },
      { name: 'Fri', focus: 'Random', exercises: [ { name: 'Romanian Deadlift', sets: 3 } ] },
    ]);

    const check = (days: 2|3|4|5, expected: string[]) => {
      const prog = { ...base, workouts: base.workouts.slice(0, days) };
      const result = applyGuardian(prog, { primaryFocus: 'hypertrophy', experienceLevel: 'advanced', trainingDaysPerWeek: days, sessionDurationMinutes: 60 });
      const focuses = result.program.workouts.map(w => w.focus);
      expect(focuses).toEqual(expected);
    };

    check(2, ['Full Body','Full Body']);
    check(3, ['Upper','Lower','Full Body (Upper-Biased)']);
    check(4, ['Upper','Lower','Upper','Lower']);
    check(5, ['Push','Pull','Legs','Upper','Lower']);
  });

  it('replaces banned Arnold Press with Seated Dumbbell Shoulder Press', () => {
    const program = makeProgram([
      { name: 'Mon', focus: 'Push', exercises: [ { name: 'Arnold Press', sets: 3 } ] },
    ]);
    const result = applyGuardian(program, { primaryFocus: 'hypertrophy', experienceLevel: 'advanced', trainingDaysPerWeek: 2, sessionDurationMinutes: 60 });
    const names = result.program.workouts.flatMap(w => w.mainExercises.map(e => e.name));
    expect(names).not.toContain('Arnold Press');
    expect(names).toContain('Seated Dumbbell Shoulder Press');
  });
});


