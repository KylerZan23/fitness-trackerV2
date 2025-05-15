'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
// import Link from 'next/link' // No longer used? Keep if needed for other links later
// import { z } from 'zod' // Zod schemas imported but not used directly in component
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logWorkout, logWorkoutGroup, getUserProfile } from '@/lib/db'
import { workoutSchema, workoutGroupSchema } from '@/lib/schemas'
// import { MuscleGroup, getAllMuscleGroups, getExercisesByMuscleGroup } from '@/lib/types' // No longer used
// import { MuscleGroupSelector } from '@/components/workout/MuscleGroupSelector' // REMOVED
// import { ExerciseSelector } from '@/components/workout/ExerciseSelector' // REMOVED
// import { createBrowserClient } from '@supabase/ssr' // Already using supabase client from @/lib/supabase

// Import new UI Components
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea' // Correctly import the new component

// TODO: Create Textarea component in src/components/ui/textarea.tsx if it doesn't exist
// Example:
// import * as React from "react"
// import { cn } from "@/lib/utils"
// const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
//   ({ className, ...props }, ref) => {
//     return (
//       <textarea
//         className={cn(
//           "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
//           className
//         )}
//         ref={ref}
//         {...props}
//       />
//     )
//   }
// )
// Textarea.displayName = "Textarea"
// export { Textarea }


// Interfaces remain largely the same, but exerciseName is now direct input
interface WorkoutFormData {
  exerciseName: string
  sets: number
  reps: number
  weight: number
  duration: number
  notes: string
  workoutDate: string
}

interface WorkoutExercise {
  exerciseName: string
  sets: number
  reps: number
  weight: number
}

interface WorkoutGroupFormData {
  name: string
  exercises: WorkoutExercise[]
  duration: number
  notes: string
  workoutDate: string
}

export default function NewWorkoutPage() {
  const router = useRouter()

  const getTodayDateString = () => {
    const today = new Date()
    return today.toISOString().split('T')[0] // Use ISO string for consistency
  }

  // State variables
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailedError, setDetailedError] = useState<any>(null) // Keep for detailed debugging if needed
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getUserProfile>> | null>(null)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [groupMode, setGroupMode] = useState(true) // Default to group mode
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [currentExercise, setCurrentExercise] = useState<WorkoutExercise>({
    exerciseName: '', // Now direct input
    sets: 3,
    reps: 10,
    weight: 0
  })
  // Single workout form data (less used if default is group)
  const [formData, setFormData] = useState<WorkoutFormData>({
    exerciseName: '',
    sets: 3,
    reps: 10,
    weight: 0,
    duration: 30,
    notes: '',
    workoutDate: getTodayDateString()
  })
  // Group workout form data
  const [groupFormData, setGroupFormData] = useState<WorkoutGroupFormData>({
    name: '',
    exercises: [],
    duration: 30,
    notes: '',
    workoutDate: getTodayDateString()
  })
  const [successMessage, setSuccessMessage] = useState<string | null>(null) // Keep for potential success indicators

  // Updated useEffect to fetch full profile for Sidebar
  useEffect(() => {
    async function fetchProfileAndAuth() {
      setIsSubmitting(true); // Use isSubmitting to indicate loading state
      try {
        // Use getUserProfile which handles session checking internally now
        const userProfile = await getUserProfile();
        if (userProfile) {
          setProfile(userProfile);
          setWeightUnit(userProfile.weight_unit ?? 'kg');
          console.log("User profile fetched:", userProfile);
        } else {
          console.warn('No active session or profile found. Redirecting to login.');
          setProfile(null); // Explicitly set to null if no profile found
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user data.');
        setProfile(null); // Ensure profile is null on error
      } finally {
        setIsSubmitting(false);
      }
    }
    fetchProfileAndAuth();
  }, [router]); // Add router dependency

  // Combined handleChange for both modes and Input/Textarea
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = (type === 'number' || name === 'sets' || name === 'reps' || name === 'weight' || name === 'duration' || name === 'group.duration')
      ? parseInt(value) || 0
      : value;

    if (groupMode) {
      if (name.startsWith('group.')) {
        const groupField = name.split('.')[1];
        setGroupFormData(prev => ({ ...prev, [groupField]: parsedValue }));
      } else {
        // Handle fields for the current exercise being added
        setCurrentExercise(prev => ({ ...prev, [name]: parsedValue }));
      }
    } else {
      // Handle fields for single workout mode
      setFormData(prev => ({ ...prev, [name]: parsedValue }));
    }
  };

  // handleSelectExercise is REMOVED as ExerciseSelector is removed. Name is typed directly.

  const handleAddExercise = () => {
    // Validate current exercise (ensure name is not empty)
    if (!currentExercise.exerciseName.trim()) {
      toast.error('Please enter an exercise name');
      return;
    }
    if (currentExercise.sets <= 0 || currentExercise.reps <= 0) {
       toast.error('Sets and Reps must be greater than zero.');
       return;
    }

    const newExercise = { ...currentExercise };
    setExercises(prev => [...prev, newExercise]);
    // Update groupFormData immediately (was missing before)
     setGroupFormData(prev => ({
       ...prev,
       exercises: [...prev.exercises, newExercise]
     }));

    // Reset for next exercise
    setCurrentExercise({
      exerciseName: '',
      sets: 3,
      reps: 10,
      weight: 0
    });

    toast.success(`Added ${newExercise.exerciseName} to workout`);
  };

  const handleRemoveExercise = (index: number) => {
    const removedExerciseName = exercises[index]?.exerciseName ?? 'Exercise';
    const updatedExercises = exercises.filter((_, i) => i !== index);
    setExercises(updatedExercises);
    setGroupFormData(prev => ({
      ...prev,
      exercises: updatedExercises
    }));
    toast.info(`Removed ${removedExerciseName}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setDetailedError(null);
    setSuccessMessage(null);

    // Ensure user is logged in (profile check)
     if (!profile) {
       setError("User profile not loaded. Cannot log workout.");
       setIsSubmitting(false);
       toast.error("User profile not loaded. Please try again.");
       return;
     }

    try {
      console.log('Form submission started', groupMode ? 'Group mode' : 'Single mode');

      if (groupMode) {
        console.log('Group Form data:', groupFormData);
        if (groupFormData.exercises.length === 0) {
          throw new Error('Please add at least one exercise to your workout group');
        }
        // Ensure group name is present
         if (!groupFormData.name.trim()) {
           throw new Error('Please enter a name for your workout group');
         }

        const groupPayload = {
          name: groupFormData.name,
          exercises: groupFormData.exercises, // Use groupFormData.exercises directly
          duration: groupFormData.duration,
          notes: groupFormData.notes,
          workoutDate: groupFormData.workoutDate
        };
        console.log('Workout group payload:', groupPayload);

        const validationResult = workoutGroupSchema.safeParse(groupPayload);
        if (!validationResult.success) {
          console.error('Validation error:', validationResult.error);
          const errorMessage = validationResult.error.errors[0]?.message || 'Invalid workout group data';
          throw new Error(errorMessage);
        }

        await logWorkoutGroup(validationResult.data); // Use validated data
        toast.success('Workout group logged successfully!');
        // Reset form after successful submission
         setGroupFormData({
           name: '',
           exercises: [],
           duration: 30,
           notes: '',
           workoutDate: getTodayDateString()
         });
         setExercises([]); // Clear exercise list too


      } else {
        // Single Exercise Mode
        console.log('Single Form data:', formData);
         // Ensure exercise name is present
         if (!formData.exerciseName.trim()) {
           throw new Error('Please enter an exercise name');
         }

        const singlePayload = {
          exerciseName: formData.exerciseName,
          sets: formData.sets,
          reps: formData.reps,
          weight: formData.weight,
          duration: formData.duration,
          notes: formData.notes,
          workoutDate: formData.workoutDate,
          weight_unit: weightUnit // Add weight unit
        };
        console.log('Single workout payload:', singlePayload);

        // Validate single workout data (assuming workoutSchema includes weight_unit now)
        // If workoutSchema doesn't include weight_unit, adjust schema or payload
        const validationResult = workoutSchema.safeParse(singlePayload);
         if (!validationResult.success) {
           console.error('Validation error:', validationResult.error);
           const errorMessage = validationResult.error.errors[0]?.message || 'Invalid workout data';
           throw new Error(errorMessage);
         }

        await logWorkout(validationResult.data); // Use validated data
        toast.success('Workout logged successfully!');
        // Reset form
         setFormData({
            exerciseName: '',
            sets: 3,
            reps: 10,
            weight: 0,
            duration: 30,
            notes: '',
            workoutDate: getTodayDateString()
          });
      }

      // Optionally navigate away after success
      // router.push('/workouts'); // Example: navigate to workouts list

    } catch (err: any) {
      console.error('Error submitting workout:', err);
      const message = err.message || 'Failed to log workout. Please try again.';
      setError(message);
      setDetailedError(err); // Store detailed error object
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Logout handler to pass to Sidebar
  const handleLogout = async () => {
    setIsSubmitting(true); // Show loading state
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setProfile(null); // Clear profile state
      router.push('/login'); // Redirect to login after sign out
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
      setError('Failed to sign out.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare sidebar props conditionally based on profile loading state
  const sidebarProps = profile
   ? {
       userName: profile.name ?? profile.email?.split('@')[0] ?? 'User',
       userEmail: profile.email,
       profilePictureUrl: profile.profile_picture_url,
       onLogout: handleLogout,
     }
   : { // Provide default/empty props if profile is null
       userName: 'Loading...',
       userEmail: '',
       profilePictureUrl: null,
       onLogout: handleLogout, // Logout should still work
     };


  // Loading state before profile is loaded
  if (profile === null && !error && isSubmitting) {
    return (
       <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex justify-center items-center h-screen">
          <p className="text-gray-500">Loading user data...</p>
          {/* Consider adding a spinner component */}
        </div>
      </DashboardLayout>
    );
  }
  
   // Error state if profile loading failed
  if (profile === null && error) {
     return (
       <DashboardLayout sidebarProps={sidebarProps}>
         <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
            <h1 className="text-2xl font-semibold mb-4 text-destructive">Error Loading Page</h1>
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
            <Button variant="outline" className="ml-2" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
         </div>
      </DashboardLayout>
     )
  }


  // Main component render
  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Log New Workout</h1>

        {/* Mode Toggle */}
        <div className="mb-6 flex justify-center gap-2 p-1 bg-gray-200 rounded-lg">
           <Button
             variant={groupMode ? "default" : "ghost"}
             onClick={() => setGroupMode(true)}
             className="flex-1"
             size="sm"
           >
             Log Workout Group
           </Button>
           <Button
             variant={!groupMode ? "default" : "ghost"}
             onClick={() => setGroupMode(false)}
             className="flex-1"
             size="sm"
           >
             Log Single Exercise
           </Button>
         </div>


        <form onSubmit={handleSubmit}>
          {/* --- Shared or Conditional Fields --- */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {groupMode ? 'Workout Group Details' : 'Exercise Details'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Group Name (Group Mode Only) */}
              {groupMode && (
                <div className="md:col-span-2">
                  <Label htmlFor="group.name">Workout Name</Label>
                  <Input
                    id="group.name"
                    name="group.name"
                    type="text"
                    value={groupFormData.name}
                    onChange={handleChange}
                    placeholder="e.g., Morning Push Day"
                    required={groupMode}
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Exercise Name (Single Mode Only) */}
              {!groupMode && (
                 <div>
                   <Label htmlFor="exerciseName">Exercise Name</Label>
                   <Input
                     id="exerciseName"
                     name="exerciseName"
                     type="text"
                     value={formData.exerciseName}
                     onChange={handleChange}
                     placeholder="e.g., Bench Press"
                     required={!groupMode}
                     disabled={isSubmitting}
                     className="mt-1"
                   />
                 </div>
              )}

               {/* Sets, Reps, Weight (Single Mode Only) */}
               {!groupMode && (
                 <>
                   <div>
                     <Label htmlFor="sets">Sets</Label>
                     <Input
                       id="sets"
                       name="sets"
                       type="number"
                       value={formData.sets}
                       onChange={handleChange}
                       min="1"
                       required={!groupMode}
                       disabled={isSubmitting}
                       className="mt-1"
                     />
                   </div>
                   <div>
                     <Label htmlFor="reps">Reps</Label>
                     <Input
                       id="reps"
                       name="reps"
                       type="number"
                       value={formData.reps}
                       onChange={handleChange}
                       min="1"
                       required={!groupMode}
                       disabled={isSubmitting}
                       className="mt-1"
                     />
                   </div>
                   <div>
                     <Label htmlFor="weight">Weight ({weightUnit})</Label>
                     <Input
                       id="weight"
                       name="weight"
                       type="number"
                       value={formData.weight}
                       onChange={handleChange}
                       min="0"
                       step="any" // Allow decimals
                       required={!groupMode}
                       disabled={isSubmitting}
                       className="mt-1"
                     />
                   </div>
                 </>
               )}


              {/* Duration */}
               <div>
                <Label htmlFor={groupMode ? "group.duration" : "duration"}>Duration (minutes)</Label>
                <Input
                  id={groupMode ? "group.duration" : "duration"}
                  name={groupMode ? "group.duration" : "duration"}
                  type="number"
                  value={groupMode ? groupFormData.duration : formData.duration}
                  onChange={handleChange}
                  min="1"
                  required
                  disabled={isSubmitting}
                  className="mt-1"
                />
              </div>

              {/* Workout Date */}
              <div>
                <Label htmlFor={groupMode ? "group.workoutDate" : "workoutDate"}>Workout Date</Label>
                <Input
                  id={groupMode ? "group.workoutDate" : "workoutDate"}
                  name={groupMode ? "group.workoutDate" : "workoutDate"}
                  type="date"
                  value={groupMode ? groupFormData.workoutDate : formData.workoutDate}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="mt-1"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <Label htmlFor={groupMode ? "group.notes" : "notes"}>Notes (Optional)</Label>
                 {/* Assuming Textarea component exists or style similarly */}
                 <Textarea
                   id={groupMode ? "group.notes" : "notes"}
                   name={groupMode ? "group.notes" : "notes"}
                   value={groupMode ? groupFormData.notes : formData.notes}
                   onChange={handleChange}
                   placeholder="e.g., Felt strong today, focus on form..."
                   rows={3}
                   disabled={isSubmitting}
                   className="mt-1"
                 />
              </div>
            </div>
          </div>


          {/* --- Group Mode: Add Exercise Section --- */}
          {groupMode && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Exercise to Group</h2>
               {/* Removed MuscleGroupSelector */}
               {/* Removed ExerciseSelector */}

               {/* Direct Input Fields for Exercise */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
                 <div className="lg:col-span-2">
                   <Label htmlFor="exerciseName">Exercise Name</Label>
                   <Input
                     id="exerciseName"
                     name="exerciseName" // Matches state key
                     type="text"
                     value={currentExercise.exerciseName}
                     onChange={handleChange}
                     placeholder="e.g., Bench Press, Squat"
                     disabled={isSubmitting}
                     className="mt-1"
                   />
                 </div>
                 <div>
                   <Label htmlFor="sets">Sets</Label>
                   <Input
                     id="sets"
                     name="sets" // Matches state key
                     type="number"
                     value={currentExercise.sets}
                     onChange={handleChange}
                     min="1"
                     disabled={isSubmitting}
                     className="mt-1"
                   />
                 </div>
                 <div>
                   <Label htmlFor="reps">Reps</Label>
                   <Input
                     id="reps"
                     name="reps" // Matches state key
                     type="number"
                     value={currentExercise.reps}
                     onChange={handleChange}
                     min="1"
                     disabled={isSubmitting}
                     className="mt-1"
                   />
                 </div>
                 <div>
                   <Label htmlFor="weight">Weight ({weightUnit})</Label>
                   <Input
                     id="weight"
                     name="weight" // Matches state key
                     type="number"
                     value={currentExercise.weight}
                     onChange={handleChange}
                     min="0"
                     step="any"
                     disabled={isSubmitting}
                     className="mt-1"
                   />
                 </div>
               </div>
               <Button
                 type="button" // Important: Prevent form submission
                 onClick={handleAddExercise}
                 disabled={isSubmitting || !currentExercise.exerciseName.trim()}
                 size="sm"
               >
                 Add Exercise
               </Button>
            </div>
          )}


           {/* --- Group Mode: Exercise List --- */}
           {groupMode && exercises.length > 0 && (
             <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
               <h2 className="text-xl font-semibold text-gray-800 mb-4">Exercises in this Group</h2>
               <ul className="space-y-3">
                 {exercises.map((exercise, index) => (
                   <li key={index} className="flex justify-between items-center border-b border-gray-200 pb-2 last:border-b-0">
                     <div>
                       <p className="font-medium text-gray-900">{exercise.exerciseName}</p>
                       <p className="text-sm text-gray-600">
                         {exercise.sets} sets x {exercise.reps} reps @ {exercise.weight} {weightUnit}
                       </p>
                     </div>
                     <Button
                       type="button"
                       variant="destructive"
                       size="sm"
                       onClick={() => handleRemoveExercise(index)}
                       disabled={isSubmitting}
                     >
                       Remove
                     </Button>
                   </li>
                 ))}
               </ul>
             </div>
           )}


          {/* --- Submission Area --- */}
          <div className="mt-6">
            {error && (
              <p className="text-red-600 mb-4">Error: {error}</p>
            )}
             {/* Display detailed error for debugging if needed */}
             {/* {detailedError && process.env.NODE_ENV === 'development' && (
               <pre className="text-xs text-red-700 bg-red-50 p-2 rounded mb-4 overflow-auto">
                 {JSON.stringify(detailedError, null, 2)}
               </pre>
             )} */}

            <Button
              type="submit"
              disabled={isSubmitting || (groupMode && exercises.length === 0)}
              className="w-full md:w-auto"
            >
              {isSubmitting ? 'Logging...' : (groupMode ? 'Log Workout Group' : 'Log Single Exercise')}
            </Button>
             {/* Optionally add a cancel button */}
             <Button
               type="button"
               variant="outline"
               onClick={() => router.back()} // Go back to previous page
               className="ml-2 w-full md:w-auto mt-2 md:mt-0"
               disabled={isSubmitting}
             >
               Cancel
             </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 