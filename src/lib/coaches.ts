/**
 * Expert Coach data types and mock data for the fitness tracking application
 */

export interface ExpertCoach {
  id: string;
  name: string;
  title: string;
  credentials: string[];
  bio_summary: string;
  photo_url: string; // Placeholder for now
  specialties: string[];
}

export const EXPERT_COACHES: ExpertCoach[] = [
  {
    id: 'coach1',
    name: 'Dr. Alex Stone',
    title: 'Head Strength Scientist',
    credentials: ['PhD Kinesiology', 'CSCS', 'USAW Level 2'],
    bio_summary: 'Dr. Stone\'s research into biomechanics and periodization forms the backbone of our AI program generation. With over 15 years of experience training elite athletes, Alex combines cutting-edge science with practical application.',
    photo_url: '/assets/coaches/alex-stone.jpg', // Placeholder
    specialties: ['Powerlifting', 'Biomechanics', 'Program Design', 'Olympic Lifting']
  },
  {
    id: 'coach2',
    name: 'Maria Rodriguez',
    title: 'Certified Strength & Conditioning Specialist',
    credentials: ['CSCS', 'RPS Elite Powerlifter', 'Precision Nutrition L1'],
    bio_summary: 'Former competitive powerlifter turned coach, Maria holds multiple national records and has helped hundreds of athletes achieve their strength goals. Her expertise in progressive overload and injury prevention is unmatched.',
    photo_url: '/assets/coaches/maria-rodriguez.jpg', // Placeholder
    specialties: ['Powerlifting', 'Strength Training', 'Competition Prep', 'Injury Prevention']
  },
  {
    id: 'coach3',
    name: 'James Chen',
    title: 'Former Olympian Weightlifter',
    credentials: ['Olympic Competitor 2016', 'USAW Level 4', 'NASM-CPT'],
    bio_summary: 'James represented Team USA in Olympic weightlifting and now channels his elite-level experience into developing explosive power programs. His understanding of periodization and peak performance is world-class.',
    photo_url: '/assets/coaches/james-chen.jpg', // Placeholder
    specialties: ['Olympic Weightlifting', 'Explosive Power', 'Athletic Performance', 'Competition Periodization']
  }
];

/**
 * Get coach by ID
 */
export function getCoachById(id: string): ExpertCoach | undefined {
  return EXPERT_COACHES.find(coach => coach.id === id);
}

/**
 * Get coaches by specialty
 */
export function getCoachesBySpecialty(specialty: string): ExpertCoach[] {
  return EXPERT_COACHES.filter(coach => 
    coach.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
  );
}

/**
 * Get all coach specialties (unique list)
 */
export function getAllSpecialties(): string[] {
  const allSpecialties = EXPERT_COACHES.flatMap(coach => coach.specialties);
  return Array.from(new Set(allSpecialties)).sort();
} 