#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

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
    // Read the seed SQL file
    const seedPath = join(process.cwd(), 'supabase', 'seed.sql')
    const seedSQL = readFileSync(seedPath, 'utf-8')

    console.log('📄 Executing seed SQL...')

    // Execute the seed SQL
    const { error } = await supabase.rpc('exec_sql', { sql: seedSQL })

    if (error) {
      console.error('❌ Error executing seed SQL:', error)
      return
    }

    console.log('✅ Community data seeded successfully!')
    console.log('')
    console.log('📊 What was created:')
    console.log('   • 5 community groups (Powerlifting, Bodybuilding, CrossFit, Running, Yoga)')
    console.log('   • 15 sample posts across different groups and global feed')
    console.log('   • 10 community feed events (workouts, PRs, streaks)')
    console.log('   • Group memberships for existing users')
    console.log('')
    console.log('🎉 Your community section should now feel alive and engaging!')

  } catch (error) {
    console.error('❌ Failed to seed community data:', error)
  }
}

// Run the seeding
seedCommunityData() 