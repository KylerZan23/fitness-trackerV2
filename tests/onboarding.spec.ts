import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow E2E', () => {
  // Generate unique email for each test run to avoid conflicts
  const generateTestEmail = () => `test-user-${Date.now()}@example.com`
  const testPassword = 'testpassword123'
  const testName = 'Test User'

  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/')
  })

  test('complete onboarding flow from signup to program generation', async ({ page }) => {
    const testEmail = generateTestEmail()

    // Step 1: Navigate to signup page
    await test.step('Navigate to signup page', async () => {
      await page.goto('/signup')
      await expect(page).toHaveTitle(/Sign Up/i)
    })

    // Step 2: Fill out signup form
    await test.step('Complete signup form', async () => {
      // Fill in signup form fields
      await page.fill('input[name="email"]', testEmail)
      await page.fill('input[name="password"]', testPassword)
      await page.fill('input[name="name"]', testName)

      // Submit the form
      await page.click('button[type="submit"]')

      // Wait for successful signup - should redirect to onboarding
      await expect(page).toHaveURL(/\/onboarding/)
    })

    // Step 3: Complete onboarding questions
    await test.step('Answer Primary Goal question', async () => {
      await expect(page.locator('h1')).toContainText('What\'s your main fitness goal?')
      
      // Select "Strength Gain" as primary goal
      await page.click('text=Strength Gain')
      await page.click('button:has-text("Next")')
    })

    await test.step('Answer Secondary Goal question', async () => {
      await expect(page.locator('h1')).toContainText('Any secondary goals?')
      
      // Select "Muscle Gain" as secondary goal
      await page.click('text=Muscle Gain')
      await page.click('button:has-text("Next")')
    })

    await test.step('Answer Experience Level question', async () => {
      await expect(page.locator('h1')).toContainText('What\'s your experience level?')
      
      // Select "Intermediate" experience level
      await page.click('text=Intermediate')
      await page.click('button:has-text("Next")')
    })

    await test.step('Answer Weight Unit question', async () => {
      await expect(page.locator('h1')).toContainText('What weight unit do you prefer?')
      
      // Select "kg" as weight unit
      await page.click('text=Kilograms (kg)')
      await page.click('button:has-text("Next")')
    })

    await test.step('Answer Training Frequency question', async () => {
      await expect(page.locator('h1')).toContainText('How many days per week can you train?')
      
      // Select 4 days per week
      await page.click('text=4 days')
      await page.click('button:has-text("Next")')
    })

    await test.step('Answer Session Duration question', async () => {
      await expect(page.locator('h1')).toContainText('How long per training session?')
      
      // Select "45-60 minutes"
      await page.click('text=45-60 minutes')
      await page.click('button:has-text("Next")')
    })

    await test.step('Answer Equipment question', async () => {
      await expect(page.locator('h1')).toContainText('What equipment do you have access to?')
      
      // Select multiple equipment options
      await page.click('text=Full Gym (Barbells, Racks, Machines)')
      await page.click('text=Dumbbells')
      await page.click('button:has-text("Next")')
    })

    await test.step('Answer Squat 1RM question', async () => {
      await expect(page.locator('h1')).toContainText('What\'s your squat 1RM or estimate?')
      
      // Enter squat 1RM
      await page.fill('input[type="number"]', '120')
      await page.click('button:has-text("Next")')
    })

    await test.step('Answer Bench Press 1RM question', async () => {
      await expect(page.locator('h1')).toContainText('What\'s your bench press 1RM or estimate?')
      
      // Enter bench press 1RM
      await page.fill('input[type="number"]', '90')
      await page.click('button:has-text("Next")')
    })

    await test.step('Answer Deadlift 1RM question', async () => {
      await expect(page.locator('h1')).toContainText('What\'s your deadlift 1RM or estimate?')
      
      // Enter deadlift 1RM
      await page.fill('input[type="number"]', '150')
      await page.click('button:has-text("Next")')
    })

    await test.step('Answer Overhead Press 1RM question', async () => {
      await expect(page.locator('h1')).toContainText('What\'s your overhead press 1RM?')
      
      // Enter overhead press 1RM
      await page.fill('input[type="number"]', '60')
      await page.click('button:has-text("Next")')
    })

    await test.step('Answer Strength Assessment Type question', async () => {
      await expect(page.locator('h1')).toContainText('How did you determine these values?')
      
      // Select "estimated_1rm"
      await page.click('text=Estimated based on recent lifts')
      await page.click('button:has-text("Next")')
    })

    await test.step('Answer Exercise Preferences question', async () => {
      await expect(page.locator('h1')).toContainText('Any exercise preferences or dislikes?')
      
      // Enter exercise preferences
      await page.fill('textarea', 'I love compound movements and prefer free weights over machines')
      await page.click('button:has-text("Next")')
    })

    await test.step('Answer Injuries/Limitations question', async () => {
      await expect(page.locator('h1')).toContainText('Any injuries or limitations we should know about?')
      
      // Skip this question by clicking Next without filling
      await page.click('button:has-text("Next")')
    })

    // Step 4: Review Summary page
    await test.step('Verify Review Summary page', async () => {
      await expect(page.locator('h1')).toContainText('Review Your Profile')
      
      // Verify that key information is displayed
      await expect(page.locator('text=Strength Gain')).toBeVisible()
      await expect(page.locator('text=Muscle Gain')).toBeVisible()
      await expect(page.locator('text=Intermediate')).toBeVisible()
      await expect(page.locator('text=4 days')).toBeVisible()
      await expect(page.locator('text=45-60 minutes')).toBeVisible()
      await expect(page.locator('text=120')).toBeVisible() // Squat 1RM
      await expect(page.locator('text=90')).toBeVisible()  // Bench Press 1RM
      await expect(page.locator('text=150')).toBeVisible() // Deadlift 1RM
      await expect(page.locator('text=60')).toBeVisible()  // Overhead Press 1RM
      
      // Confirm and complete onboarding
      await page.click('button:has-text("Complete Setup")')
    })

    // Step 5: Verify redirection to program page
    await test.step('Verify redirection to program page', async () => {
      // Should be redirected to the program page
      await expect(page).toHaveURL(/\/program/)
      
      // Wait for program generation to complete
      await page.waitForTimeout(5000) // Give some time for program generation
      
      // Verify that a program has been generated and displayed
      await expect(page.locator('h1')).toContainText(/Your Training Program|Training Program/i)
      
      // Check for program structure elements
      await expect(page.locator('text=/Phase|Week|Day/i')).toBeVisible()
      
      // Verify that exercises are displayed
      const exerciseElements = page.locator('[data-testid="exercise"], .exercise, text=/Squat|Bench|Deadlift|Press/')
      await expect(exerciseElements.first()).toBeVisible()
      
      // Verify that the program reflects our onboarding choices
      // Should show strength-focused exercises since we selected "Strength Gain"
      await expect(page.locator('text=/Squat|Bench Press|Deadlift|Overhead Press/i')).toBeVisible()
    })

    // Step 6: Verify program functionality
    await test.step('Verify program page functionality', async () => {
      // Check that we can navigate through program phases/weeks
      const phaseButtons = page.locator('button:has-text("Phase"), button:has-text("Week")')
      if (await phaseButtons.count() > 0) {
        await phaseButtons.first().click()
        await expect(page.locator('text=/Phase|Week/i')).toBeVisible()
      }
      
      // Check that exercise details are visible
      const exerciseDetails = page.locator('text=/sets|reps|%|kg|lbs/i')
      await expect(exerciseDetails.first()).toBeVisible()
      
      // Verify that weight unit preference (kg) is respected
      await expect(page.locator('text=/kg/')).toBeVisible()
    })
  })

  test('handle validation errors during onboarding', async ({ page }) => {
    const testEmail = generateTestEmail()

    // Complete signup first
    await page.goto('/signup')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.fill('input[name="name"]', testName)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/onboarding/)

    // Test validation on required questions
    await test.step('Test validation on Primary Goal question', async () => {
      await expect(page.locator('h1')).toContainText('What\'s your main fitness goal?')
      
      // Try to proceed without selecting anything
      await page.click('button:has-text("Next")')
      
      // Should show validation error
      await expect(page.locator('text=/Please select|required|choose/i')).toBeVisible()
    })
  })

  test('navigate back and forth through onboarding questions', async ({ page }) => {
    const testEmail = generateTestEmail()

    // Complete signup first
    await page.goto('/signup')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.fill('input[name="name"]', testName)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/onboarding/)

    // Answer first question
    await page.click('text=Strength Gain')
    await page.click('button:has-text("Next")')

    // Answer second question
    await page.click('text=Muscle Gain')
    await page.click('button:has-text("Next")')

    // Go back to previous question
    const backButton = page.locator('button:has-text("Back"), button:has-text("Previous")')
    if (await backButton.isVisible()) {
      await backButton.click()
      
      // Should be back to secondary goal question
      await expect(page.locator('h1')).toContainText('Any secondary goals?')
      
      // Verify that previous answer is preserved
      const selectedOption = page.locator('.selected, [aria-selected="true"], .bg-primary')
      await expect(selectedOption).toContainText('Muscle Gain')
    }
  })

  test('skip optional questions and complete onboarding', async ({ page }) => {
    const testEmail = generateTestEmail()

    // Complete signup first
    await page.goto('/signup')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.fill('input[name="name"]', testName)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/onboarding/)

    // Answer only required questions
    await test.step('Answer required questions only', async () => {
      // Primary Goal
      await page.click('text=General Fitness')
      await page.click('button:has-text("Next")')

      // Skip Secondary Goal
      const skipButton = page.locator('button:has-text("Skip"), button:has-text("Next")')
      await skipButton.click()

      // Experience Level
      await page.click('text=Beginner')
      await page.click('button:has-text("Next")')

      // Weight Unit
      await page.click('text=Pounds (lbs)')
      await page.click('button:has-text("Next")')

      // Training Frequency
      await page.click('text=3 days')
      await page.click('button:has-text("Next")')

      // Session Duration
      await page.click('text=30-45 minutes')
      await page.click('button:has-text("Next")')

      // Equipment
      await page.click('text=Bodyweight Only')
      await page.click('button:has-text("Next")')

      // Skip all strength questions by clicking Next/Skip repeatedly
      for (let i = 0; i < 10; i++) {
        const nextOrSkipButton = page.locator('button:has-text("Next"), button:has-text("Skip")')
        if (await nextOrSkipButton.isVisible()) {
          await nextOrSkipButton.click()
          await page.waitForTimeout(500) // Small delay to allow page transitions
        }
        
        // Check if we've reached the review page
        const reviewHeading = page.locator('h1:has-text("Review Your Profile")')
        if (await reviewHeading.isVisible()) {
          break
        }
      }
    })

    // Should reach review page and be able to complete
    await test.step('Complete onboarding with minimal data', async () => {
      await expect(page.locator('h1')).toContainText('Review Your Profile')
      await page.click('button:has-text("Complete Setup")')
      
      // Should still redirect to program page
      await expect(page).toHaveURL(/\/program/)
      
      // Program should be generated even with minimal data
      await page.waitForTimeout(3000)
      await expect(page.locator('h1')).toContainText(/Your Training Program|Training Program/i)
    })
  })

  test('handle mobile responsive design during onboarding', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    const testEmail = generateTestEmail()

    // Complete signup on mobile
    await page.goto('/signup')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.fill('input[name="name"]', testName)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/onboarding/)

    // Verify mobile layout works
    await test.step('Verify mobile onboarding layout', async () => {
      // Question should be visible and properly formatted
      await expect(page.locator('h1')).toBeVisible()
      
      // Options should be tappable on mobile
      await page.click('text=Strength Gain')
      await page.click('button:has-text("Next")')
      
      // Should navigate to next question
      await expect(page.locator('h1')).toContainText('Any secondary goals?')
    })
  })
}) 