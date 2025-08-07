#!/usr/bin/env tsx
/**
 * Test OpenAI Service Schema Processing
 * =====================================
 * Tests the actual schema processing pipeline used by the OpenAI service
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import { RawAIResponseSchema } from '@/lib/validation/neuralProgramSchema';

console.log('🧪 Testing OpenAI Service Schema Processing Pipeline');
console.log('='.repeat(55));

// Simulate the exact processing that happens in openaiService.ts
function processSchemaLikeOpenAIService(schema: any) {
  // Step 1: Convert Zod to JSON Schema (same as openaiService.ts)
  const jsonSchema = zodToJsonSchema(schema, {
    name: 'outputSchema',
    target: 'openApi3',
    strictUnions: true,
    $refStrategy: 'none', // Our new setting
  });

  // Step 2: Remove $schema property
  const { $schema, ...cleanJsonSchema } = jsonSchema;

  // Step 3: Fix $ref structure if needed (same logic as openaiService.ts)
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

  // Step 4: Force object type if needed
  if (!finalSchema.type) {
    finalSchema.type = 'object';
    console.log('⚠️  Forced schema type to object');
  }

  // Step 5: Apply our required array fix
  finalSchema = fixRequiredArraysForOpenAI(finalSchema);

  return finalSchema;
}

// Replicate the fixRequiredArraysForOpenAI logic
function fixRequiredArraysForOpenAI(schema: any): any {
  if (typeof schema !== 'object' || schema === null) {
    return schema;
  }

  // Make a deep copy to avoid mutating the original
  const fixedSchema = JSON.parse(JSON.stringify(schema));

  // Fix this level if it's an object with properties
  if (fixedSchema.type === 'object' && fixedSchema.properties) {
    const allPropertyNames = Object.keys(fixedSchema.properties);
    const originalRequired = fixedSchema.required || [];
    fixedSchema.required = allPropertyNames;
    
    console.log(`📝 Fixed required array: [${originalRequired.join(', ')}] → [${allPropertyNames.join(', ')}]`);

    // Recursively fix nested objects
    for (const [propName, propSchema] of Object.entries(fixedSchema.properties) as [string, any][]) {
      fixedSchema.properties[propName] = fixRequiredArraysForOpenAI(propSchema);
    }
  }

  // Fix array items
  if (fixedSchema.type === 'array' && fixedSchema.items) {
    fixedSchema.items = fixRequiredArraysForOpenAI(fixedSchema.items);
  }

  // Fix definitions
  if (fixedSchema.definitions) {
    for (const [defName, defSchema] of Object.entries(fixedSchema.definitions) as [string, any][]) {
      fixedSchema.definitions[defName] = fixRequiredArraysForOpenAI(defSchema);
    }
  }

  return fixedSchema;
}

// Test the full pipeline
console.log('\n🔄 Processing RawAIResponseSchema through OpenAI service pipeline...\n');

const processedSchema = processSchemaLikeOpenAIService(RawAIResponseSchema);

console.log('\n📊 Final Schema Analysis:');
console.log('='.repeat(30));

// Validate the final schema
function validateOpenAISchema(schema: any, path = 'root'): string[] {
  const issues: string[] = [];
  
  if (schema.type === 'object') {
    if (!schema.properties) {
      issues.push(`${path}: Object missing 'properties'`);
    } else {
      const props = Object.keys(schema.properties);
      const required = schema.required || [];
      
      // Check all properties have descriptions
      for (const prop of props) {
        if (!schema.properties[prop].description) {
          issues.push(`${path}.${prop}: Missing description`);
        }
      }
      
      // Check all properties are in required array
      const missingRequired = props.filter(p => !required.includes(p));
      if (missingRequired.length > 0) {
        issues.push(`${path}: Missing from required: [${missingRequired.join(', ')}]`);
      }
      
      // Check nested objects
      for (const [propName, propSchema] of Object.entries(schema.properties) as [string, any][]) {
        if (propSchema.type === 'object') {
          issues.push(...validateOpenAISchema(propSchema, `${path}.${propName}`));
        } else if (propSchema.type === 'array' && propSchema.items?.type === 'object') {
          issues.push(...validateOpenAISchema(propSchema.items, `${path}.${propName}[items]`));
        }
      }
    }
  }
  
  return issues;
}

const validationIssues = validateOpenAISchema(processedSchema);

console.log(`Schema type: ${processedSchema.type}`);
console.log(`Has properties: ${!!processedSchema.properties}`);
console.log(`Has required array: ${!!processedSchema.required}`);

if (processedSchema.properties) {
  console.log(`Properties: [${Object.keys(processedSchema.properties).join(', ')}]`);
  console.log(`Required: [${(processedSchema.required || []).join(', ')}]`);
}

console.log('\n🎯 OpenAI Compatibility Check:');
console.log('='.repeat(35));

if (validationIssues.length === 0) {
  console.log('🎉 SUCCESS: Schema is fully compatible with OpenAI structured outputs!');
  console.log('✅ All properties have descriptions');
  console.log('✅ All properties are in required arrays');
  console.log('✅ Schema structure is correct');
} else {
  console.log('❌ Schema issues found:');
  validationIssues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
}

console.log('\n📝 Schema Structure Summary:');
console.log('='.repeat(35));
console.log('Top-level type:', processedSchema.type);
console.log('Top-level properties count:', processedSchema.properties ? Object.keys(processedSchema.properties).length : 0);
console.log('Top-level required count:', processedSchema.required ? processedSchema.required.length : 0);

// Show a small sample of the final schema
console.log('\n📄 Final Schema Sample (first 50 lines):');
console.log('='.repeat(40));
const schemaString = JSON.stringify(processedSchema, null, 2);
const lines = schemaString.split('\n').slice(0, 50);
console.log(lines.join('\n'));
if (schemaString.split('\n').length > 50) {
  console.log('... (truncated)');
}
