#!/usr/bin/env tsx
/**
 * Test OpenAI Schema Generation
 * =============================
 * Tests the actual JSON schema generated from our Zod schema to identify OpenAI validation issues
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import { RawAIResponseSchema } from '@/lib/validation/neuralProgramSchema';

console.log('🧪 Testing OpenAI JSON Schema Generation');
console.log('='.repeat(50));

// Convert Zod schema to JSON Schema exactly as done in openaiService.ts
const jsonSchema = zodToJsonSchema(RawAIResponseSchema, {
  name: 'outputSchema',
  target: 'openApi3',
  strictUnions: true,
});

// Remove the $schema property as OpenAI doesn't expect it
const { $schema, ...cleanJsonSchema } = jsonSchema;

console.log('\n📝 Generated JSON Schema:');
console.log(JSON.stringify(cleanJsonSchema, null, 2));

console.log('\n🔍 Schema Analysis:');
console.log('='.repeat(30));

// Check for common OpenAI validation issues
function analyzeSchema(schema: any, path = '') {
  const issues: string[] = [];
  
  if (schema.type === 'object') {
    // Check if properties exist
    if (!schema.properties) {
      issues.push(`${path}: Object type missing 'properties'`);
    } else {
      // Check if all properties have descriptions
      for (const [propName, propSchema] of Object.entries(schema.properties) as [string, any][]) {
        if (!propSchema.description) {
          issues.push(`${path}.${propName}: Missing 'description' property`);
        }
        
        // Recursively analyze nested objects
        if (propSchema.type === 'object' || propSchema.type === 'array') {
          issues.push(...analyzeSchema(propSchema, `${path}.${propName}`));
        }
        
        // Check array items
        if (propSchema.type === 'array' && propSchema.items) {
          issues.push(...analyzeSchema(propSchema.items, `${path}.${propName}[items]`));
        }
      }
      
      // Check if required array includes all non-optional properties
      const propertyNames = Object.keys(schema.properties);
      const requiredProperties = schema.required || [];
      
      console.log(`${path || 'root'} properties: [${propertyNames.join(', ')}]`);
      console.log(`${path || 'root'} required: [${requiredProperties.join(', ')}]`);
      
      // Find properties that should be required (not marked as optional in Zod)
      const missingFromRequired = propertyNames.filter(prop => {
        const propSchema = schema.properties[prop];
        // If it's not in required array and doesn't appear to be optional
        return !requiredProperties.includes(prop) && !propSchema.type?.includes('undefined');
      });
      
      if (missingFromRequired.length > 0) {
        issues.push(`${path || 'root'}: Properties missing from required array: [${missingFromRequired.join(', ')}]`);
      }
    }
  }
  
  // Check definitions for the same issues
  if (schema.definitions) {
    for (const [defName, defSchema] of Object.entries(schema.definitions) as [string, any][]) {
      issues.push(...analyzeSchema(defSchema, `definitions.${defName}`));
    }
  }
  
  return issues;
}

const issues = analyzeSchema(cleanJsonSchema);

if (issues.length > 0) {
  console.log('\n❌ Schema Issues Found:');
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
} else {
  console.log('\n✅ No obvious schema issues found');
}

console.log('\n🎯 OpenAI Schema Requirements:');
console.log('='.repeat(35));
console.log('✓ All object properties must have descriptions');
console.log('✓ Required array must include all non-optional properties');
console.log('✓ Schema must not have $schema property');
console.log('✓ All nested objects must follow the same rules');

// Test specific OpenAI structured output requirements
console.log('\n📋 OpenAI Structured Output Validation:');
console.log('='.repeat(40));

// Check top-level structure
if (cleanJsonSchema.type !== 'object') {
  console.log('❌ Top-level schema must be type "object"');
} else {
  console.log('✅ Top-level schema is type "object"');
}

if (!cleanJsonSchema.properties) {
  console.log('❌ Top-level schema missing "properties"');
} else {
  console.log('✅ Top-level schema has "properties"');
}

if (!cleanJsonSchema.required || !Array.isArray(cleanJsonSchema.required)) {
  console.log('❌ Top-level schema missing "required" array');
} else {
  console.log('✅ Top-level schema has "required" array');
  
  // Check if all top-level properties are in required array
  const topLevelProps = Object.keys(cleanJsonSchema.properties);
  const missingRequired = topLevelProps.filter(prop => !cleanJsonSchema.required.includes(prop));
  
  if (missingRequired.length > 0) {
    console.log(`❌ Properties not in required array: [${missingRequired.join(', ')}]`);
  } else {
    console.log('✅ All properties are in required array');
  }
}

// Check for descriptions on all properties
if (cleanJsonSchema.properties) {
  const propsWithoutDesc = Object.entries(cleanJsonSchema.properties)
    .filter(([_, schema]: [string, any]) => !schema.description)
    .map(([name, _]) => name);
    
  if (propsWithoutDesc.length > 0) {
    console.log(`❌ Properties missing descriptions: [${propsWithoutDesc.join(', ')}]`);
  } else {
    console.log('✅ All top-level properties have descriptions');
  }
}

console.log('\n🔧 Recommended Fixes:');
console.log('='.repeat(25));
if (issues.length > 0) {
  console.log('1. Add descriptions to all schema properties');
  console.log('2. Ensure all non-optional fields are in required arrays');
  console.log('3. Validate nested object schemas follow the same rules');
} else {
  console.log('✅ Schema appears to be correctly formatted for OpenAI');
}
