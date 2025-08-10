export type Muscle =
  | 'chest'
  | 'back'
  | 'delts_front'
  | 'delts_side'
  | 'delts_rear'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves';

export interface ExerciseMapping {
  primary: Muscle[];
  secondary?: Muscle[];
}

// Minimal heuristic mapping. This is intentionally conservative and focused on common lifts.
// Extend as needed for coverage.
export const exerciseToMuscles: Array<{ match: RegExp; map: ExerciseMapping }> = [
  // Push (Chest/Shoulders/Triceps)
  { match: /(bench\s*press|flat\s*bench|barbell\s*bench)/i, map: { primary: ['chest'], secondary: ['triceps', 'delts_front'] } },
  { match: /(incline\s*(bench|dumbbell)|incline\s*press)/i, map: { primary: ['chest', 'delts_front'], secondary: ['triceps'] } },
  { match: /(overhead\s*press|ohp|military\s*press|shoulder\s*press)/i, map: { primary: ['delts_front'], secondary: ['triceps'] } },
  { match: /(lateral\s*raise|side\s*raise)/i, map: { primary: ['delts_side'] } },
  { match: /(flye|pec\s*deck|cable\s*fly)/i, map: { primary: ['chest'] } },
  { match: /(dip\b|weighted\s*dips?)/i, map: { primary: ['chest', 'triceps'] } },
  { match: /(push[- ]?ups?)/i, map: { primary: ['chest'], secondary: ['triceps', 'delts_front'] } },

  // Pull (Back/Biceps)
  { match: /(barbell\s*row|bent[- ]?over\s*row|t[- ]?bar\s*row)/i, map: { primary: ['back'], secondary: ['biceps', 'delts_rear'] } },
  { match: /(one[- ]?arm\s*dumbbell\s*row|single[- ]?arm\s*row|dumbbell\s*row)/i, map: { primary: ['back'], secondary: ['biceps'] } },
  { match: /(pull[- ]?ups?|chin[- ]?ups?)/i, map: { primary: ['back'], secondary: ['biceps'] } },
  { match: /(lat\s*pull[- ]?down|pulldown)/i, map: { primary: ['back'], secondary: ['biceps'] } },
  { match: /(face\s*pull)/i, map: { primary: ['delts_rear'], secondary: ['back'] } },
  { match: /(biceps?\s*curl|hammer\s*curl)/i, map: { primary: ['biceps'] } },

  // Legs (Quads/Hamstrings/Glutes/Calves)
  { match: /(back\s*squat|front\s*squat|squat\b)/i, map: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] } },
  { match: /(leg\s*press)/i, map: { primary: ['quads', 'glutes'] } },
  { match: /(romanian\s*deadlift|rdl|stiff[- ]?leg)/i, map: { primary: ['hamstrings', 'glutes'] } },
  { match: /(deadlift)/i, map: { primary: ['hamstrings', 'glutes', 'back'] } },
  { match: /(bulgarian\s*split\s*squat|split\s*squat|lunge)/i, map: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] } },
  { match: /(leg\s*extension)/i, map: { primary: ['quads'] } },
  { match: /(leg\s*curl|hamstring\s*curl)/i, map: { primary: ['hamstrings'] } },
  { match: /(hip\s*thrust|glute\s*bridge)/i, map: { primary: ['glutes'], secondary: ['hamstrings'] } },
  { match: /(calf\s*raise)/i, map: { primary: ['calves'] } },
];

export function mapExerciseToMuscles(name: string): ExerciseMapping {
  const n = name.trim();
  for (const row of exerciseToMuscles) {
    if (row.match.test(n)) return row.map;
  }
  // Default: unknown → no muscles (avoid false positives). Guardian can skip unknowns.
  return { primary: [] };
}


