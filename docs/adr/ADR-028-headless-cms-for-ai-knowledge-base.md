# ADR-028: Headless CMS for AI Knowledge Base

## Status

**Proposed** - 2024-10-27

## Context

The core scientific knowledge that powers our AI program generation is currently managed within the application's source code, specifically in `src/lib/llmProgramContent.ts`. This file contains numerous exported string constants, each representing a specific set of guidelines for different fitness goals, experience levels, or scientific principles (e.g., `MUSCLE_GAIN_BEGINNER_GUIDELINES`, `VOLUME_FRAMEWORK_GUIDELINES`).

This implementation presents several challenges:
1.  **Maintenance Bottleneck**: Any update, correction, or addition to the knowledge base requires a developer to modify the source code, go through a full PR and deployment cycle.
2.  **Lack of Domain Expert Access**: Fitness experts and content creators cannot directly manage or refine the content. This slows down the iteration cycle and prevents the people with the most domain knowledge from contributing directly.
3.  **Scalability Issues**: As we add more goals, specializations, and scientific principles, the file becomes increasingly large and unmanageable. The conditional logic required to select the correct guideline in `aiProgramActions.ts` also grows in complexity.
4.  **No Content Versioning**: The knowledge base is tied directly to the codebase version, with no independent history or rollback capability for the content itself.

## Decision

We will decouple the AI knowledge base from the monorepo by migrating all scientific and program-specific guidelines to a headless Content Management System (CMS). **Sanity.io** has been selected as the provider for this solution.

This architectural change involves:
1.  **Modeling Content in Sanity**: Creating structured content types for `scientificGuideline` and `programGuideline` to house the currently hardcoded constants.
2.  **Migrating Content**: Moving all string constant content from `llmProgramContent.ts` into new entries in the Sanity CMS.
3.  **Refactoring Service Layer**: Modifying the `aiProgramActions.ts` server action to fetch this content from the Sanity API at runtime, replacing the static imports.
4.  **Deprecating the Content File**: Deleting the `src/lib/llmProgramContent.ts` file once it is no longer in use.

## Consequences

### Positive
-   **Empowers Content Creators**: Allows non-developers (fitness experts, content team) to manage and iterate on the AI's knowledge base directly.
-   **Improved Maintainability**: Simplifies the codebase by removing large, static content files.
-   **Increased Agility**: Enables rapid content updates without requiring a full software deployment cycle.
-   **Scalability**: Provides a robust and scalable platform for managing a growing and complex knowledge base.
-   **Content Versioning**: Sanity provides a full revision history for all content, allowing for easy review and rollback of changes.

### Negative
-   **Introduces External Dependency**: The application will now depend on the Sanity.io API for a critical function. An outage or API change at Sanity could impact our service.
-   **Potential for Increased Latency**: Program generation will now include API calls to the CMS, which may introduce a small amount of latency compared to reading from a local file. This is mitigated by Sanity's fast, CDN-backed API and the fact that this is a server-side action where a minor delay is acceptable.
-   **Initial Setup Overhead**: Requires initial effort to set up the Sanity project, model the schema, and migrate the existing content.

---
*This decision moves our application towards a more scalable, maintainable, and agile architecture, aligning with modern best practices for managing dynamic content separately from application code.*
