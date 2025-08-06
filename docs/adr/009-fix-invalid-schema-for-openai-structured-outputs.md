# ADR 009: Fix Invalid Schema for OpenAI Structured Outputs

## Status

Accepted

## Context

The program generation feature was failing with an `OpenAI Structured Output Error: 400 Invalid schema for response_format 'output_schema': schema must be a JSON Schema of 'type: "object"', got 'type: "None"'`. This error was traced to an invalid Zod schema in `src/lib/validation/enhancedProgramSchema.ts`. The `NeuralTrainingProgramSchema` used `z.date()` for the `createdAt` field, which is not supported by `zod-to-json-schema` and resulted in an empty object being sent to OpenAI.

## Decision

The `createdAt` field in `NeuralTrainingProgramSchema` was changed from `z.date()` to `z.string().datetime()`. This change ensures that a valid JSON schema is generated, allowing the `openaiService` to correctly parse the date string and resolve the error.

## Consequences

- **Positive**: The program generation feature is now functional, and the schema sent to OpenAI is valid.
- **Negative**: None.
- **Neutral**: This change reinforces the need to use `zod-to-json-schema`-compatible types when defining schemas for OpenAI's structured outputs.

