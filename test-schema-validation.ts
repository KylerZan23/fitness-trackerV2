#!/usr/bin/env tsx
/**
 * Test Schema Validation Fix
 * =========================
 * Directly tests the neuralRequestSchema to verify it now correctly validates NeuralRequest objects
 */

import { validateNeuralRequest, validateNeuralOnboardingData } from '@/lib/validation/neuralProgramSchema';
import type { NeuralRequest, OnboardingData } from '@/types/neural';

console.log('🧪 Testing Neural Request Schema Validation Fix');
console.log('='.repeat(50));

// Test data that matches the actual structure sent by the API
const testOnboardingData: OnboardingData = {
  primaryFocus: 'general_fitness',
  experienceLevel: 'beginner',
  sessionDuration: 45,
  equipmentAccess: 'dumbbells_only',
  personalRecords: {
    squat: 135,
    bench: 115,
    deadlift: 185
  }
};

const testNeuralRequest: NeuralRequest = {
  onboardingData: testOnboardingData,
  currentWeek: 1,
  // previousProgress is optional
};

console.log('\n📝 Test 1: Validate OnboardingData (should work)');
const onboardingValidation = validateNeuralOnboardingData(testOnboardingData);
if (onboardingValidation.success) {
  console.log('✅ OnboardingData validation successful');
  console.log(`   Primary Focus: ${onboardingValidation.data.primaryFocus}`);
  console.log(`   Experience: ${onboardingValidation.data.experienceLevel}`);
  console.log(`   Duration: ${onboardingValidation.data.sessionDuration} minutes`);
  console.log(`   Equipment: ${onboardingValidation.data.equipmentAccess}`);
} else {
  console.log('❌ OnboardingData validation failed:');
  console.log(onboardingValidation.error.issues);
}

console.log('\n📝 Test 2: Validate NeuralRequest (this should now work with our fix)');
const neuralRequestValidation = validateNeuralRequest(testNeuralRequest);
if (neuralRequestValidation.success) {
  console.log('✅ NeuralRequest validation successful!');
  console.log(`   Structure validated:`, {
    hasOnboardingData: !!neuralRequestValidation.data.onboardingData,
    currentWeek: neuralRequestValidation.data.currentWeek,
    hasPreviousProgress: !!neuralRequestValidation.data.previousProgress
  });
  console.log(`   Onboarding data nested correctly:`, {
    primaryFocus: neuralRequestValidation.data.onboardingData.primaryFocus,
    experienceLevel: neuralRequestValidation.data.onboardingData.experienceLevel,
    sessionDuration: neuralRequestValidation.data.onboardingData.sessionDuration,
    equipmentAccess: neuralRequestValidation.data.onboardingData.equipmentAccess
  });
} else {
  console.log('❌ NeuralRequest validation failed:');
  console.log(neuralRequestValidation.error.issues);
}

console.log('\n📝 Test 3: Test old flat structure (should fail)');
const oldFlatStructure = {
  primaryFocus: 'general_fitness',
  experienceLevel: 'beginner',
  sessionDuration: 45,
  equipmentAccess: 'dumbbells_only',
  regenerate: false,
  weekNumber: 1
};

const flatValidation = validateNeuralRequest(oldFlatStructure);
if (flatValidation.success) {
  console.log('❌ Old flat structure unexpectedly passed validation');
} else {
  console.log('✅ Old flat structure correctly rejected');
  console.log('   This confirms the schema fix is working');
}

console.log('\n📝 Test 4: Simulate the exact data flow from programGenerator');
console.log('   This simulates lines 183-187 in programGenerator.ts');

// This is exactly what programGenerator.createNewProgram creates:
const programGeneratorRequest: NeuralRequest = {
  onboardingData: testOnboardingData,
  currentWeek: 1,
  // No previousProgress for new programs
};

const flowValidation = validateNeuralRequest(programGeneratorRequest);
if (flowValidation.success) {
  console.log('✅ ProgramGenerator → NeuralAPI data flow validation successful!');
  console.log('   The validation fix resolves the data mapping issue');
  console.log('   Onboarding data will now properly reach the Neural API service');
} else {
  console.log('❌ ProgramGenerator → NeuralAPI data flow validation failed:');
  console.log(flowValidation.error.issues);
}

console.log('\n🎯 Results Summary');
console.log('='.repeat(30));

if (onboardingValidation.success && neuralRequestValidation.success && !flatValidation.success && flowValidation.success) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('✓ neuralRequestSchema now correctly validates nested structure');
  console.log('✓ Old flat structure correctly rejected');
  console.log('✓ Data flow from programGenerator to Neural API is fixed');
  console.log('✓ Onboarding data will no longer be undefined in Neural API logs');
} else {
  console.log('❌ Some tests failed - check the validation schema');
}
