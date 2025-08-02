import { createClient } from 'npm:@supabase/supabase-js';
import { z } from 'npm:zod';
import { OpenAI } from 'npm:openai';

// Define CORS headers for preflight requests and responses.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize OpenAI client using environment variables.
const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

// --- Zod Schema for robust validation of AI output ---
const programSchema = z.object({
  // .passthrough() allows the AI to include extra fields without causing a validation error.
  trainingProgram: z.object({
    programName: z.string().optional(),
    description: z.string().optional(),
    durationWeeksTotal: z.number().optional(),
    phases: z.array(z.object({
      phaseName: z.string().optional(),
      durationWeeks: z.number().optional(),
      weeks: z.array(z.object({
        weekNumber: z.number().optional(),
        days: z.array(z.object({
          dayOfWeek: z.union([z.string(), z.number()]).optional(),
          focus: z.string().optional(),
          exercises: z.array(z.object({
            name: z.string().optional(),
            sets: z.union([z.string(), z.number()]).optional(),
            reps: z.union([z.string(), z.number()]).optional(),
            rest: z.string().optional(),
            rpe: z.union([z.string(), z.number()]).optional(),
          })).optional(),
        })).optional(),
      })).optional(),
    })).optional(),
  }).passthrough(),
});

// --- Prompt Builder ---
function buildPrompt(userProfile: any) {
  return `
    Based on the user profile below, generate a complete, detailed, and personalized training program.
    User Profile: ${JSON.stringify(userProfile, null, 2)}
    
    INSTRUCTIONS:
    1. Your entire output must be a single, valid JSON object.
    2. The root object of the JSON MUST be named "trainingProgram".
    3. The program must be structured into phases, weeks, and days.
    4. Each day must include a "focus" (e.g., "Upper Body") and an array of "exercises".
  `;
}

// --- Program Generation Logic ---
async function generateProgram(userProfile: any): Promise<any> {
  const prompt = buildPrompt(userProfile);
  let rawOutput = '';

  try {
    const llmResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    rawOutput = llmResponse.choices[0]?.message?.content ?? '';
    if (!rawOutput) {
      throw new Error('LLM returned an empty response.');
    }
    
    const parsedJson = JSON.parse(rawOutput);
    const validatedOutput = programSchema.parse(parsedJson);
    return validatedOutput.trainingProgram;

  } catch (error) {
    console.error("🔴 Program generation failed.", {
      errorMessage: error.message,
      rawOutputFromLlm: rawOutput,
    });
    throw new Error(`Program generation failed: ${error.message}`);
  }
}

// --- Supabase Edge Function Handler ---
Deno.serve(async (req) => {
  // Handle preflight requests for CORS.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let programId: string | undefined;

  try {
    // 1. Validate request and parse body.
    if (!req.headers.get("content-type")?.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Request must be JSON" }), { 
        status: 415, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const body = await req.json();
    programId = body.programId;

    if (!programId) {
      return new Response(JSON.stringify({ error: "Missing 'programId' in request body" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`Processing request for programId: ${programId}`);

    // 2. Create a Supabase client with the user's auth context.
    // This is critical for RLS to work correctly.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 3. Fetch the program record to get user data.
    const { data: programRecord, error: fetchError } = await supabase
      .from('training_programs')
      .select('user_id, onboarding_data_snapshot')
      .eq('id', programId)
      .single();

    if (fetchError || !programRecord) {
      console.error('Error fetching program record:', fetchError);
      throw new Error(`Failed to fetch program record for ID ${programId}. RLS may be preventing access.`);
    }

    // 4. Update program status to 'generating'.
    await supabase
      .from('training_programs')
      .update({ generation_status: 'generating' })
      .eq('id', programId);

    // 5. Generate the program using the onboarding data snapshot.
    const userProfile = programRecord.onboarding_data_snapshot;
    const program = await generateProgram(userProfile);

    // 6. Update the program record with the generated details and 'completed' status.
    const { error: updateError } = await supabase
      .from('training_programs')
      .update({
        program_details: program,
        generation_status: 'completed',
        generated_at: new Date().toISOString(),
      })
      .eq('id', programId);

    if (updateError) {
      console.error('Error updating program record:', updateError);
      throw new Error(`Failed to save the generated program: ${updateError.message}`);
    }
    
    console.log(`✅ Successfully generated and saved program ${programId}`);
    return new Response(JSON.stringify({ success: true, programId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Edge Function Error:", error.message);
    
    // If an error occurs, attempt to update the program status to 'failed'.
    if (programId) {
      // Use a service role client to bypass RLS for error logging, if the key is available.
      // This is a robust way to ensure we can log failures.
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const url = Deno.env.get('SUPABASE_URL');
      if (serviceRoleKey && url) {
          const serviceSupabase = createClient(url, serviceRoleKey);
          await serviceSupabase
            .from('training_programs')
            .update({
              generation_status: 'failed',
              generation_error: error.message,
            })
            .eq('id', programId);
      }
    }

    return new Response(JSON.stringify({ error: `Program Generation Failed: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
