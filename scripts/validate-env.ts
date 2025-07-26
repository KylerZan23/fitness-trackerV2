#!/usr/bin/env tsx

/**
 * Environment Variable Validation Script
 *
 * Run this script to validate your environment configuration
 * Usage: yarn validate:env or npx tsx scripts/validate-env.ts
 */

import { config } from 'dotenv'
import { validateEnvironment, getEnvironmentHealth, getCurrentEnvironment } from '../src/lib/env'

// Load environment variables from .env.local
config({ path: '.env.local' })

function formatValidationResults() {
  console.log('🔍 Validating environment configuration...\n')

  const envType = getCurrentEnvironment()
  console.log(`📊 Environment: ${envType}`)
  console.log(`📂 Loading from: .env.local\n`)

  const result = validateEnvironment()

  if (result.success) {
    console.log('✅ Environment validation passed!\n')

    // Show warnings if any
    if (result.warnings.length > 0) {
      console.log('⚠️  Warnings:')
      result.warnings.forEach(warning => console.log(`   ${warning}`))
      console.log('')
    }

    // Show feature availability
    const health = getEnvironmentHealth()
    console.log('🎯 Feature Availability:')
    console.log(`   Core Services: ${health.details.core ? '✅' : '❌'}`)
    console.log(`   AI Features: ${health.details.ai ? '✅' : '❌'}`)
    console.log(`   Strava Integration: ${health.details.strava ? '✅' : '❌'}`)
    console.log('')

    console.log(`🏥 Overall Health: ${health.status.toUpperCase()}`)

    if (health.status === 'degraded') {
      console.log('   Note: Some optional features are not configured')
    }
  } else {
    console.log('❌ Environment validation failed!\n')
    console.error(result.error)

    if (envType === 'development') {
      console.log('\n💡 Quick Setup Help:')
      console.log('   1. Copy .env.example to .env.local (if available)')
      console.log('   2. Update the values in .env.local')
      console.log('   3. Run this script again to verify')
      console.log('   4. Restart your development server')
    }

    process.exit(1)
  }
}

function main() {
  try {
    formatValidationResults()
  } catch (error) {
    console.error('💥 Unexpected error during validation:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}
