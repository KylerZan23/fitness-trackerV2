#!/usr/bin/env node
/**
 * Authenticated Error Handling Test Script
 * ========================================
 * Tests all error scenarios with proper authentication using existing test user
 * 
 * Run with: node authenticated-error-test.js
 */

const https = require('https');
const http = require('http');

// Configuration from existing test scripts
const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const NEURAL_ENDPOINT = `${API_BASE_URL}/api/neural/generate`;
const AUTH_ENDPOINT = `${API_BASE_URL}/api/test-auth`;

// Test user from scripts/create-test-user.ts and scripts/test-auth-token.ts
const TEST_USER = {
  email: 'test@fitnesstrack.local',
  password: 'Test123!@#',
};

// Test scenarios data
const testScenarios = [
  {
    name: '1. Invalid Validation Data',
    description: 'Should return HTTP 400 with field details',
    data: {
      primaryFocus: 'invalid_focus',  // Invalid enum
      experienceLevel: 'expert',      // Invalid enum  
      sessionDuration: 120,           // Invalid duration
      equipmentAccess: 'home_gym',    // Invalid enum
      personalRecords: {
        squat: 'not_a_number'         // Invalid type
      }
    },
    expectedStatus: 400,
    expectFieldDetails: true
  },
  
  {
    name: '2. Valid Data Structure Test',
    description: 'Should return HTTP 200 with program data OR 502 if AI fails',
    data: {
      primaryFocus: 'general_fitness',
      experienceLevel: 'beginner',
      sessionDuration: 45,
      equipmentAccess: 'dumbbells_only',
      personalRecords: {
        squat: 135
      }
    },
    expectedStatus: [200, 502], // Could be 200 if AI works, 502 if AI fails
    expectProgramDataOn200: true
  },
  
  {
    name: '3. Malformed JSON',
    description: 'Should return HTTP 400 with parsing error',
    data: '{ "primaryFocus": "hypertrophy", "experienceLevel": }', // Malformed
    expectedStatus: 400,
    isRawJSON: true,
    expectParsingError: true
  },

  {
    name: '4. Missing Required Fields',
    description: 'Should return HTTP 400 with validation errors',
    data: {
      primaryFocus: 'hypertrophy',
      // Missing experienceLevel, sessionDuration, equipmentAccess
    },
    expectedStatus: 400,
    expectFieldDetails: true
  }
];

/**
 * Get authentication token using Supabase auth
 */
async function getAuthToken() {
  console.log('🔑 Getting authentication token...');
  
  const authData = {
    email: TEST_USER.email,
    password: TEST_USER.password
  };
  
  // Use Supabase auth endpoint pattern (this might need adjustment based on your setup)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgdhavfcjhwqgfezigcd.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZGhhdmZjamh3cWdmZXppZ2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg2Nzk1ODEsImV4cCI6MjA0NDI1NTU4MX0.dEnoR1vEZjBgdV19u_Y8u6-bA4oXUdixUYhhNHFGR8s';
  
  const authEndpoint = `${supabaseUrl}/auth/v1/token?grant_type=password`;
  
  try {
    const response = await makeHTTPRequest(authEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      }
    }, authData);
    
    if (response.status === 200 && response.data.access_token) {
      console.log('✅ Authentication successful');
      return response.data.access_token;
    } else {
      console.log('❌ Authentication failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.message);
    return null;
  }
}

/**
 * Test authentication status
 */
async function testAuthStatus(token) {
  console.log('🧪 Testing authentication status...');
  
  try {
    const response = await makeHTTPRequest(AUTH_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    
    return response.status === 200 && response.data.authenticated;
  } catch (error) {
    console.log('❌ Auth test failed:', error.message);
    return false;
  }
}

/**
 * Make HTTP request
 */
function makeHTTPRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;
    
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = client.request(requestOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers,
            parseError: true
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (data) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      req.write(payload);
    }
    
    req.end();
  });
}

/**
 * Test a single scenario with authentication
 */
async function testScenario(scenario, token) {
  console.log(`\n🧪 ${scenario.name}`);
  console.log(`   ${scenario.description}`);
  
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    const response = await makeHTTPRequest(NEURAL_ENDPOINT, {
      method: 'POST',
      headers
    }, scenario.data);
    
    // Check status code
    const expectedStatuses = Array.isArray(scenario.expectedStatus) 
      ? scenario.expectedStatus 
      : [scenario.expectedStatus];
    
    const statusMatch = expectedStatuses.includes(response.status);
    
    console.log(`   📊 Status: ${response.status} ${statusMatch ? '✅' : '❌'}`);
    
    if (!statusMatch) {
      console.log(`   Expected: ${expectedStatuses.join(' or ')}, Got: ${response.status}`);
    }
    
    // Analyze response structure
    if (response.data && typeof response.data === 'object') {
      console.log(`   📝 Response Type: JSON ✅`);
      
      // Check for error structure
      if (response.data.error || response.data.message) {
        console.log(`   💬 Error Message: "${response.data.message || response.data.error}"`);
      }
      
      // Check for error code
      if (response.data.code) {
        console.log(`   🏷️  Error Code: ${response.data.code}`);
      }
      
      // Check for timestamp
      if (response.data.timestamp) {
        console.log(`   ⏰ Timestamp: ${response.data.timestamp}`);
      }
      
      // Check for field details (validation errors)
      if (scenario.expectFieldDetails && response.data.details) {
        console.log(`   🔍 Field Details: ${response.data.details.length} errors ✅`);
        response.data.details.forEach((detail, index) => {
          console.log(`      ${index + 1}. ${detail.field}: ${detail.message} [${detail.code}]`);
        });
      } else if (scenario.expectFieldDetails) {
        console.log(`   🔍 Field Details: Missing ❌`);
      }
      
      // Check for program data (success case)
      if (scenario.expectProgramDataOn200 && response.status === 200 && response.data.program) {
        console.log(`   🏋️ Program Data: Present ✅`);
        console.log(`      Program ID: ${response.data.program.id}`);
        console.log(`      Program Name: ${response.data.program.programName}`);
        console.log(`      Workouts: ${response.data.program.workouts?.length || 0}`);
      } else if (scenario.expectProgramDataOn200 && response.status === 200) {
        console.log(`   🏋️ Program Data: Missing ❌`);
      }
      
      // Check for parsing error
      if (scenario.expectParsingError && response.data.message?.includes('JSON')) {
        console.log(`   📋 JSON Parsing Error: Detected ✅`);
      } else if (scenario.expectParsingError) {
        console.log(`   📋 JSON Parsing Error: Not detected ❌`);
      }
      
    } else {
      console.log(`   📝 Response Type: ${typeof response.data} ${response.parseError ? '❌' : '⚠️'}`);
      if (response.parseError) {
        console.log(`   Raw Response: ${response.data.substring(0, 200)}...`);
      }
    }
    
    return {
      name: scenario.name,
      passed: statusMatch,
      status: response.status,
      expectedStatus: scenario.expectedStatus,
      response: response.data
    };
    
  } catch (error) {
    console.log(`   ❌ Request Failed: ${error.message}`);
    return {
      name: scenario.name,
      passed: false,
      error: error.message
    };
  }
}

/**
 * Run all test scenarios
 */
async function runAllTests() {
  console.log('🚀 Neural API Authenticated Error Handling Test Suite');
  console.log('=' .repeat(55));
  
  if (!API_BASE_URL.includes('localhost')) {
    console.log(`🌐 Testing against: ${API_BASE_URL}`);
  } else {
    console.log('🏠 Testing against local development server');
  }
  
  // Get authentication token
  const token = await getAuthToken();
  if (!token) {
    console.log('❌ Could not get authentication token. Please ensure:');
    console.log('   1. The test user exists (run: yarn script scripts/create-test-user.ts)');
    console.log('   2. Your .env.local file has the correct Supabase credentials');
    console.log('   3. The development server is running');
    return;
  }
  
  // Test authentication
  const isAuthenticated = await testAuthStatus(token);
  if (!isAuthenticated) {
    console.log('❌ Authentication test failed. Token may be invalid.');
    return;
  }
  
  console.log('✅ Authentication confirmed. Running error scenarios...\n');
  
  const results = [];
  
  for (const scenario of testScenarios) {
    const result = await testScenario(scenario, token);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=' .repeat(30));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${total - passed} ❌`);
  console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
  
  if (passed !== total) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(result => {
      console.log(`   • ${result.name}: ${result.error || `Expected ${result.expectedStatus}, got ${result.status}`}`);
    });
  }
  
  console.log('\n🎯 Error Handling Verification:');
  console.log('   ✓ Validation errors should return 400 with field details');
  console.log('   ✓ Valid requests should return 200 (program) or 502 (AI failure)');
  console.log('   ✓ JSON parsing errors should return 400 with parse message');
  console.log('   ✓ All errors should include timestamps and error codes');
  console.log('   ✓ Authentication should work consistently');
  
  if (passed === total) {
    console.log('\n🎉 All authenticated tests passed! Error handling is working correctly.');
  } else {
    console.log('\n🔧 Some scenarios need attention. Check the error handling implementation.');
  }
}

// Handle script execution
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testScenario };
