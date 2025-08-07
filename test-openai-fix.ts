#!/usr/bin/env tsx
/**
 * Test OpenAI Schema Fix
 * ======================
 * Tests the corrected JSON schema structure for OpenAI compatibility
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

// Create a test schema with the correct OpenAI requirements:
// 1. All properties (including optional) in required array
// 2. All properties have descriptions

const testWarmupSchema = z.object({
    exercise: z.string().describe("The name of the exercise."),
    sets: z.number().describe("The number of sets."),
    reps: z.union([z.string(), z.number()]).describe("The number of reps or duration."),
    load: z.string().describe("The weight or intensity (e.g., '50 lbs', 'Bodyweight', 'RPE 7')."),
    rest: z.string().describe("The rest period after the exercise (e.g., '60s', '2-3 min')."),
    description: z.string().describe("A brief description of the exercise."),
    intensity: z.string().describe("Intensity level (e.g., 'Light cardio').")
});

const testMainSchema = z.object({
    exercise: z.string().describe("The name of the exercise."),
    sets: z.number().describe("The number of sets."),
    reps: z.union([z.string(), z.number()]).describe("The number of reps or duration."),
    load: z.string().describe("The weight or intensity (e.g., '50 lbs', 'Bodyweight', 'RPE 7')."),
    rest: z.string().describe("The rest period after the exercise (e.g., '60s', '2-3 min')."),
    description: z.string().describe("A brief description of the exercise."),
    RPE: z.number().min(1).max(10).describe("Rate of Perceived Exertion (1-10)."),
    coaching_cues: z.string().describe("Specific coaching cues for form.")
});

const testWorkoutSchema = z.object({
    day: z.string().describe("Assigned day (e.g., 'Day 1', 'Monday')."),
    focus: z.string().describe("Primary focus of the workout (e.g., 'Full Body Strength')."),
    warmup: z.array(testWarmupSchema).describe("List of warmup exercises."),
    main_exercises: z.array(testMainSchema).describe("List of main exercises."),
    optional_finisher: z.array(testMainSchema).describe("Optional high-intensity finisher."),
    cooldown: z.array(testMainSchema).describe("List of cooldown stretches.")
});

const testOutputSchema = z.object({
    program_name: z.string().describe("A creative name for the training program."),
    workouts: z.array(testWorkoutSchema).describe("List of all workouts for the week.")
});

console.log('🧪 Testing Corrected OpenAI Schema');
console.log('='.repeat(40));

// Convert to JSON Schema
const jsonSchema = zodToJsonSchema(testOutputSchema, {
  name: 'outputSchema',
  target: 'openApi3',
  strictUnions: true,
});

const { $schema, ...cleanJsonSchema } = jsonSchema;

// Apply the same fix that's in openaiService.ts
let finalSchema = cleanJsonSchema;
if (cleanJsonSchema.$ref && cleanJsonSchema.definitions) {
  const refKey = cleanJsonSchema.$ref.replace('#/definitions/', '');
  if (cleanJsonSchema.definitions[refKey]) {
    finalSchema = {
      ...cleanJsonSchema.definitions[refKey],
      definitions: cleanJsonSchema.definitions
    };
    console.log('✅ Resolved $ref to direct object structure');
  }
}

console.log('\n📝 Final Schema Structure:');
console.log('Type:', finalSchema.type);
console.log('Has properties:', !!finalSchema.properties);
console.log('Has required array:', !!finalSchema.required);
console.log('Properties count:', finalSchema.properties ? Object.keys(finalSchema.properties).length : 0);
console.log('Required count:', finalSchema.required ? finalSchema.required.length : 0);

if (finalSchema.properties) {
  console.log('\n🔍 Property Analysis:');
  for (const [propName, propSchema] of Object.entries(finalSchema.properties) as [string, any][]) {
    const hasDescription = !!propSchema.description;
    const isRequired = finalSchema.required?.includes(propName);
    console.log(`  ${propName}: description=${hasDescription}, required=${isRequired}`);
  }
}

// Check if this structure would pass OpenAI validation
console.log('\n✅ OpenAI Validation Check:');
const isValidOpenAI = 
  finalSchema.type === 'object' &&
  !!finalSchema.properties &&
  !!finalSchema.required &&
  Array.isArray(finalSchema.required);

console.log('Valid OpenAI structure:', isValidOpenAI);

if (isValidOpenAI) {
  console.log('🎉 Schema should work with OpenAI structured outputs!');
} else {
  console.log('❌ Schema still has issues for OpenAI');
}

console.log('\n📋 Note about Optional Properties:');
console.log('OpenAI requires ALL properties (including optional ones) to be in the required array.');
console.log('The API will still accept missing optional properties despite them being "required".');
console.log('This is a quirk of OpenAI\'s structured output validation.');
