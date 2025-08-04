// src/lib/cms/sanityClient.ts
import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!
const apiVersion = '2023-05-03' // Use a specific API version

if (!projectId || !dataset) {
  throw new Error('Missing Sanity project ID or dataset. Check your .env.local file.')
}

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // `false` if you want to ensure fresh data
})

// A function to fetch a single program guideline
export async function getProgramGuideline(fitnessGoal: string, experienceLevel: string): Promise<string | null> {
  const query = `*[_type == "programGuideline" && fitnessGoal == $fitnessGoal && experienceLevel == $experienceLevel][0]{content}`
  const params = { fitnessGoal, experienceLevel }

  try {
    const result = await sanityClient.fetch<{ content: string } | null>(query, params)
    return result?.content ?? null
  } catch (error) {
    console.error('Error fetching program guideline from Sanity:', error)
    return null
  }
}

// A function to fetch a single scientific guideline by its slug
export async function getScientificGuideline(slug: string): Promise<string | null> {
  const query = `*[_type == "scientificGuideline" && slug.current == $slug][0]{content}`
  const params = { slug }

  try {
    const result = await sanityClient.fetch<{ content: string } | null>(query, params)
    return result?.content ?? null
  } catch (error) {
    console.error(`Error fetching scientific guideline "${slug}" from Sanity:`, error)
    return null
  }
}
