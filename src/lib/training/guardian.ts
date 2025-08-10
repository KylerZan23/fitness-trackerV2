import type { TrainingProgram } from '@/types/neural';
import { mapExerciseToMuscles, type Muscle } from './exerciseMuscleMap';

export type Focus = 'hypertrophy' | 'strength' | 'general_fitness';
export type Experience = 'beginner' | 'intermediate' | 'advanced';

export interface VolumeRange { min: number; max: number }

export interface GuardianOptions {
  primaryFocus: Focus;
  experienceLevel: Experience;
  trainingDaysPerWeek?: 2 | 3 | 4 | 5 | 6;
  sessionDurationMinutes?: number;
}

export interface GuardianNotes {
  corrections: string[];
  perMuscleSets: Record<string, number>;
}

export interface GuardianResult {
  program: TrainingProgram;
  notes: GuardianNotes;
}

export function expectedVolume(primaryFocus: Focus, experience: Experience): VolumeRange {
  if (primaryFocus === 'strength') return { min: 10, max: 15 };
  if (primaryFocus === 'general_fitness') return { min: 6, max: 9 };
  // hypertrophy (experience-scaled within 12–20)
  switch (experience) {
    case 'beginner': return { min: 12, max: 14 };
    case 'intermediate': return { min: 12, max: 18 };
    case 'advanced':
    default: return { min: 14, max: 20 };
  }
}

export function enforcePPLx2Template(program: TrainingProgram, opts: GuardianOptions): { program: TrainingProgram; notes: string[] } {
  const notes: string[] = [];
  const isPPLx2Case = opts.primaryFocus === 'hypertrophy' && opts.experienceLevel === 'advanced' && opts.trainingDaysPerWeek === 6;
  if (!isPPLx2Case) return { program, notes };

  const expectedOrder = ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'];
  const newWorkouts = program.workouts.slice(0, 6).map((w, idx) => {
    // Rewrite focus label but retain exercises
    const [day] = (w.name.split(' - ')[0] || 'Day').split(/[\s]/);
    const focus = expectedOrder[idx];
    if (!w.focus.toLowerCase().includes(focus.toLowerCase())) {
      notes.push(`Renamed focus "${w.focus}" → "${focus}" on workout ${idx + 1}`);
    }
    return { ...w, name: `${day} - ${focus}`, focus };
  });

  // Ensure exactly 6 workouts
  let workouts = newWorkouts;
  if (program.workouts.length > 6) {
    notes.push(`Trimmed extra workouts from ${program.workouts.length} → 6 for PPLx2`);
  }
  if (program.workouts.length < 6 && program.workouts.length > 0) {
    // duplicate last with adjusted name; rare fallback
    const last = newWorkouts[newWorkouts.length - 1];
    while (workouts.length < 6) {
      const clone = { ...last, id: crypto.randomUUID(), name: `Day ${workouts.length + 1} - ${expectedOrder[workouts.length]}`, focus: expectedOrder[workouts.length] };
      workouts.push(clone);
      notes.push('Duplicated last workout to fill PPLx2 template');
    }
  }

  return { program: { ...program, workouts }, notes };
}

function enforceHypertrophyTemplate(program: TrainingProgram, opts: GuardianOptions): { program: TrainingProgram; notes: string[] } {
  const notes: string[] = [];
  if (opts.primaryFocus !== 'hypertrophy' || !opts.trainingDaysPerWeek) return { program, notes };
  const days = opts.trainingDaysPerWeek;
  const map: Record<number, string[]> = {
    2: ['Full Body','Full Body'],
    3: ['Upper','Lower','Full Body (Upper-Biased)'],
    4: ['Upper','Lower','Upper','Lower'],
    5: ['Push','Pull','Legs','Upper','Lower'],
    6: ['Push','Pull','Legs','Push','Pull','Legs'],
  };
  const template = map[days];
  if (!template) return { program, notes };

  const dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const workouts = program.workouts.slice(0, template.length).map((w, i) => {
    const desired = template[i];
    if (!w.focus.toLowerCase().includes(desired.split(' ')[0].toLowerCase())) {
      notes.push(`Relabeled focus "${w.focus}" → "${desired}" on day ${i+1}`);
    }
    return { ...w, name: `${dayNames[i]} - ${desired}`, focus: desired };
  });

  return { program: { ...program, workouts }, notes };
}

export function estimateWeeklySets(program: TrainingProgram): Record<Muscle, number> {
  const totals: Record<Muscle, number> = {
    chest: 0, back: 0, delts_front: 0, delts_side: 0, delts_rear: 0,
    biceps: 0, triceps: 0, quads: 0, hamstrings: 0, glutes: 0, calves: 0,
  };
  for (const w of program.workouts) {
    for (const ex of w.mainExercises) {
      const map = mapExerciseToMuscles(ex.name);
      const sets = Number(ex.sets) || 0;
      for (const m of map.primary) totals[m] += sets;
      if (map.secondary) {
        for (const m of map.secondary) totals[m] += Math.round(sets * 0.5);
      }
    }
  }
  return totals;
}

export function harmonizeVolume(program: TrainingProgram, opts: GuardianOptions): { program: TrainingProgram; notes: string[]; perMuscleSets: Record<string, number> } {
  const notes: string[] = [];
  const range = expectedVolume(opts.primaryFocus, opts.experienceLevel);
  const perMuscle = estimateWeeklySets(program);
  const isTimeCapped = (opts.sessionDurationMinutes ?? 60) <= 45;

  // Helper to adjust accessory sets within a workout focus
  const adjustSets = (focus: string, muscle: Muscle, delta: number) => {
    for (const w of program.workouts) {
      if (!w.focus.toLowerCase().includes(focus.toLowerCase())) continue;
      for (const ex of w.mainExercises) {
        const map = mapExerciseToMuscles(ex.name);
        const hits = map.primary.includes(muscle) || map.secondary?.includes(muscle);
        const looksAccessory = /(raise|curl|extension|fly|pulldown|pushdown|face\s*pull|lateral)/i.test(ex.name);
        if (hits && looksAccessory && delta !== 0) {
          const before = ex.sets;
          if (delta > 0) {
            ex.sets = Math.min(before + 1, 5);
            delta -= (ex.sets - before);
          } else {
            ex.sets = Math.max(before - 1, 2);
            delta += (before - ex.sets);
          }
          if (ex.sets !== before) notes.push(`Adjusted ${ex.name} sets ${before}→${ex.sets} on ${w.focus}`);
          if (delta === 0) return;
        }
      }
    }
  };

  const muscles: Muscle[] = ['chest','back','delts_front','delts_side','delts_rear','biceps','triceps','quads','hamstrings','glutes','calves'];
  for (const m of muscles) {
    const total = perMuscle[m];
    if (total < range.min) {
      let needed = range.min - total;
      // prioritize appropriate day types for each muscle
      const focus = m === 'quads' || m === 'hamstrings' || m === 'glutes' || m === 'calves' ? 'Legs' : (m === 'back' || m === 'biceps' || m === 'delts_rear' ? 'Pull' : 'Push');
      if (!isTimeCapped) adjustSets(focus, m, needed);
    } else if (total > range.max) {
      let excess = total - range.max;
      const focus = m === 'quads' || m === 'hamstrings' || m === 'glutes' || m === 'calves' ? 'Legs' : (m === 'back' || m === 'biceps' || m === 'delts_rear' ? 'Pull' : 'Push');
      adjustSets(focus, m, -excess);
    }
  }

  const finalSets = estimateWeeklySets(program);
  return { program, notes, perMuscleSets: finalSets };
}

export function applyGuardian(program: TrainingProgram, opts: GuardianOptions): GuardianResult {
  const aggregateNotes: string[] = [];
  let current = program;
  // General hypertrophy template (2–6 days), then specific 6-day PPLx2 polish
  const t0 = enforceHypertrophyTemplate(current, opts);
  current = t0.program;
  aggregateNotes.push(...t0.notes);
  const t1 = enforcePPLx2Template(current, opts);
  current = t1.program;
  aggregateNotes.push(...t1.notes);
  const t2 = harmonizeVolume(current, opts);
  current = t2.program;
  aggregateNotes.push(...t2.notes);
  // Final banned exercise replacements
  const replaceNotes: string[] = [];
  for (const w of current.workouts) {
    for (const ex of w.mainExercises) {
      const n = ex.name.toLowerCase();
      if (/\barnold\s+press\b/i.test(ex.name)) {
        const before = ex.name;
        ex.name = 'Seated Dumbbell Shoulder Press';
        replaceNotes.push(`Replaced banned exercise "${before}" → "${ex.name}"`);
      }
    }
  }
  if (replaceNotes.length) aggregateNotes.push(...replaceNotes);
  return { program: current, notes: { corrections: aggregateNotes, perMuscleSets: t2.perMuscleSets } };
}


