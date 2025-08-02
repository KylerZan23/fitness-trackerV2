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

    // Generate the program using AI
    const generatedProgram = await generateProgramWithAI(
      profile,
      onboardingData,
      hasPaidAccess,
      supabase
    )

    // Update the program record with results
    const { error: updateError } = await supabase
      .from('training_programs')
      .update({
        generation_status: 'completed',
        generation_error: null,
        program_details: generatedProgram,
        ai_model_version: generatedProgram.aiModelUsed || 'gpt-4o'
      })
      .eq('id', programId)

    if (updateError) {
      throw new Error(`Failed to update program record: ${updateError.message}`)
    }

    console.log(`🎉 Program generation completed successfully for program ID: ${programId}`)

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

// AI Program Generation Function
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

// Call LLM API
async function callLLMAPI(prompt: string): Promise<{ program?: any; error?: string }> {
  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY environment variable')
    }

    const apiEndpoint = 'https://api.openai.com/v1/chat/completions'

    const body = {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      let errorDetails = response.statusText
      try {
        const errorData = await response.json()
        errorDetails = errorData.error?.message || JSON.stringify(errorData) || response.statusText
      } catch (e) {
        // Ignore if error response is not JSON
      }
      throw new Error(`LLM API Error: ${response.status} - ${errorDetails}`)
    }

    const data = await response.json()

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      throw new Error('Invalid response structure from LLM.')
    }

    const contentString = data.choices[0].message.content
    
    try {
      return { program: JSON.parse(contentString) }
    } catch (parseError) {
      console.error('Failed to parse LLM JSON response:', contentString)
      throw new Error('LLM returned invalid JSON.')
    }
  } catch (error: any) {
    console.error('LLM API call failed:', error)
    return {
      error: error.message || 'Failed to communicate with AI service for program generation',
    }
  }
}