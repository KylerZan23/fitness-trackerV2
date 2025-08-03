import { createClient } from "@/utils/supabase/server";
import { OnboardingData } from "@/lib/types/onboarding";

/**
 * Utility function to finalize onboarding and create a training program record.
 * 
 * This function ONLY creates the database record with 'pending' status.
 * The actual program generation is handled by a database trigger.
 */
export async function finalizeOnboardingAndGenerateProgram(
  input: { onboardingData: OnboardingData },
  userId: string
): Promise<{
  data?: { id: string };
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // Create the program entry with 'pending' status and get its ID
    const { data: newProgram, error: programError } = await supabase
      .from("training_programs")
      .insert({
        user_id: userId,
        generation_status: "pending",
        onboarding_data_snapshot: input.onboardingData,
        program_details: {}, // Empty placeholder, will be filled by background process
      })
      .select("id")
      .single();

    if (programError || !newProgram) {
      console.error("Failed to create pending program entry:", programError);
      return { error: "Failed to initialize program." };
    }

    console.log(`✅ Created new program record with ID: ${newProgram.id} for user ${userId}`);

    // Return the program ID - the Edge Function invocation is handled by database trigger
    return { 
      data: { id: newProgram.id }
    };
  } catch (error: any) {
    console.error("Error in finalizeOnboardingAndGenerateProgram:", error);
    return { error: "An unexpected error occurred while creating the program record." };
  }
}

// PROMPT 1: Specifically for the FREE TRIAL
const getTrialPrompt = (onboardingData: OnboardingData): string => {
  return `
    You are an expert personal trainer creating a **one-week trial program**.
    Your single goal is to generate **exactly one (1) normal week of training** perfectly tailored to the user's onboarding data.
    This week should showcase your expertise and encourage the user to upgrade to a full, multi-week program.
    Do not mention periodization, MEV, MAV, or MRV. Just create a solid, effective, and complete training week.
    Ensure every required field for a single week is present and correctly formatted.

    User Data:
    ${JSON.stringify(onboardingData, null, 2)}
  `;
};

// PROMPT 2: Specifically for PREMIUM users
const getPremiumPrompt = (onboardingData: OnboardingData): string => {
  return `
    You are a world-class exercise scientist and strength coach.
    Your task is to generate a complete, multi-week, periodized training program based on scientific principles like MEV, MAV, and MRV.
    The program must be comprehensive, including distinct phases (e.g., accumulation, intensification) and a clear progression strategy.

    User Data:
    ${JSON.stringify(onboardingData, null, 2)}
  `;
};

// The main pipeline now has a clear fork.
export const runProgramGenerationPipeline = async (programId: string): Promise<void> => {
  const supabase = createClient();
  
  try {
    // Fetch the program and associated profile data
    const { data: program, error: programError } = await supabase
      .from("training_programs")
      .select(`
        *,
        profiles!inner(
          id,
          subscription_tier,
          primary_training_focus,
          experience_level
        )
      `)
      .eq("id", programId)
      .single();

    if (programError || !program) {
      console.error("Failed to fetch program:", programError);
      throw new Error("Program not found");
    }

    const isFreeTrial = program.profiles.subscription_tier === 'free';

    let prompt: string;
    if (isFreeTrial) {
      prompt = getTrialPrompt(program.onboarding_data_snapshot);
      console.log(`🎯 Using FREE TRIAL prompt for program ${programId}`);
    } else {
      prompt = getPremiumPrompt(program.onboarding_data_snapshot);
      console.log(`💎 Using PREMIUM prompt for program ${programId}`);
    }

    // TODO: Implement the rest of the pipeline (calling the LLM, parsing, validating)
    // This would include:
    // 1. Call the LLM with the appropriate prompt
    // 2. Parse and validate the response
    // 3. Update the program_details in the database
    // 4. Set generation_status to 'completed' or 'failed'
    
    console.log(`🚀 Program generation pipeline started for ${isFreeTrial ? 'FREE TRIAL' : 'PREMIUM'} user`);
    
  } catch (error: any) {
    console.error("Error in runProgramGenerationPipeline:", error);
    
    // Update program status to failed
    await supabase
      .from("training_programs")
      .update({ 
        generation_status: "failed",
        generation_error: `Pipeline error: ${error.message}`
      })
      .eq("id", programId);
      
    throw error;
  }
}; 