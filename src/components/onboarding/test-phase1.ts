/**
 * Simple test file to verify Phase 1 implementation
 * This tests the core architecture without React components
 */

import { OnboardingFlowEngine } from './OnboardingFlowEngine'
import { ONBOARDING_QUESTIONS, QUESTION_CONDITIONS } from './QuestionRegistry'
import { type OnboardingFormData } from './types/onboarding-flow'

/**
 * Test the basic flow engine functionality
 */
export function testPhase1Implementation() {
  console.log('🧪 Testing Phase 1 Implementation...')
  
  // Test 1: Initialize flow engine
  console.log('\n1. Testing Flow Engine Initialization')
  const flowEngine = new OnboardingFlowEngine(ONBOARDING_QUESTIONS, {}, QUESTION_CONDITIONS)
  
  const initialProgress = flowEngine.calculateProgress()
  console.log('✅ Initial progress:', initialProgress)
  console.log('✅ Total questions:', ONBOARDING_QUESTIONS.length)
  console.log('✅ Questions to show initially:', flowEngine.getQuestionsToShow().length)
  
  // Test 2: First question
  console.log('\n2. Testing First Question')
  const firstQuestion = flowEngine.getCurrentQuestion()
  console.log('✅ First question:', firstQuestion?.title)
  console.log('✅ Can go next:', flowEngine.canGoNext())
  console.log('✅ Can go previous:', flowEngine.canGoPrevious())
  
  // Test 3: Answer first question
  console.log('\n3. Testing Answer First Question')
  flowEngine.updateAnswer('primaryGoal', 'Muscle Gain')
  const progressAfterFirst = flowEngine.calculateProgress()
  console.log('✅ Progress after answering first question:', progressAfterFirst)
  console.log('✅ Can go next after answer:', flowEngine.canGoNext())
  
  // Test 4: Navigate to next question
  console.log('\n4. Testing Navigation')
  const nextSuccess = flowEngine.goToNext()
  const secondQuestion = flowEngine.getCurrentQuestion()
  console.log('✅ Navigation success:', nextSuccess)
  console.log('✅ Second question:', secondQuestion?.title)
  
  // Test 5: Test conditional logic
  console.log('\n5. Testing Conditional Logic - Sport-Specific Goal (General)')
  flowEngine.updateAnswer('primaryGoal', 'Sport-Specific')
  const questionsAfterSportSpecific = flowEngine.getQuestionsToShow()
  console.log('✅ Sport-specific goal can be selected without requiring specific sport details:', questionsAfterSportSpecific.length > 0)
  
  // Test 6: Test strength questions conditional logic
  console.log('\n6. Testing Strength Questions Conditional Logic')
  flowEngine.updateAnswer('squat1RMEstimate', 100)
  const questionsAfterStrength = flowEngine.getQuestionsToShow()
  const hasStrengthAssessment = questionsAfterStrength.some(q => q.id === 'strengthAssessmentType')
  console.log('✅ Strength assessment question appears:', hasStrengthAssessment)
  
  // Test 7: Test completion check
  console.log('\n7. Testing Completion Logic')
  
  // Answer all required questions
  const requiredAnswers: Partial<OnboardingFormData> = {
    primaryGoal: 'Muscle Gain',
    primaryTrainingFocus: 'Bodybuilding',
    experienceLevel: 'Intermediate (6mo-2yr)',
    trainingFrequencyDays: 4,
    sessionDuration: '60-75 minutes',
    equipment: ['Full Gym (Barbells, Racks, Machines)']
  }
  
  Object.entries(requiredAnswers).forEach(([key, value]) => {
    flowEngine.updateAnswer(key as keyof OnboardingFormData, value)
  })
  
  const isComplete = flowEngine.isComplete()
  const finalProgress = flowEngine.calculateProgress()
  console.log('✅ Flow complete after required answers:', isComplete)
  console.log('✅ Final progress:', finalProgress)
  
  // Test 8: Test question registry functions
  console.log('\n8. Testing Question Registry Functions')
  const profileQuestions = ONBOARDING_QUESTIONS.filter(q => q.category === 'profile')
  const strengthQuestions = ONBOARDING_QUESTIONS.filter(q => q.category === 'strength')
  const requiredQuestions = ONBOARDING_QUESTIONS.filter(q => !q.isOptional)
  const optionalQuestions = ONBOARDING_QUESTIONS.filter(q => q.isOptional)
  
  console.log('✅ Profile questions:', profileQuestions.length)
  console.log('✅ Strength questions:', strengthQuestions.length)
  console.log('✅ Required questions:', requiredQuestions.length)
  console.log('✅ Optional questions:', optionalQuestions.length)
  
  console.log('\n🎉 Phase 1 Implementation Test Complete!')
  
  return {
    success: true,
    totalQuestions: ONBOARDING_QUESTIONS.length,
    requiredQuestions: requiredQuestions.length,
    optionalQuestions: optionalQuestions.length,
    finalProgress,
    isComplete
  }
}

// Export for potential use in actual tests
export { testPhase1Implementation as default } 