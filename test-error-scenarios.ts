#!/usr/bin/env ts-node
/**
 * Comprehensive Error Handling Test Suite
 * ====================================== 
 * Tests all error scenarios for the Neural API endpoint to verify standardized error handling.
 * 
 * Scenarios tested:
 * 1. Invalid validation data → HTTP 400 with field details
 * 2. Missing user → HTTP 404 with specific message 
 * 3. AI service failure → HTTP 502 with service error
 * 4. Valid data → HTTP 200 with program data
 * 5. Malformed JSON → HTTP 400 with parsing error
 */

import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgdhavfcjhwqgfezigcd.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZGhhdmZjamh3cWdmZXppZ2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg2Nzk1ODEsImV4cCI6MjA0NDI1NTU4MX0.dEnoR1vEZjBgdV19u_Y8u6-bA4oXUdixUYhhNHFGR8s';
const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const NEURAL_ENDPOINT = `${API_BASE_URL}/api/neural/generate`;

// Test user credentials - these should be valid test users
const VALID_TEST_USER = {
  email: 'test@neurallift.ai',
  password: 'Test123456!'
};

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestResult {
  scenario: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class ErrorScenarioTester {
  private results: TestResult[] = [];
  private accessToken: string | null = null;

  /**
   * Run all test scenarios
   */
  async runAllTests(): Promise<void> {
    console.log(chalk.blue.bold('🧪 Neural API Error Handling Test Suite'));
    console.log(chalk.gray('='.repeat(50)));
    
    // Setup: Get authentication token
    await this.setupTestUser();
    
    // Test scenarios
    await this.testInvalidValidationData();
    await this.testMissingUser();
    await this.testAIServiceFailure();
    await this.testValidData();
    await this.testMalformedJSON();
    
    // Results summary
    this.printResults();
  }

  /**
   * Setup valid test user and get access token
   */
  private async setupTestUser(): Promise<void> {
    console.log(chalk.yellow('Setting up test user...'));
    
    try {
      // Sign in the test user
      const { data, error } = await supabase.auth.signInWithPassword(VALID_TEST_USER);
      
      if (error) {
        console.log(chalk.orange('Test user not found, attempting to create...'));
        
        // Try to create the test user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp(VALID_TEST_USER);
        
        if (signUpError) {
          throw new Error(`Failed to create test user: ${signUpError.message}`);
        }
        
        console.log(chalk.green('✅ Test user created successfully'));
        this.accessToken = signUpData.session?.access_token || null;
      } else {
        console.log(chalk.green('✅ Test user authenticated successfully'));
        this.accessToken = data.session?.access_token || null;
      }
      
      if (!this.accessToken) {
        throw new Error('Failed to get access token');
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Failed to setup test user: ${error}`));
      process.exit(1);
    }
  }

  /**
   * Test Scenario 1: Invalid validation data → HTTP 400 with field details
   */
  private async testInvalidValidationData(): Promise<void> {
    console.log(chalk.cyan('\n📋 Test 1: Invalid validation data'));
    
    const invalidData = {
      primaryFocus: 'invalid_focus',  // Invalid enum value
      experienceLevel: 'expert',      // Invalid enum value
      sessionDuration: 120,           // Invalid duration (not in allowed values)
      equipmentAccess: 'home_gym',    // Invalid enum value
      personalRecords: {
        squat: 'not_a_number'         // Invalid type
      }
    };
    
    const result = await this.makeRequest(invalidData, {
      expectedStatus: 400,
      scenario: 'Invalid validation data',
      shouldHaveFieldDetails: true
    });
    
    // Verify field-level validation errors are present
    if (result.passed && result.details?.response?.details?.length > 0) {
      console.log(chalk.green('  ✅ Field validation errors properly returned'));
      result.details.response.details.forEach((detail: any) => {
        console.log(chalk.gray(`    - ${detail.field}: ${detail.message}`));
      });
    } else {
      result.passed = false;
      result.error = 'Missing field-level validation details';
    }
    
    this.results.push(result);
  }

  /**
   * Test Scenario 2: Missing user → HTTP 404 with specific message
   */
  private async testMissingUser(): Promise<void> {
    console.log(chalk.cyan('\n👤 Test 2: Missing user'));
    
    const validData = {
      primaryFocus: 'hypertrophy',
      experienceLevel: 'intermediate',
      sessionDuration: 60,
      equipmentAccess: 'full_gym',
      personalRecords: {
        squat: 225,
        bench: 185,
        deadlift: 315
      }
    };
    
    // Use invalid/expired token to simulate missing user
    const result = await this.makeRequest(validData, {
      expectedStatus: 404,
      scenario: 'Missing user',
      useInvalidToken: true
    });
    
    this.results.push(result);
  }

  /**
   * Test Scenario 3: AI service failure → HTTP 502 with service error
   */
  private async testAIServiceFailure(): Promise<void> {
    console.log(chalk.cyan('\n🤖 Test 3: AI service failure'));
    
    // This test requires temporarily breaking the AI service
    // We'll simulate this by using invalid API configuration
    const validData = {
      primaryFocus: 'strength',
      experienceLevel: 'advanced',
      sessionDuration: 90,
      equipmentAccess: 'full_gym',
      personalRecords: {
        squat: 350,
        bench: 275,
        deadlift: 450
      }
    };
    
    // We'll test with valid data but expect AI service to fail
    // Note: This might require temporarily setting invalid OPENAI_API_KEY
    const result = await this.makeRequest(validData, {
      expectedStatus: 502,
      scenario: 'AI service failure',
      expectServiceError: true
    });
    
    this.results.push(result);
  }

  /**
   * Test Scenario 4: Valid data → HTTP 200 with program data
   */
  private async testValidData(): Promise<void> {
    console.log(chalk.cyan('\n✅ Test 4: Valid data'));
    
    const validData = {
      primaryFocus: 'general_fitness',
      experienceLevel: 'beginner',
      sessionDuration: 45,
      equipmentAccess: 'dumbbells_only',
      personalRecords: {
        squat: 135
      }
    };
    
    const result = await this.makeRequest(validData, {
      expectedStatus: 200,
      scenario: 'Valid data',
      shouldHaveProgramData: true
    });
    
    // Verify program structure is present
    if (result.passed && result.details?.response?.program) {
      console.log(chalk.green('  ✅ Program data properly returned'));
      const program = result.details.response.program;
      console.log(chalk.gray(`    - Program ID: ${program.id}`));
      console.log(chalk.gray(`    - Program Name: ${program.programName}`));
      console.log(chalk.gray(`    - Workouts: ${program.workouts?.length || 0}`));
    } else if (result.passed) {
      result.passed = false;
      result.error = 'Missing program data in successful response';
    }
    
    this.results.push(result);
  }

  /**
   * Test Scenario 5: Malformed JSON → HTTP 400 with parsing error
   */
  private async testMalformedJSON(): Promise<void> {
    console.log(chalk.cyan('\n📝 Test 5: Malformed JSON'));
    
    const malformedJSON = '{ "primaryFocus": "hypertrophy", "experienceLevel": }'; // Missing value
    
    try {
      const response = await fetch(NEURAL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: malformedJSON // Malformed JSON
      });
      
      const responseData = await response.json().catch(() => ({}));
      
      const result: TestResult = {
        scenario: 'Malformed JSON',
        expected: 'HTTP 400 with parsing error',
        actual: `HTTP ${response.status}`,
        passed: response.status === 400 && responseData.message?.includes('JSON'),
        details: { response: responseData, status: response.status }
      };
      
      if (result.passed) {
        console.log(chalk.green('  ✅ JSON parsing error properly handled'));
        console.log(chalk.gray(`    - Error: ${responseData.message}`));
      }
      
      this.results.push(result);
      
    } catch (error) {
      this.results.push({
        scenario: 'Malformed JSON',
        expected: 'HTTP 400 with parsing error',
        actual: 'Request failed',
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Make HTTP request to Neural API endpoint
   */
  private async makeRequest(
    data: any, 
    options: {
      expectedStatus: number;
      scenario: string;
      shouldHaveFieldDetails?: boolean;
      shouldHaveProgramData?: boolean;
      expectServiceError?: boolean;
      useInvalidToken?: boolean;
    }
  ): Promise<TestResult> {
    try {
      const token = options.useInvalidToken ? 'invalid_token_12345' : this.accessToken;
      
      const response = await fetch(NEURAL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      const responseData = await response.json().catch(() => ({}));
      
      const result: TestResult = {
        scenario: options.scenario,
        expected: `HTTP ${options.expectedStatus}`,
        actual: `HTTP ${response.status}`,
        passed: response.status === options.expectedStatus,
        details: { response: responseData, status: response.status }
      };
      
      // Additional validations based on expected response type
      if (result.passed) {
        if (options.shouldHaveFieldDetails && (!responseData.details || responseData.details.length === 0)) {
          result.passed = false;
          result.error = 'Missing field validation details';
        }
        
        if (options.shouldHaveProgramData && !responseData.program) {
          result.passed = false;
          result.error = 'Missing program data';
        }
        
        if (options.expectServiceError && responseData.code !== 'EXTERNAL_SERVICE_ERROR') {
          result.passed = false;
          result.error = 'Expected service error code not found';
        }
      }
      
      if (result.passed) {
        console.log(chalk.green(`  ✅ ${options.scenario}: ${result.actual}`));
      } else {
        console.log(chalk.red(`  ❌ ${options.scenario}: Expected ${result.expected}, got ${result.actual}`));
        if (result.error) {
          console.log(chalk.red(`     ${result.error}`));
        }
      }
      
      return result;
      
    } catch (error) {
      const result: TestResult = {
        scenario: options.scenario,
        expected: `HTTP ${options.expectedStatus}`,
        actual: 'Request failed',
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      };
      
      console.log(chalk.red(`  ❌ ${options.scenario}: Request failed - ${result.error}`));
      return result;
    }
  }

  /**
   * Print test results summary
   */
  private printResults(): void {
    console.log(chalk.blue.bold('\n📊 Test Results Summary'));
    console.log(chalk.gray('='.repeat(50)));
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failed = total - passed;
    
    console.log(chalk.white(`Total Tests: ${total}`));
    console.log(chalk.green(`Passed: ${passed}`));
    console.log(chalk.red(`Failed: ${failed}`));
    console.log(chalk.cyan(`Success Rate: ${Math.round((passed / total) * 100)}%`));
    
    if (failed > 0) {
      console.log(chalk.red.bold('\n❌ Failed Tests:'));
      this.results
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(chalk.red(`  • ${result.scenario}: ${result.error || 'Unexpected result'}`));
        });
    }
    
    console.log(chalk.blue.bold('\n🎯 Detailed Results:'));
    this.results.forEach(result => {
      const status = result.passed ? chalk.green('PASS') : chalk.red('FAIL');
      console.log(`  ${status} ${result.scenario}: ${result.actual}`);
    });
    
    if (passed === total) {
      console.log(chalk.green.bold('\n🎉 All tests passed! Error handling is working correctly.'));
    } else {
      console.log(chalk.red.bold('\n🚨 Some tests failed. Please review the implementation.'));
      process.exit(1);
    }
  }
}

// Execute tests if this file is run directly
if (require.main === module) {
  const tester = new ErrorScenarioTester();
  tester.runAllTests().catch(error => {
    console.error(chalk.red.bold('Test execution failed:'), error);
    process.exit(1);
  });
}

export default ErrorScenarioTester;
