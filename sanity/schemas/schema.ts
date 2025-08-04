// sanity/schemas/schema.ts

import { defineField, defineType } from 'sanity'

export const scientificGuideline = defineType({
  name: 'scientificGuideline',
  title: 'Scientific Guideline',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'markdown',
      validation: (Rule) => Rule.required(),
    }),
  ],
})

export const programGuideline = defineType({
  name: 'programGuideline',
  title: 'Program Guideline',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'A descriptive title for the studio (e.g., "Hypertrophy - Intermediate").',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'fitnessGoal',
      title: 'Fitness Goal',
      type: 'string',
      description: 'The exact string matching the primaryGoal from the onboarding flow.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'experienceLevel',
      title: 'Experience Level',
      type: 'string',
      options: {
        list: ['Beginner', 'Intermediate', 'Advanced'],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'markdown',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      goal: 'fitnessGoal',
      level: 'experienceLevel',
    },
    prepare({ title, goal, level }) {
      return {
        title: title,
        subtitle: `${goal} - ${level}`,
      }
    },
  },
})
