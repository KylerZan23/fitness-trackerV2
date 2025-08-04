# Implementation Plan: Decouple AI Knowledge Base with a Headless CMS

**Author**: Neural - AI Assistant
**Date**: 2024-10-27
**Status**: Proposed

## 1. Overview

This document outlines the plan to decouple the AI-driven program generation knowledge base from the main codebase. Currently, all scientific guidelines and coaching content are stored as hardcoded string constants in `src/lib/llmProgramContent.ts`. This creates a maintenance bottleneck, requiring developer intervention for any content update.

By migrating this content to a headless CMS, we will empower domain experts to manage, version, and expand the knowledge base independently, leading to a more dynamic and responsive AI coaching product.

## 2. Selected Headless CMS: Sanity.io

We will use **Sanity.io** as our headless CMS provider due to its excellent developer experience, generous free tier, and powerful structured content capabilities.

## 3. Content Modeling

We will create two main document types in our Sanity Studio:

### a. `scientificGuideline`

This model will store the foundational, high-level scientific principles.

- **`title`** (String): The human-readable title (e.g., "Volume Framework Guidelines").
- **`slug`** (Slug): A unique, URL-friendly identifier for API queries (e.g., `volume-framework-guidelines`).
- **`content`** (Markdown): The full, markdown-enabled content of the scientific principle.

### b. `programGuideline`

This model will store the specific, granular guidelines for each combination of fitness goal and experience level.

- **`title`** (String): A descriptive title for the studio (e.g., "Hypertrophy - Intermediate").
- **`fitnessGoal`** (String): The exact string matching the `primaryGoal` from the onboarding flow (e.g., "Muscle Gain: Hypertrophy Focus"). This field will be indexed for efficient querying.
- **`experienceLevel`** (String): A selectable list containing "Beginner", "Intermediate", and "Advanced".
- **`content`** (Markdown): The full, markdown-enabled text of the guideline.

## 4. Migration & Refactoring Steps

### Step 1: Set up Sanity.io Project & Schema
- A new Sanity.io project will be initialized.
- The `scientificGuideline` and `programGuideline` schemas will be defined in the Sanity Studio configuration.

### Step 2: Content Migration
- All string constants from `src/lib/llmProgramContent.ts` will be migrated into their corresponding documents in the Sanity Studio. This will be a one-time manual or scripted process.

### Step 3: Create a Sanity API Client
- A new utility file, `src/lib/cms/sanityClient.ts`, will be created to house the Sanity client and API query functions.
- This client will be configured with the necessary project ID, dataset, and API tokens (stored securely in environment variables).

### Step 4: Refactor `aiProgramActions.ts`
- **Remove Direct Imports**: All imports from `src/lib/llmProgramContent.ts` will be removed.
- **Modify `getExpertGuidelines`**: This function will be refactored to be `async`. Instead of a large `if/else` block, it will perform an API call to Sanity, querying for a `programGuideline` document where `fitnessGoal` and `experienceLevel` match the function's arguments.
- **Modify `constructEnhancedLLMPrompt`**: This function will also be made `async`. It will be updated to fetch the core `scientificGuideline` documents (e.g., "Volume Framework Guidelines", "Periodization Guidelines") from Sanity using their slugs. These fetched documents will then be injected into the LLM prompt.

### Step 5: Cleanup
- Once the refactoring is complete and tested, the now-obsolete `src/lib/llmProgramContent.ts` file will be deleted.

## 5. New ADR

A new ADR (`ADR-029-headless-cms-for-ai-knowledge-base.md`) will be created to document this significant architectural decision.

## 6. Success Criteria

- The AI program generation functions successfully without any hardcoded content from the old file.
- The `aiProgramActions.ts` module fetches all required scientific content from the Sanity.io API at runtime.
- The `src/lib/llmProgramContent.ts` file is successfully removed from the codebase.
- Performance impact is minimal and within acceptable limits for a server action.
