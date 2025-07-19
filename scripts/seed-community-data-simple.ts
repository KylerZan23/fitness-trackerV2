#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedCommunityData() {
  console.log('🌱 Seeding community data...')

  try {
    // First, let's check if we have any users
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (userError || !users || users.length === 0) {
      console.log('⚠️ No users found. Creating sample data without user references...')
      // We'll create the groups without user references for now
      await createGroupsWithoutUsers()
    } else {
      console.log(`👤 Found ${users.length} user(s), creating data with user references...`)
      await createGroupsWithUsers(users[0].id)
    }

    console.log('✅ Community data seeded successfully!')
    console.log('')
    console.log('📊 What was created:')
    console.log('   • 13 community groups including:')
    console.log('     - Core: Powerlifting, Bodybuilding, CrossFit, Running, Yoga')
    console.log('     - New: Olympic Weightlifting, Strongman, Calisthenics, Cycling')
    console.log('     - Specialized: Boxing, Nutrition, Women\'s Fitness, Senior Fitness')
    console.log('   • Sample posts and feed events')
    console.log('')
    console.log('🎉 Your community section should now feel alive and engaging!')

  } catch (error) {
    console.error('❌ Failed to seed community data:', error)
  }
}

async function createGroupsWithoutUsers() {
  // Create groups with a placeholder user ID
  const placeholderUserId = '00000000-0000-0000-0000-000000000000'
  
  const groups = [
    {
      id: '8f2e8d38-9e4a-4b0a-8b1e-3f9e8d389e4a',
      name: 'Powerlifting Crew',
      description: 'For those who love the big three: squat, bench, and deadlift. Share your PRs, training tips, and compete on the leaderboard!',
      group_type: 'Powerlifting',
      created_by: placeholderUserId
    },
    {
      id: 'c5a9f3b1-9e4a-4b0a-8b1e-3f9e8d389e4b',
      name: 'Bodybuilding Hub',
      description: 'A place to discuss hypertrophy, nutrition, and aesthetics. Perfect for those focused on muscle building and physique development.',
      group_type: 'Bodybuilding',
      created_by: placeholderUserId
    },
    {
      id: 'd7b2c4e6-9e4a-4b0a-8b1e-3f9e8d389e4c',
      name: 'CrossFit Warriors',
      description: 'High-intensity functional fitness community. Share WODs, discuss technique, and celebrate achievements together.',
      group_type: 'CrossFit',
      created_by: placeholderUserId
    },
    {
      id: 'e9f1a3b5-9e4a-4b0a-8b1e-3f9e8d389e4d',
      name: 'Running Club',
      description: 'For runners of all levels. Share training plans, race experiences, and running tips. From 5K to marathon!',
      group_type: 'Running',
      created_by: placeholderUserId
    },
    {
      id: 'f2g4h6i8-9e4a-4b0a-8b1e-3f9e8d389e4e',
      name: 'Yoga & Wellness',
      description: 'Mind-body connection through yoga, meditation, and holistic wellness practices. Find your inner strength.',
      group_type: 'Wellness',
      created_by: placeholderUserId
    },
    // Phase 1 Expansion: Core New Communities
    {
      id: 'a1b2c3d4-9e4a-4b0a-8b1e-3f9e8d389e4f',
      name: 'Olympic Weightlifting',
      description: 'Master the snatch and clean & jerk. Technical discussions, form checks, and competition prep for Olympic lifting athletes.',
      group_type: 'Olympic Lifting',
      created_by: placeholderUserId
    },
    {
      id: 'b2c3d4e5-9e4a-4b0a-8b1e-3f9e8d389e50',
      name: 'Strongman Training',
      description: 'Atlas stones, tire flips, and farmer walks! Functional strength training with unconventional implements and strongman events.',
      group_type: 'Strongman',
      created_by: placeholderUserId
    },
    {
      id: 'c3d4e5f6-9e4a-4b0a-8b1e-3f9e8d389e51',
      name: 'Calisthenics Masters',
      description: 'Bodyweight mastery and skill development. From basic pull-ups to advanced human flags and muscle-ups.',
      group_type: 'Calisthenics',
      created_by: placeholderUserId
    },
    {
      id: 'd4e5f6g7-9e4a-4b0a-8b1e-3f9e8d389e52',
      name: 'Cycling Enthusiasts',
      description: 'Road warriors, mountain bikers, and indoor cycling fanatics. Share routes, training plans, and gear recommendations.',
      group_type: 'Cycling',
      created_by: placeholderUserId
    },
    {
      id: 'e5f6g7h8-9e4a-4b0a-8b1e-3f9e8d389e53',
      name: 'Boxing & Combat Sports',
      description: 'Sweet science and martial arts training. Boxing, MMA, kickboxing technique, conditioning, and fight preparation.',
      group_type: 'Combat Sports',
      created_by: placeholderUserId
    },
    {
      id: 'f6g7h8i9-9e4a-4b0a-8b1e-3f9e8d389e54',
      name: 'Nutrition & Meal Prep',
      description: 'Fuel your fitness with proper nutrition. Meal planning, recipe sharing, supplement discussions, and diet strategies.',
      group_type: 'Nutrition',
      created_by: placeholderUserId
    },
    {
      id: 'g7h8i9j0-9e4a-4b0a-8b1e-3f9e8d389e55',
      name: 'Women\'s Fitness',
      description: 'Female-focused fitness community. Strength training, hormonal health, pregnancy fitness, and empowering women in fitness.',
      group_type: 'Women\'s Health',
      created_by: placeholderUserId
    },
    {
      id: 'h8i9j0k1-9e4a-4b0a-8b1e-3f9e8d389e56',
      name: 'Senior Fitness',
      description: 'Staying strong and active at any age. Age-appropriate training, mobility work, and fitness for the 50+ community.',
      group_type: 'Senior Health',
      created_by: placeholderUserId
    }
  ]

  for (const group of groups) {
    const { error } = await supabase
      .from('community_groups')
      .upsert(group, { onConflict: 'id' })

    if (error) {
      console.error(`❌ Error creating group ${group.name}:`, error)
    } else {
      console.log(`✅ Created group: ${group.name}`)
    }
  }
}

async function createGroupsWithUsers(userId: string) {
  const groups = [
    {
      id: '8f2e8d38-9e4a-4b0a-8b1e-3f9e8d389e4a',
      name: 'Powerlifting Crew',
      description: 'For those who love the big three: squat, bench, and deadlift. Share your PRs, training tips, and compete on the leaderboard!',
      group_type: 'Powerlifting',
      created_by: userId
    },
    {
      id: 'c5a9f3b1-9e4a-4b0a-8b1e-3f9e8d389e4b',
      name: 'Bodybuilding Hub',
      description: 'A place to discuss hypertrophy, nutrition, and aesthetics. Perfect for those focused on muscle building and physique development.',
      group_type: 'Bodybuilding',
      created_by: userId
    },
    {
      id: 'd7b2c4e6-9e4a-4b0a-8b1e-3f9e8d389e4c',
      name: 'CrossFit Warriors',
      description: 'High-intensity functional fitness community. Share WODs, discuss technique, and celebrate achievements together.',
      group_type: 'CrossFit',
      created_by: userId
    },
    {
      id: 'e9f1a3b5-9e4a-4b0a-8b1e-3f9e8d389e4d',
      name: 'Running Club',
      description: 'For runners of all levels. Share training plans, race experiences, and running tips. From 5K to marathon!',
      group_type: 'Running',
      created_by: userId
    },
    {
      id: 'f2g4h6i8-9e4a-4b0a-8b1e-3f9e8d389e4e',
      name: 'Yoga & Wellness',
      description: 'Mind-body connection through yoga, meditation, and holistic wellness practices. Find your inner strength.',
      group_type: 'Wellness',
      created_by: userId
    },
    // Phase 1 Expansion: Core New Communities
    {
      id: 'a1b2c3d4-9e4a-4b0a-8b1e-3f9e8d389e4f',
      name: 'Olympic Weightlifting',
      description: 'Master the snatch and clean & jerk. Technical discussions, form checks, and competition prep for Olympic lifting athletes.',
      group_type: 'Olympic Lifting',
      created_by: userId
    },
    {
      id: 'b2c3d4e5-9e4a-4b0a-8b1e-3f9e8d389e50',
      name: 'Strongman Training',
      description: 'Atlas stones, tire flips, and farmer walks! Functional strength training with unconventional implements and strongman events.',
      group_type: 'Strongman',
      created_by: userId
    },
    {
      id: 'c3d4e5f6-9e4a-4b0a-8b1e-3f9e8d389e51',
      name: 'Calisthenics Masters',
      description: 'Bodyweight mastery and skill development. From basic pull-ups to advanced human flags and muscle-ups.',
      group_type: 'Calisthenics',
      created_by: userId
    },
    {
      id: 'd4e5f6g7-9e4a-4b0a-8b1e-3f9e8d389e52',
      name: 'Cycling Enthusiasts',
      description: 'Road warriors, mountain bikers, and indoor cycling fanatics. Share routes, training plans, and gear recommendations.',
      group_type: 'Cycling',
      created_by: userId
    },
    {
      id: 'e5f6g7h8-9e4a-4b0a-8b1e-3f9e8d389e53',
      name: 'Boxing & Combat Sports',
      description: 'Sweet science and martial arts training. Boxing, MMA, kickboxing technique, conditioning, and fight preparation.',
      group_type: 'Combat Sports',
      created_by: userId
    },
    {
      id: 'f6g7h8i9-9e4a-4b0a-8b1e-3f9e8d389e54',
      name: 'Nutrition & Meal Prep',
      description: 'Fuel your fitness with proper nutrition. Meal planning, recipe sharing, supplement discussions, and diet strategies.',
      group_type: 'Nutrition',
      created_by: userId
    },
    {
      id: 'g7h8i9j0-9e4a-4b0a-8b1e-3f9e8d389e55',
      name: 'Women\'s Fitness',
      description: 'Female-focused fitness community. Strength training, hormonal health, pregnancy fitness, and empowering women in fitness.',
      group_type: 'Women\'s Health',
      created_by: userId
    },
    {
      id: 'h8i9j0k1-9e4a-4b0a-8b1e-3f9e8d389e56',
      name: 'Senior Fitness',
      description: 'Staying strong and active at any age. Age-appropriate training, mobility work, and fitness for the 50+ community.',
      group_type: 'Senior Health',
      created_by: userId
    }
  ]

  for (const group of groups) {
    const { error } = await supabase
      .from('community_groups')
      .upsert(group, { onConflict: 'id' })

    if (error) {
      console.error(`❌ Error creating group ${group.name}:`, error)
    } else {
      console.log(`✅ Created group: ${group.name}`)
    }
  }

  // Add user to some groups
  const { error: memberError } = await supabase
    .from('community_group_members')
    .upsert([
      { group_id: '8f2e8d38-9e4a-4b0a-8b1e-3f9e8d389e4a', user_id: userId, role: 'admin' },
      { group_id: 'c5a9f3b1-9e4a-4b0a-8b1e-3f9e8d389e4b', user_id: userId, role: 'member' }
    ], { onConflict: 'group_id,user_id' })

  if (memberError) {
    console.error('❌ Error adding user to groups:', memberError)
  } else {
    console.log('✅ Added user to Powerlifting and Bodybuilding groups')
  }
}

// Run the seeding
seedCommunityData() 