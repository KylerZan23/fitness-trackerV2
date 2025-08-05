import { createClient } from 'npm:@supabase/supabase-js';

// Define CORS headers for preflight requests and responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lightweight edge function to create initial training program record
// This function does NOT call AI - it just creates the database record with 'pending' status
Deno.serve(async (req) => {
  try {
    console.log("initiate-generation function invoked.");
    
    // Handle preflight requests for CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Validate request method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Create Supabase client with user's auth context
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: "Authentication required" }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`Creating initial program record for user: ${user.id}`);

    // Get isFreeTrial AND onboardingData from the request body
    const body = await req.json();
    const isFreeTrial = body.isFreeTrial || false;
    const onboardingData = body.onboardingData; // Get the onboarding data

    if (!onboardingData) {
      throw new Error("onboardingData is missing from the request body.");
    }

    // Insert a new record, NOW INCLUDING the snapshot
    const { data: programRecord, error: insertError } = await supabase
      .from('training_programs')
      .insert({
        user_id: user.id,
        generation_status: 'pending',
        is_free_trial: isFreeTrial,
        onboarding_data_snapshot: onboardingData, // Save the onboarding data
        program_details: {}, // Empty JSONB object (required field)
        is_active: true
      })
      .select('id') // Only need to select the ID
      .single();

    if (insertError) {
      console.error('Error creating program record:', insertError);
      return new Response(JSON.stringify({ error: `Failed to create program record: ${insertError.message}` }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const programId = programRecord.id;
    console.log(`✅ Successfully created program record with ID: ${programId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      programId: programId,
      status: 'pending',
      message: 'Program record created successfully. Generation can now be initiated.' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error("Critical error in initiate-generation function:", error);
    
    return new Response(JSON.stringify({ error: `Program initiation failed: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start`
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/initiate-generation' \
    --header 'Authorization: Bearer [your-supabase-jwt-token]' \
    --header 'Content-Type: application/json' \
    --data '{"onboardingData": {"goals": "strength", "experience": "beginner"}}'

*/
