# ADR 008: Fix Program Generator Service Initialization Bug

## Status

Accepted

## Context

A bug was discovered in the `ProgramGenerator` service where program generation requests were failing with the error `TypeError: Cannot read properties of undefined (reading 'generateProgram')`. This error occurred because the `ProgramGenerator` class constructor had a parameter named `neuralAPI` that shadowed the imported `neuralAPI` singleton from `./neuralAPI`. When the `programGenerator` singleton was instantiated without arguments, `this.neuralAPI` was assigned `undefined`, leading to the failure.

## Decision

The constructor parameter in `src/services/programGenerator.ts` was renamed from `neuralAPI` to `api` to avoid the name collision. This ensures that `this.neuralAPI` is correctly assigned the imported `neuralAPI` singleton instance, resolving the bug.

## Consequences

- **Positive**: The program generation functionality is now restored.
- **Negative**: None.
- **Neutral**: This change highlights the importance of careful naming in constructors to avoid shadowing imported modules.

