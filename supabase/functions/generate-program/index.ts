// supabase/functions/generate-program/index.ts

import { createClient } from 'npm:@supabase/supabase-js';
import { z, ZodError } from 'npm:zod';
import { OpenAI } from 'npm:openai';

// --- CORS Headers ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- OpenAI Client ---
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

// --- Zod Schema ---
const programSchema = z.object({
  trainingProgram: z.object({
    programName: z.string().optional(), // Make optional to handle AI inconsistencies
    description: z.string().optional(),
    programLength: z.string().optional(),
    trainingFrequencyDays: z.number().optional(),
    sessions: z.array(z.object({
      week: z.number().optional(),
      dayOfWeek: z.union([z.string(), z.number()]).optional(),
      focus: z.string().optional(),
      exercises: z.array(z.object({
        name: z.string(),
        sets: z.union([z.string(), z.number()]),
        reps: z.union([z.string(), z.number()]).optional(),
        duration: z.string().optional(),
        rest: z.string(),
        rpe: z.union([z.string(), z.number()]).optional(),
      })).optional(), // Make exercises array optional to handle AI inconsistencies
    })).optional(), // Make the entire sessions array optional
  }).passthrough(), // Use passthrough to avoid errors on extra fields
});

// --- Prompt Builder ---
function buildPrompt(userProfile, isFreeTrial) {
  const programLengthInstruction = isFreeTrial
    ? `## Program Length Constraint: CRITICAL\n- This is for a FREE TRIAL USER.\n- Generate exactly ONE week of training.`
    : `## Program Length\n- Generate a full 4-week mesocycle.`;
  
  return `You are an expert strength and conditioning coach AI. Your task is to generate a complete, detailed, and personalized training program based on the user profile below.
**User Profile:**
${JSON.stringify(userProfile, null, 2)}
**Output Instructions:**
1.  **MANDATORY:** Your entire output must be a single, valid JSON object.
2.  **MANDATORY:** The root of the JSON object MUST be a key named "trainingProgram".
3.  For 'dayOfWeek', use numbers where 1=Monday, 2=Tuesday, etc.
${programLengthInstruction}`;
}

// --- Program Generation Logic ---
async function generateProgram(userProfile, isFreeTrial = false) {
  const prompt = buildPrompt(userProfile, isFreeTrial);
  let llmResponse;

  try {
    llmResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
  } catch (error) {
    console.error("--- OPENAI API CALL FAILED ---", error);
    throw new Error(`OpenAI API request failed: ${error.message}`);
  }

  // **THE FINAL FIX IS HERE: Gracefully handle an empty response from OpenAI**
  const rawOutput = llmResponse?.choices?.[0]?.message?.content;

  if (!rawOutput) {
    console.error("--- OPENAI RETURNED NO CONTENT ---", llmResponse);
    throw new Error("OpenAI returned a successful response but with no content. This may be due to a content filter.");
  }
  
  let parsedJson;
  try {
    parsedJson = JSON.parse(rawOutput);
  } catch (e) {
    throw new Error(`Failed to parse AI output as JSON. Raw output was: ${rawOutput}`);
  }
  
  const validatedOutput = programSchema.parse(parsedJson);
  return validatedOutput.trainingProgram;
}

// --- Main Edge Function Handler ---
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let programId = null;

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const payload = await req.json();
    let programRecord;

    if (payload.record) {
      programRecord = payload.record;
    } else if (payload.programId) {
      const { data, error } = await supabase.from('training_programs').select('*').eq('id', payload.programId).single();
      if (error) throw error;
      programRecord = data;
    } else {
      throw new Error("Invalid payload structure.");
    }

    programId = programRecord.id;
    
    const userProfile = programRecord.onboarding_data_snapshot;
    if (!userProfile || typeof userProfile !== 'object' || Object.keys(userProfile).length === 0) {
      throw new Error(`Onboarding data is missing or invalid for programId ${programId}.`);
    }

    await supabase.from('training_programs').update({ generation_status: 'generating' }).eq('id', programId);
    
    const program = await generateProgram(userProfile, programRecord.is_free_trial);
    
    await supabase.from('training_programs').update({
      program_details: program,
      generation_status: 'completed',
      generated_at: new Date().toISOString(),
    }).eq('id', programId);
    
    console.log(`✅ System operational. Program ${programId} generated successfully.`);
    return new Response(JSON.stringify({ success: true, programId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    let errorMessage = error.message;
    if (error instanceof ZodError) {
      errorMessage = JSON.stringify(error.issues, null, 2);
    }
    
    console.error(`🔴 Critical error for programId: ${programId}: ${errorMessage}`);
    
    if (programId) {
      const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await supabaseAdmin.from('training_programs').update({
        generation_status: 'failed',
        generation_error: errorMessage,
      }).eq('id', programId);
    }
    
    return new Response(JSON.stringify({ error: `Program Generation Failed: ${errorMessage}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
