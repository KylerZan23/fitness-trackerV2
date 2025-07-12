import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// --- CONFIGURATION ---
const DURATION_IN_MONTHS = 6;
const USER_EMAIL = 'test@fitnesstrack.local'; // The email of the user to add data to

const WORKOUT_PLAN = [
  {
    day: 0, // Sunday
    name: 'Push Day',
    exercises: [
      { name: 'Bench Press', baseWeight: 135, sets: 3, reps: 8 },
      { name: 'Overhead Press', baseWeight: 85, sets: 3, reps: 10 },
      { name: 'Incline Dumbbell Press', baseWeight: 45, sets: 3, reps: 12 },
      { name: 'Tricep Pushdown', baseWeight: 40, sets: 3, reps: 15 },
      { name: 'Lateral Raises', baseWeight: 15, sets: 4, reps: 15 },
    ],
  },
  {
    day: 2, // Tuesday
    name: 'Pull Day',
    exercises: [
      { name: 'Deadlift', baseWeight: 225, sets: 1, reps: 5 },
      { name: 'Pull Ups', baseWeight: 0, sets: 3, reps: 8 }, // Bodyweight
      { name: 'Barbell Row', baseWeight: 135, sets: 3, reps: 8 },
      { name: 'Face Pulls', baseWeight: 30, sets: 3, reps: 15 },
      { name: 'Bicep Curls', baseWeight: 25, sets: 3, reps: 12 },
    ],
  },
  {
    day: 4, // Thursday
    name: 'Leg Day',
    exercises: [
      { name: 'Squat', baseWeight: 185, sets: 3, reps: 8 },
      { name: 'Romanian Deadlift', baseWeight: 155, sets: 3, reps: 10 },
      { name: 'Leg Press', baseWeight: 250, sets: 3, reps: 12 },
      { name: 'Leg Curls', baseWeight: 80, sets: 3, reps: 15 },
      { name: 'Calf Raises', baseWeight: 100, sets: 4, reps: 20 },
    ],
  },
];
// --- END CONFIGURATION ---

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to get user ID from email
async function getUserIdByEmail(email: string): Promise<string | null> {
  // We must use the admin API to look up users in the auth.users table.
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error(`Error fetching users:`, error?.message);
    return null;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error(`User with email ${email} not found.`);
    return null;
  }

  return user.id;
}


async function seedData() {
  console.log(`Starting data seeding for user: ${USER_EMAIL}`);
  const userId = await getUserIdByEmail(USER_EMAIL);

  if (!userId) {
    console.error(`Could not find user with email ${USER_EMAIL}. Please create the user first. You can use 'yarn ts-node scripts/create-test-user.ts'`);
    return;
  }

  console.log(`Found user ID: ${userId}`);

  const today = new Date();
  const startDate = new Date();
  startDate.setMonth(today.getMonth() - DURATION_IN_MONTHS);

  let weekIndex = 0;
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) { // New week starts on Sunday
        weekIndex++;
    }
    const dayPlan = WORKOUT_PLAN.find(p => p.day === d.getDay());

    if (dayPlan) {
      const workoutDate = new Date(d);
      console.log(`\nSeeding workout for ${dayPlan.name} on ${workoutDate.toISOString().split('T')[0]}`);

      // 1. Create Workout Group
      const { data: group, error: groupError } = await supabase
        .from('workout_groups')
        .insert({
          user_id: userId,
          name: dayPlan.name,
          duration: 60, // Assuming 60 minutes
          created_at: workoutDate.toISOString(),
          notes: `Week ${weekIndex} of auto-seeded program.`
        })
        .select('id')
        .single();
      
      if (groupError || !group) {
        console.error('Error creating workout group:', groupError?.message);
        continue;
      }
      const workoutGroupId = group.id;

      // 2. Create individual workout entries
      const workoutEntries = dayPlan.exercises.map(exercise => {
        const progressiveWeight = exercise.baseWeight > 0 
          ? exercise.baseWeight + (weekIndex * 2.5) // Add 2.5kg/lbs per week
          : 0;

        return {
          id: uuidv4(),
          user_id: userId,
          workout_group_id: workoutGroupId,
          exercise_name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: progressiveWeight,
          duration: 0, // Duration is on the group
          created_at: workoutDate.toISOString(),
          notes: `Progressive overload: +${(weekIndex * 2.5).toFixed(1)}`
        };
      });

      const { error: workoutError } = await supabase.from('workouts').insert(workoutEntries);

      if (workoutError) {
        console.error('Error inserting workout entries:', workoutError.message);
      } else {
        console.log(`  -> Successfully inserted ${workoutEntries.length} exercises for group ${workoutGroupId}`);
      }
    }
  }
  console.log('\n✅ Data seeding complete!');
}

seedData().catch(console.error); 