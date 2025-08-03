// PATH: app/actions/training-programs/generate-training-program/action.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { z } from "zod";
import { schema } from "./schema";
import { finalizeOnboardingAndGenerateProgram } from "./utils";

/**
 * This server action initiates the training program generation process.
 *
 * It has ONLY TWO responsibilities:
 * 1. Authenticate the user.
 * 2. Call `finalizeOnboardingAndGenerateProgram` to create the initial database
 * record for the training program with a 'pending' status.
 *
 * It DOES NOT directly invoke the Edge Function. That responsibility is now
 * handled by a database trigger on the `training_programs` table, which fires
 * when a new row is inserted with the 'pending' status. This decouples the
 * user-facing request from the long-running background task.
 */
export const generateTrainingProgramAction = async (
  input: z.infer<typeof schema>,
): Promise<{
  error?: string;
  data?: {
    programId: string;
  };
}> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  // This utility function creates the 'training_programs' record in the database
  // with a `generation_status` of `pending`.
  const { data: program, error } = await finalizeOnboardingAndGenerateProgram(
    input,
    user.id,
  );

  if (error || !program) {
    return {
      error:
        error ?? "An unexpected error occurred during onboarding finalization.",
    };
  }

  // The direct function invocation is intentionally removed.
  // We simply return the ID of the program we just created. The frontend
  // will use this ID to poll for the final result.
  return {
    data: {
      programId: program.id,
    },
  };
}; 