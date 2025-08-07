#!/usr/bin/env node
/**
 * Simple Error Handling Test Script
 * =================================
 * Tests all error scenarios for the Neural API endpoint using vanilla Node.js
 * 
 * Run with: node simple-error-test.js
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const NEURAL_ENDPOINT = `${API_BASE_URL}/api/neural/generate`;

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
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer valid_test_token'
    },
    expectFieldDetails: true
  },
  
  {
    name: '2. Missing User (Invalid Token)',
    description: 'Should return HTTP 401/404 with specific message',
    data: {
      primaryFocus: 'hypertrophy',
      experienceLevel: 'intermediate', 
      sessionDuration: 60,
      equipmentAccess: 'full_gym'
    },
    expectedStatus: 401, // Unauthorized when token is invalid
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid_token_12345'
    }
  },
  
  {
    name: '3. Valid Data Structure Test',
    description: 'Should return proper structure (might fail due to auth)',
    data: {
      primaryFocus: 'general_fitness',
      experienceLevel: 'beginner',
      sessionDuration: 45,
      equipmentAccess: 'dumbbells_only',
      personalRecords: {
        squat: 135
      }
    },
    expectedStatus: [200, 401], // Could be 200 if auth works, 401 if not
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test_token'
    }
  },
  
  {
    name: '4. Malformed JSON',
    description: 'Should return HTTP 400 with parsing error',
    data: '{ "primaryFocus": "hypertrophy", "experienceLevel": }', // Malformed
    expectedStatus: 400,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test_token'
    },
    isRawJSON: true
  }
];

/**
 * Make HTTP request to test endpoint
 */
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;
    
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: options.headers
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
    
    // Set timeout
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    // Write data
    if (data) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      req.write(payload);
    }
    
    req.end();
  });
}

/**
 * Test a single scenario
 */
async function testScenario(scenario) {
  console.log(`\n🧪 ${scenario.name}`);
  console.log(`   ${scenario.description}`);
  
  try {
    const response = await makeRequest(NEURAL_ENDPOINT, scenario, scenario.data);
    
    // Check status code
    const expectedStatuses = Array.isArray(scenario.expectedStatus) 
      ? scenario.expectedStatus 
      : [scenario.expectedStatus];
    
    const statusMatch = expectedStatuses.includes(response.status);
    
    console.log(`   📊 Status: ${response.status} ${statusMatch ? '✅' : '❌'}`);
    
    if (!statusMatch) {
      console.log(`   Expected: ${expectedStatuses.join(' or ')}, Got: ${response.status}`);
    }
    
    // Check response structure
    if (response.data && typeof response.data === 'object') {
      console.log(`   📝 Response Type: JSON ✅`);
      
      // Check for error structure
      if (response.data.error || response.data.message) {
        console.log(`   💬 Error Message: "${response.data.message || response.data.error}"`);
      }
      
      // Check for field details (validation errors)
      if (scenario.expectFieldDetails && response.data.details) {
        console.log(`   🔍 Field Details: ${response.data.details.length} errors ✅`);
        response.data.details.forEach((detail, index) => {
          console.log(`      ${index + 1}. ${detail.field}: ${detail.message}`);
        });
      }
      
      // Check for program data (success case)
      if (response.status === 200 && response.data.program) {
        console.log(`   🏋️ Program Data: Present ✅`);
        console.log(`      Program ID: ${response.data.program.id}`);
        console.log(`      Program Name: ${response.data.program.programName}`);
      }
      
      // Check for error codes
      if (response.data.code) {
        console.log(`   🏷️  Error Code: ${response.data.code}`);
      }
      
      // Check for timestamp
      if (response.data.timestamp) {
        console.log(`   ⏰ Timestamp: ${response.data.timestamp}`);
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
  console.log('🚀 Neural API Error Handling Test Suite');
  console.log('=' .repeat(50));
  
  if (!API_BASE_URL.includes('localhost')) {
    console.log(`🌐 Testing against: ${API_BASE_URL}`);
  } else {
    console.log('🏠 Testing against local development server');
    console.log('   Make sure your Next.js app is running on localhost:3000');
  }
  
  const results = [];
  
  for (const scenario of testScenarios) {
    const result = await testScenario(scenario);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
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
  
  console.log('\n🎯 Key Observations:');
  console.log('   • Error responses should have proper HTTP status codes');
  console.log('   • Validation errors should include field-level details');
  console.log('   • All errors should have timestamps and error codes');
  console.log('   • JSON parsing errors should be handled gracefully');
  console.log('   • Authorization errors should return 401 status');
  
  if (passed === total) {
    console.log('\n🎉 All tests completed! Review results above.');
  } else {
    console.log('\n🔧 Some scenarios need attention. Check the implementation.');
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
