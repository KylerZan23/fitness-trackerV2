#!/usr/bin/env tsx

/**
 * Setup script for Feature Flags system
 * This script initializes the feature flags system with default configurations
 * and can be used to manage flags from the command line.
 * 
 * Usage:
 * yarn tsx scripts/setup-feature-flags.ts
 * yarn tsx scripts/setup-feature-flags.ts --enable-phoenix --percentage 10
 * yarn tsx scripts/setup-feature-flags.ts --rollback phoenix_pipeline_enabled
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface FeatureFlagSetup {
  flagName: string
  description: string
  isEnabled: boolean
  rolloutPercentage: number
  metadata?: Record<string, any>
}

const defaultFlags: FeatureFlagSetup[] = [
  {
    flagName: 'phoenix_pipeline_enabled',
    description: 'Enable the new Phoenix generation pipeline for AI program generation',
    isEnabled: false,
    rolloutPercentage: 0,
    metadata: {
      created_for: 'Phoenix pipeline rollout',
      documentation: 'docs/adr/ADR-074-phoenix-pipeline-feature-flagging.md',
      pipeline: 'phoenix',
      critical: true
    }
  },
  {
    flagName: 'phoenix_pipeline_internal_testing',
    description: 'Enable Phoenix pipeline for internal team members only',
    isEnabled: false,
    rolloutPercentage: 0,
    metadata: {
      internal_only: true,
      team: 'neurallift',
      pipeline: 'phoenix'
    }
  }
]

async function initializeFeatureFlags() {
  console.log('🚀 Initializing Feature Flags system...\n')

  try {
    // Check if tables exist
    const { data: existingFlags, error: checkError } = await supabase
      .from('feature_flags')
      .select('flag_name')
      .limit(1)

    if (checkError) {
      console.error('❌ Feature flags table not found. Please run the migration first:')
      console.error('   supabase db push')
      process.exit(1)
    }

    console.log('✅ Feature flags table found')

    // Insert default flags
    for (const flag of defaultFlags) {
      const { data, error } = await supabase
        .from('feature_flags')
        .upsert({
          flag_name: flag.flagName,
          description: flag.description,
          is_enabled: flag.isEnabled,
          rollout_percentage: flag.rolloutPercentage,
          metadata: flag.metadata || {}
        }, {
          onConflict: 'flag_name'
        })
        .select()

      if (error) {
        console.error(`❌ Failed to setup flag ${flag.flagName}:`, error.message)
      } else {
        console.log(`✅ Setup flag: ${flag.flagName} (${flag.rolloutPercentage}% rollout)`)
      }
    }

    console.log('\n🎉 Feature flags initialization complete!')
    console.log('\n📋 Next steps:')
    console.log('   1. Access admin interface at: /admin/feature-flags')
    console.log('   2. Start with internal testing: --enable-internal-testing')
    console.log('   3. Gradually increase Phoenix rollout: --enable-phoenix --percentage 10')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

async function enablePhoenixPipeline(percentage: number = 10) {
  console.log(`🔧 Enabling Phoenix pipeline for ${percentage}% of users...\n`)

  try {
    const { error } = await supabase
      .from('feature_flags')
      .update({
        is_enabled: true,
        rollout_percentage: percentage,
        admin_override_enabled: null,
        admin_override_disabled: null
      })
      .eq('flag_name', 'phoenix_pipeline_enabled')

    if (error) {
      console.error('❌ Failed to enable Phoenix pipeline:', error.message)
      process.exit(1)
    }

    console.log(`✅ Phoenix pipeline enabled for ${percentage}% of users`)
    console.log('   Monitor the rollout at: /admin/feature-flags')

  } catch (error) {
    console.error('❌ Failed to enable Phoenix pipeline:', error)
    process.exit(1)
  }
}

async function enableInternalTesting() {
  console.log('🔧 Enabling Phoenix pipeline for internal testing...\n')

  try {
    const { error } = await supabase
      .from('feature_flags')
      .update({
        is_enabled: true,
        rollout_percentage: 100,
        admin_override_enabled: null,
        admin_override_disabled: null
      })
      .eq('flag_name', 'phoenix_pipeline_internal_testing')

    if (error) {
      console.error('❌ Failed to enable internal testing:', error.message)
      process.exit(1)
    }

    console.log('✅ Phoenix pipeline enabled for internal testing')
    console.log('   Internal team members will now use the Phoenix pipeline')

  } catch (error) {
    console.error('❌ Failed to enable internal testing:', error)
    process.exit(1)
  }
}

async function emergencyRollback(flagName: string) {
  console.log(`🚨 Executing emergency rollback for ${flagName}...\n`)

  try {
    const { error } = await supabase
      .from('feature_flags')
      .update({
        admin_override_disabled: true,
        admin_override_enabled: null,
        metadata: {
          emergency_rollback: true,
          rollback_reason: 'CLI emergency rollback',
          rollback_at: new Date().toISOString()
        }
      })
      .eq('flag_name', flagName)

    if (error) {
      console.error('❌ Emergency rollback failed:', error.message)
      process.exit(1)
    }

    console.log(`✅ Emergency rollback executed for ${flagName}`)
    console.log('   Feature is now disabled for ALL users')

  } catch (error) {
    console.error('❌ Emergency rollback failed:', error)
    process.exit(1)
  }
}

async function showStatus() {
  console.log('📊 Feature Flags Status:\n')

  try {
    const { data: flags, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ Failed to fetch flags:', error.message)
      process.exit(1)
    }

    if (!flags || flags.length === 0) {
      console.log('   No feature flags found. Run without arguments to initialize.')
      return
    }

    flags.forEach(flag => {
      const status = flag.admin_override_enabled ? 'FORCE ENABLED' :
                    flag.admin_override_disabled ? 'FORCE DISABLED' :
                    flag.is_enabled ? `${flag.rollout_percentage}% ROLLOUT` : 'DISABLED'
      
      console.log(`   ${flag.flag_name}: ${status}`)
      if (flag.description) {
        console.log(`      ${flag.description}`)
      }
      console.log('')
    })

  } catch (error) {
    console.error('❌ Failed to show status:', error)
    process.exit(1)
  }
}

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Feature Flags Setup Script

Usage:
  yarn tsx scripts/setup-feature-flags.ts                    # Initialize with defaults
  yarn tsx scripts/setup-feature-flags.ts --status          # Show current status
  yarn tsx scripts/setup-feature-flags.ts --enable-phoenix [--percentage N]  # Enable Phoenix pipeline
  yarn tsx scripts/setup-feature-flags.ts --enable-internal-testing          # Enable for internal team
  yarn tsx scripts/setup-feature-flags.ts --rollback FLAG_NAME               # Emergency rollback

Examples:
  yarn tsx scripts/setup-feature-flags.ts --enable-phoenix --percentage 25
  yarn tsx scripts/setup-feature-flags.ts --rollback phoenix_pipeline_enabled
`)
    return
  }

  if (args.includes('--status')) {
    await showStatus()
    return
  }

  if (args.includes('--enable-phoenix')) {
    const percentageIndex = args.indexOf('--percentage')
    const percentage = percentageIndex !== -1 ? parseInt(args[percentageIndex + 1]) : 10
    await enablePhoenixPipeline(percentage)
    return
  }

  if (args.includes('--enable-internal-testing')) {
    await enableInternalTesting()
    return
  }

  if (args.includes('--rollback')) {
    const rollbackIndex = args.indexOf('--rollback')
    const flagName = rollbackIndex !== -1 ? args[rollbackIndex + 1] : null
    if (!flagName) {
      console.error('❌ Flag name required for rollback')
      process.exit(1)
    }
    await emergencyRollback(flagName)
    return
  }

  // Default: initialize flags
  await initializeFeatureFlags()
}

main().catch(console.error)