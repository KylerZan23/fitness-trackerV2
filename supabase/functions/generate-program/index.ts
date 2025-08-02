import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Note: We can't import the shared library due to TypeScript path aliases
// This Edge Function will handle the core generation logic directly

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Program generation guidelines (simplified for Edge Function)
const VOLUME_FRAMEWORK_GUIDELINES = `
VOLUME LANDMARKS (weekly sets per muscle group):
- MEV (Minimum Effective Volume): Minimum sets needed for growth
- MAV (Maximum Adaptive Volume): Optimal volume for progress
- MRV (Maximum Recoverable Volume): Maximum volume before overtraining
- Start programs at MEV, progress toward MAV, never exceed MRV
`

const AUTOREGULATION_GUIDELINES = `
AUTOREGULATION PRINCIPLES:
- Use RPE (Rate of Perceived Exertion) 6-9 scale
- Adjust load based on daily readiness
- Maintain rep targets, adjust weight as needed
- Include deload weeks every 4-6 weeks
`

const PERIODIZATION_GUIDELINES = `
PERIODIZATION MODELS:
- Linear: Progressive overload with volume/intensity trade-off
- Undulating: Daily/weekly variation in intensity and volume
- Block: Concentrated loading with specific training blocks
- Choose based on experience level and goals
`

const EXERCISE_SELECTION_GUIDELINES = `
EXERCISE SELECTION HIERARCHY:
1. Primary Compounds: Major multi-joint movements (squat, bench, deadlift, overhead press)
2. Secondary Compounds: Supporting compound movements (rows, lunges, dips)
3. Isolation: Single-joint movements for specific muscle targeting
- Anchor lifts: First exercise of each workout, primary progression focus
- Accessory work: 2-4 exercises per workout for balanced development
`

const NEURAL_COACHING_CUES = `
NEURAL'S COACHING VOICE:
- Scientific yet approachable tone
- Reference evidence-based principles
- Provide specific, actionable guidance
- Encourage consistency and patience
- Address individual needs and limitations
`

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let programId: string | null = null

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Parse request body
    const body = await req.json()
    programId = body.programId

    if (!programId) {
      return new Response(
        JSON.stringify({ error: 'Missing programId in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Authenticate the user from the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired authentication token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🔐 Authenticated user: ${user.id} for program generation: ${programId}`)

    // Verify user owns the program they're trying to generate
    const { data: programRecord, error: programError } = await supabase
      .from('training_programs')
      .select('user_id, generation_status')
      .eq('id', programId)
      .single()

    if (programError || !programRecord) {
      return new Response(
        JSON.stringify({ error: 'Program not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (programRecord.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied. You can only generate your own programs.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if program is already being processed or completed
    if (programRecord.generation_status === 'processing') {
      return new Response(
        JSON.stringify({ 
          error: 'Program generation is already in progress',
          status: 'processing'
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (programRecord.generation_status === 'completed') {
      return new Response(
        JSON.stringify({ 
          message: 'Program has already been generated',
          status: 'completed'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🚀 Starting background program generation for program ID: ${programId}`)

    // Start background processing immediately (don't await)
    processGenerationInBackground(programId, supabase)
      .catch(error => {
        console.error(`❌ Background generation failed for program ${programId}:`, error)
        // Error handling is done within the background process
      })

    // Return 202 Accepted immediately to indicate the job has been accepted
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Program generation started successfully',
        programId: programId,
        status: 'processing'
      }),
      { 
        status: 202, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Edge function error:', error)
    
    // Try to update the program record with error status
    if (programId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })

        await supabase
          .from('training_programs')
          .update({
            generation_status: 'failed',
            generation_error: error.message
          })
          .eq('id', programId)
      } catch (updateError) {
        console.error('Failed to update error status:', updateError)
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error during program generation',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Background Processing Function - runs asynchronously
async function processGenerationInBackground(programId: string, supabase: any): Promise<void> {
  try {
    console.log(`🚀 Starting background program generation for program ID: ${programId}`)

    // Update status to processing
    await supabase
      .from('training_programs')
      .update({ 
        generation_status: 'processing',
        generation_error: null 
      })
      .eq('id', programId)

    // Fetch the program record with user data
    const { data: fullProgramRecord, error: fetchError } = await supabase
      .from('training_programs')
      .select(`
        id,
        user_id,
        onboarding_data_snapshot,
        profiles!inner(
          name,
          age,
          weight_unit,
          primary_training_focus,
          experience_level,
          is_premium,
          trial_ends_at
        )
      `)
      .eq('id', programId)
      .single()

    if (fetchError || !fullProgramRecord) {
      throw new Error(`Failed to fetch program record: ${fetchError?.message || 'Record not found'}`)
    }

    const profile = fullProgramRecord.profiles as any
    const onboardingData = fullProgramRecord.onboarding_data_snapshot

    if (!onboardingData) {
      throw new Error('No onboarding data found for program generation')
    }

    // Check subscription status
    const now = new Date()
    const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
    const isTrialActive = trialEndsAt ? trialEndsAt > now : false
    const hasPaidAccess = profile.is_premium || isTrialActive

    console.log(`💰 User subscription status - Premium: ${profile.is_premium}, Trial Active: ${isTrialActive}, Has Paid Access: ${hasPaidAccess}`)

    // Generate the program using enhanced AI pipeline
    const generatedProgram = await generateEnhancedProgramWithAI(
      profile,
      onboardingData,
      hasPaidAccess,
      supabase
    )

    // Update the program record with results including enhanced metadata
    const { error: updateError } = await supabase
      .from('training_programs')
      .update({
        generation_status: 'completed',
        generation_error: null,
        program_details: generatedProgram.program,
        ai_model_version: generatedProgram.program.aiModelUsed || 'gpt-4o',
        weak_point_analysis: generatedProgram.metadata.weakPointAnalysis,
        periodization_model: generatedProgram.metadata.periodizationModel,
        generation_metadata: {
          processingTimestamp: new Date().toISOString(),
          enhancedUserProfile: generatedProgram.metadata.enhancedProfile,
          processingDuration: generatedProgram.metadata.processingDuration
        },
        volume_landmarks: generatedProgram.metadata.volumeLandmarks
      })
      .eq('id', programId)

    if (updateError) {
      throw new Error(`Failed to update program record: ${updateError.message}`)
    }

    console.log(`🎉 Program generation completed successfully for program ID: ${programId}`)

  } catch (error: any) {
    console.error(`❌ Background generation failed for program ID: ${programId}`, error)
    
    // Update status to failed with error message
    await supabase
      .from('training_programs')
      .update({ 
        generation_status: 'failed',
        generation_error: error.message || 'Unknown error occurred during generation'
      })
      .eq('id', programId)
    
    throw error
  }
}

// Enhanced AI Program Generation Function with Scientific Processing
async function generateEnhancedProgramWithAI(
  profile: any,
  onboardingData: any,
  hasPaidAccess: boolean,
  supabase: any
): Promise<{
  program: any,
  metadata: {
    weakPointAnalysis: any,
    periodizationModel: string,
    enhancedProfile: any,
    volumeLandmarks: any,
    processingDuration: number
  }
}> {
  const startTime = Date.now()
  
  try {
    console.log('🤖 Starting enhanced AI program generation with scientific processing...')

    // Step 1: Process enhanced user data
    console.log('📊 Processing enhanced user data...')
    const processingResult = await processEnhancedUserData(profile, onboardingData)

    // Step 2: Construct enhanced prompt with scientific data
    console.log('🔬 Constructing enhanced prompt with scientific analysis...')
    const prompt = constructEnhancedProgramPrompt(profile, onboardingData, processingResult, hasPaidAccess)

    // Step 3: Call the LLM API with enhanced prompt
    console.log('🤖 Calling enhanced LLM API...')
    const llmResponse = await callLLMAPI(prompt)

    if (!llmResponse.program) {
      throw new Error(`LLM API error: ${llmResponse.error}`)
    }

    // Step 4: Validate and structure the response
    const program = {
      ...llmResponse.program,
      generatedAt: new Date().toISOString(),
      aiModelUsed: 'gpt-4o'
    }

    const processingDuration = Date.now() - startTime
    console.log(`✅ Enhanced AI program generation completed successfully in ${processingDuration}ms`)
    
    return {
      program,
      metadata: {
        weakPointAnalysis: processingResult.weakPointAnalysis,
        periodizationModel: processingResult.periodizationModel,
        enhancedProfile: {
          trainingAge: processingResult.enhancedProfile.volumeParameters.trainingAge,
          recoveryCapacity: processingResult.enhancedProfile.volumeParameters.recoveryCapacity,
          stressLevel: processingResult.enhancedProfile.volumeParameters.stressLevel,
          volumeTolerance: processingResult.enhancedProfile.volumeParameters.volumeTolerance,
        },
        volumeLandmarks: processingResult.volumeLandmarks,
        processingDuration
      }
    }

  } catch (error) {
    console.error('❌ Enhanced AI program generation failed:', error)
    throw error
  }
}

// Legacy AI Program Generation Function (kept for compatibility)
async function generateProgramWithAI(
  profile: any,
  onboardingData: any,
  hasPaidAccess: boolean,
  supabase: any
): Promise<any> {
  try {
    console.log('🤖 Starting AI program generation...')

    // Construct the prompt for the AI
    const prompt = constructProgramPrompt(profile, onboardingData, hasPaidAccess)

    // Call the LLM API
    const llmResponse = await callLLMAPI(prompt)

    if (!llmResponse.program) {
      throw new Error(`LLM API error: ${llmResponse.error}`)
    }

    // Validate and structure the response
    const program = {
      ...llmResponse.program,
      generatedAt: new Date().toISOString(),
      aiModelUsed: 'gpt-4o'
    }

    console.log('✅ AI program generation completed successfully')
    return program

  } catch (error) {
    console.error('❌ AI program generation failed:', error)
    throw error
  }
}

// Construct the AI prompt
function constructProgramPrompt(profile: any, onboardingData: any, hasPaidAccess: boolean): string {
  const { primaryGoal, trainingFrequencyDays, sessionDuration, equipment, injuriesLimitations } = onboardingData
  const { name, age, experience_level } = profile

  const durationWeeks = hasPaidAccess ? getDurationBasedOnGoals(onboardingData, true) : 1

  const prompt = `You are Neural, an elite exercise scientist and evidence-based coach AI. Generate a personalized training program for:

USER PROFILE:
- Name: ${name}
- Age: ${age}
- Experience Level: ${experience_level || 'Beginner'}
- Primary Goal: ${primaryGoal}
- Training Frequency: ${trainingFrequencyDays} days/week
- Session Duration: ${sessionDuration}
- Equipment: ${equipment.join(', ')}
- Injuries/Limitations: ${injuriesLimitations || 'None'}

${!hasPaidAccess ? `
**FREE TRIAL USER - EXAMPLE WEEK ONLY**
- Generate exactly ONE example week from their full training program
- This is a sample week to demonstrate program quality
- Structure as Week 3 of a ${getDurationBasedOnGoals(onboardingData, true)}-week program
- Emphasize this is just a taste of their full personalized program
- Make it compelling enough to encourage upgrading
` : `
**FULL PROGRAM GENERATION**
- Create a ${durationWeeks}-week program with appropriate phases
- Include proper periodization and progression
`}

PROGRAM REQUIREMENTS:
- Each workout should have 6-10 exercises (including warm-up/cool-down)
- Use dayOfWeek numbers (1=Monday, 2=Tuesday, etc.)
- For rest days: set isRestDay: true, empty exercises array
- Set estimatedDurationMinutes to match user's session length preference
- Provide weight guidance using percentages of 1RM, RPE, or load progression
- Adapt all exercises for available equipment and injury considerations

SCIENTIFIC GUIDELINES:
${VOLUME_FRAMEWORK_GUIDELINES}
${AUTOREGULATION_GUIDELINES}
${PERIODIZATION_GUIDELINES}
${EXERCISE_SELECTION_GUIDELINES}

COACHING VOICE:
${NEURAL_COACHING_CUES}

Return ONLY valid JSON matching this structure:
Your response MUST be a single, valid, minified JSON object and nothing else. Do not include any explanatory text, markdown formatting, or any characters before or after the JSON object. The entire output must be parsable by JSON.parse().
{
  "programName": "string",
  "description": "string", 
  "durationWeeksTotal": number,
  "phases": [{
    "phaseName": "string",
    "durationWeeks": number,
    "weeks": [{
      "weekNumber": number,
      "days": [{
        "dayOfWeek": number,
        "focus": "string",
        "exercises": [{
          "name": "string",
          "sets": number,
          "reps": "string",
          "rest": "string",
          "notes": "string"
        }],
        "isRestDay": boolean,
        "estimatedDurationMinutes": number
      }]
    }]
  }]
}`

  return prompt
}

// Helper function to determine program duration
function getDurationBasedOnGoals(onboardingData: any, isPaidUser: boolean): number {
  if (!isPaidUser) return 1

  const { primaryGoal } = onboardingData

  if (primaryGoal === 'General Fitness: Foundational Strength') return 4
  if (primaryGoal === 'Muscle Gain: General' || primaryGoal === 'Muscle Gain: Hypertrophy Focus') return 6
  if (primaryGoal === 'Strength Gain: General' || primaryGoal === 'Strength Gain: Powerlifting Peak') return 6
  if (primaryGoal === 'Endurance Improvement: Gym Cardio') return 5
  if (primaryGoal === 'Sport-Specific S&C: Explosive Power') return 6
  if (primaryGoal === 'Weight Loss: Gym Based') return 5
  if (primaryGoal === 'Bodyweight Mastery') return 6
  if (primaryGoal === 'Recomposition: Lean Mass & Fat Loss') return 6

  return 6
}

// Call LLM API with retry mechanism
async function callLLMAPI(prompt: string): Promise<{ program?: any; error?: string }> {
  const MAX_RETRIES = 3;
  const INITIAL_DELAY_MS = 1000;
  let lastError: any = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🤖 Calling LLM API... Attempt ${attempt}/${MAX_RETRIES}`);
      const apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) {
        throw new Error('Missing OPENAI_API_KEY environment variable');
      }

      const apiEndpoint = 'https://api.openai.com/v1/chat/completions';

      const body = {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorDetails = response.statusText;
        try {
          const errorData = await response.json();
          errorDetails = errorData.error?.message || JSON.stringify(errorData) || response.statusText;
        } catch (e) {
          // Ignore if error response is not JSON
        }
        throw new Error(`LLM API Error: ${response.status} - ${errorDetails}`);
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
        throw new Error('Invalid response structure from LLM.');
      }

      const contentString = data.choices[0].message.content;
      
      const extractJsonFromString = (text: string): string | null => {
        const match = text.match(/\{[\s\S]*\}/);
        return match ? match[0] : null;
      };

      const jsonString = extractJsonFromString(contentString);

      if (!jsonString) {
        console.error('Failed to find any JSON object in LLM response:', contentString);
        throw new Error('LLM did not return a recognizable JSON object.');
      }
      
      try {
        const program = JSON.parse(jsonString);
        return { program }; // Success
      } catch (parseError) {
        console.error('Failed to parse extracted LLM JSON response:', jsonString);
        console.error('Original full LLM response:', contentString);
        throw new Error('LLM returned invalid JSON, even after extraction.');
      }
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('LLM API call failed after all retries:', lastError);
  return {
    error: lastError?.message || 'Failed to communicate with AI service after multiple attempts.',
  };
}

// Enhanced User Data Processing (adapted from shared library)
async function processEnhancedUserData(profile: any, onboardingData: any): Promise<{
  enhancedProfile: any,
  volumeLandmarks: any,
  weakPointAnalysis: any,
  periodizationModel: string,
  autoregulationNotes: string,
  identifiedWeakPoints: string[]
}> {
  try {
    console.log('🔬 Starting enhanced user data processing...')

    // Generate enhanced user profile with volume parameters
    const enhancedProfile = generateEnhancedUserProfile(profile, onboardingData)

    // Calculate individualized volume landmarks
    const volumeLandmarks = calculateAllMuscleLandmarks(enhancedProfile.volumeParameters)

    // Perform weak point analysis if strength data is available
    let weakPointAnalysis = null
    let identifiedWeakPoints: string[] = []
    
    if (onboardingData.squat1RMEstimate && onboardingData.benchPress1RMEstimate && 
        onboardingData.deadlift1RMEstimate && onboardingData.overheadPress1RMEstimate) {
      const strengthProfile = {
        squat1RM: onboardingData.squat1RMEstimate,
        bench1RM: onboardingData.benchPress1RMEstimate,
        deadlift1RM: onboardingData.deadlift1RMEstimate,
        overheadPress1RM: onboardingData.overheadPress1RMEstimate
      }
      weakPointAnalysis = enhancedWeakPointAnalysis(strengthProfile)
      identifiedWeakPoints = weakPointAnalysis.primaryWeakPoints || []
    }

    // Select appropriate periodization model
    const periodizationModel = selectPeriodizationModel(
      profile.experience_level || 'Beginner', 
      onboardingData.primaryGoal
    )

    // Generate autoregulation recommendations
    const autoregulationNotes = generateAutoregulationNotes(
      enhancedProfile.rpeProfile, 
      enhancedProfile.recoveryProfile
    )

    console.log('✅ Enhanced user data processing completed')

    return {
      enhancedProfile,
      volumeLandmarks,
      weakPointAnalysis,
      periodizationModel,
      autoregulationNotes,
      identifiedWeakPoints
    }
  } catch (error) {
    console.error('❌ Enhanced user data processing failed:', error)
    throw error
  }
}

// Simplified enhanced user profile generation
function generateEnhancedUserProfile(profile: any, onboardingData: any): any {
  const experienceLevel = profile.experience_level || 'Beginner'
  const age = profile.age || 25
  
  // Simplified volume parameters calculation
  const trainingAge = experienceLevel === 'Beginner' ? 0.5 : 
                      experienceLevel === 'Intermediate' ? 2.5 : 5.0
  
  const recoveryCapacity = age < 25 ? 1.2 : age < 35 ? 1.0 : age < 45 ? 0.8 : 0.6
  const stressLevel = 0.5 // Default moderate stress
  const volumeTolerance = experienceLevel === 'Beginner' ? 0.8 : 
                          experienceLevel === 'Intermediate' ? 1.0 : 1.2

  return {
    volumeParameters: {
      trainingAge,
      recoveryCapacity,
      stressLevel,
      volumeTolerance
    },
    rpeProfile: {
      accuracy: experienceLevel === 'Beginner' ? 0.7 : 0.9,
      preference: 'moderate'
    },
    recoveryProfile: {
      recoveryRate: recoveryCapacity,
      fatigueThreshold: 7.5
    }
  }
}

// Calculate muscle volume landmarks
function calculateAllMuscleLandmarks(volumeParameters: any): any {
  const { volumeTolerance, recoveryCapacity } = volumeParameters
  
  const baseLandmarks = {
    'Chest': { MEV: 8, MAV: 14, MRV: 20 },
    'Back': { MEV: 10, MAV: 16, MRV: 24 },
    'Shoulders': { MEV: 8, MAV: 14, MRV: 20 },
    'Arms': { MEV: 6, MAV: 12, MRV: 18 },
    'Legs': { MEV: 10, MAV: 16, MRV: 24 },
    'Core': { MEV: 6, MAV: 10, MRV: 16 }
  }

  // Adjust based on individual parameters
  const adjustedLandmarks: any = {}
  Object.entries(baseLandmarks).forEach(([muscle, landmarks]: [string, any]) => {
    adjustedLandmarks[muscle] = {
      MEV: Math.round(landmarks.MEV * volumeTolerance),
      MAV: Math.round(landmarks.MAV * volumeTolerance * recoveryCapacity),
      MRV: Math.round(landmarks.MRV * volumeTolerance * recoveryCapacity)
    }
  })

  return adjustedLandmarks
}

// Enhanced weak point analysis
function enhancedWeakPointAnalysis(strengthProfile: any): any {
  const { squat1RM, bench1RM, deadlift1RM, overheadPress1RM } = strengthProfile
  
  // Calculate strength ratios
  const benchToDeadlift = bench1RM / deadlift1RM
  const squatToDeadlift = squat1RM / deadlift1RM
  const ohpToBench = overheadPress1RM / bench1RM
  
  const weakPoints: string[] = []
  
  if (benchToDeadlift < 0.65) weakPoints.push('Chest and Pressing Strength')
  if (squatToDeadlift < 0.85) weakPoints.push('Quad Strength and Knee Dominance')
  if (ohpToBench < 0.6) weakPoints.push('Shoulder Stability and Overhead Strength')
  if (deadlift1RM < squat1RM * 1.1) weakPoints.push('Posterior Chain and Hip Hinge')
  
  return {
    primaryWeakPoints: weakPoints,
    strengthRatios: {
      benchToDeadlift,
      squatToDeadlift,
      ohpToBench
    }
  }
}

// Select periodization model
function selectPeriodizationModel(experienceLevel: string, primaryGoal: string): string {
  if (primaryGoal.includes('Strength Gain') || primaryGoal.includes('Powerlifting')) {
    return 'Strength-Focused Block Periodization'
  }
  
  if (primaryGoal.includes('Muscle Gain') || primaryGoal.includes('Hypertrophy')) {
    return 'Hypertrophy-Focused Block Periodization'
  }
  
  if (primaryGoal.includes('General Fitness') || experienceLevel === 'Beginner') {
    return 'Linear Progression Model'
  }
  
  return 'Balanced Block Periodization'
}

// Generate autoregulation notes
function generateAutoregulationNotes(rpeProfile: any, recoveryProfile: any): string {
  return `RPE Target Ranges:
- Accumulation Phase: 6-8 RPE (emphasizing volume)
- Intensification Phase: 7-9 RPE (emphasizing load)
- Realization Phase: 8-10 RPE (peaking activities)
- Deload Phase: 4-6 RPE (restoration focus)

Daily Adjustments:
- High readiness days: Add 2-5% load or 1-2 sets
- Normal readiness: Execute planned session
- Low readiness: Reduce intensity 10-20% or volume 20-30%
- Very low readiness: Active recovery or complete rest

Recovery Capacity: ${recoveryProfile.recoveryRate}/2.0 (1.0 = average)
Fatigue Threshold: ${recoveryProfile.fatigueThreshold}/10`
}

// Enhanced prompt construction with scientific data
function constructEnhancedProgramPrompt(profile: any, onboardingData: any, processingResult: any, hasPaidAccess: boolean): string {
  const { primaryGoal, trainingFrequencyDays, sessionDuration, equipment, injuriesLimitations } = onboardingData
  const { name, age, experience_level } = profile
  const { enhancedProfile, volumeLandmarks, weakPointAnalysis, periodizationModel } = processingResult

  const durationWeeks = hasPaidAccess ? getDurationBasedOnGoals(onboardingData, true) : 1
  const weightUnit = profile.weight_unit || 'kg'

  return `You are Neural, an elite exercise scientist and evidence-based coach AI. Create a scientifically-grounded training program based on the user's enhanced profile analysis.

USER PROFILE:
- Name: ${name}, Age: ${age}, Experience: ${experience_level || 'Beginner'}
- Goal: ${primaryGoal}
- Training: ${trainingFrequencyDays} days/week, ${sessionDuration}
- Equipment: ${equipment.join(', ')}
- Injuries/Limitations: ${injuriesLimitations || 'None'}
- Periodization: ${periodizationModel}
${weakPointAnalysis && weakPointAnalysis.primaryWeakPoints && weakPointAnalysis.primaryWeakPoints.length > 0 ? 
  `- Weak Points: ${weakPointAnalysis.primaryWeakPoints.join(', ')}` : ''}

SCIENTIFIC FRAMEWORK:
${VOLUME_FRAMEWORK_GUIDELINES}
${AUTOREGULATION_GUIDELINES}
${PERIODIZATION_GUIDELINES}
${EXERCISE_SELECTION_GUIDELINES}

INDIVIDUALIZED VOLUME GUIDELINES (weekly sets):
${Object.entries(volumeLandmarks).map(([muscle, landmarks]: [string, any]) => 
  `${muscle}: MEV ${landmarks.MEV}, MAV ${landmarks.MAV}, MRV ${landmarks.MRV}`
).join(' | ')}

STRENGTH PROFILE (${weightUnit}):
- Squat 1RM: ${onboardingData.squat1RMEstimate || 'Not provided'}
- Bench Press 1RM: ${onboardingData.benchPress1RMEstimate || 'Not provided'}  
- Deadlift 1RM: ${onboardingData.deadlift1RMEstimate || 'Not provided'}
- Overhead Press 1RM: ${onboardingData.overheadPress1RMEstimate || 'Not provided'}

USER CAPACITY PARAMETERS:
- Training Age: ${enhancedProfile.volumeParameters.trainingAge} years
- Recovery Capacity: ${enhancedProfile.volumeParameters.recoveryCapacity}/2.0
- Volume Tolerance: ${enhancedProfile.volumeParameters.volumeTolerance}/2.0

${!hasPaidAccess ? `
**FREE TRIAL USER - EXAMPLE WEEK ONLY**
- Generate exactly ONE example week from their full training program
- This is a sample week to demonstrate program quality
- Structure as Week 3 of a ${getDurationBasedOnGoals(onboardingData, true)}-week program
- Emphasize this is just a taste of their full personalized program
` : `
**FULL PROGRAM GENERATION**
- Create a ${durationWeeks}-week program with appropriate phases
- Include proper periodization and progression
`}

REQUIREMENTS:
1. Respect volume landmarks (start at MEV, progress to MAV, never exceed MRV)
2. Include anchor lifts as first exercise on training days
3. Use appropriate RPE targets (6-8 RPE typically)
4. Address identified weak points through exercise selection
5. Each workout should have 6-10 exercises (including warm-up/cool-down)
6. Use dayOfWeek numbers (1=Monday, 2=Tuesday, etc.)
7. For rest days: set isRestDay: true, empty exercises array
8. Set estimatedDurationMinutes to match user's session length preference

COACHING VOICE:
${NEURAL_COACHING_CUES}

Return ONLY valid JSON matching this structure:
Your response MUST be a single, valid, minified JSON object and nothing else. Do not include any explanatory text, markdown formatting, or any characters before or after the JSON object. The entire output must be parsable by JSON.parse().
{
  "programName": "string",
  "description": "string", 
  "durationWeeksTotal": number,
  "phases": [{
    "phaseName": "string",
    "durationWeeks": number,
    "weeks": [{
      "weekNumber": number,
      "days": [{
        "dayOfWeek": number,
        "focus": "string",
        "exercises": [{
          "name": "string",
          "sets": number,
          "reps": "string",
          "rest": "string",
          "rpe": number,
          "notes": "string"
        }],
        "isRestDay": boolean,
        "estimatedDurationMinutes": number
      }]
    }]
  }]
}`
}