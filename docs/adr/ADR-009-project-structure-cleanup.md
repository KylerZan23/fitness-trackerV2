# ADR-009: Project Structure Cleanup and Consolidation

## Status
Accepted

## Date
2025-01-08

## Context

The project structure had accumulated several inconsistencies and redundancies that were affecting maintainability and developer experience:

1. **Redundant lib directories**: Both a root `lib/` directory and `src/lib/` directory existed, creating confusion about where to place library code
2. **Misplaced SQL files**: The `supabase_rpc_get_user_activity_summary.sql` file was in the project root instead of being part of the version-controlled migration history
3. **Mixed file types in scripts**: The `scripts/` directory contained both `.js` and `.ts` files, inconsistent with the project's TypeScript-first approach

These issues violated the principle of having a single, clear location for each type of code and created cognitive overhead for developers working on the project.

## Decision

We implemented a comprehensive project structure cleanup with the following changes:

### 1. Consolidated lib Directories
- **Action**: Moved contents of root `lib/` directory into `src/lib/` and deleted the root `lib/` directory
- **Rationale**: Keeps all application source code within the `src/` directory, following Next.js conventions
- **Impact**: The root `lib/db.ts` file was found to be mostly empty (just comments) and was safely removed

### 2. Organized SQL Migrations
- **Action**: Moved `supabase_rpc_get_user_activity_summary.sql` to `supabase/migrations/20250708160004_create_user_activity_summary_function.sql`
- **Rationale**: SQL functions should be part of the version-controlled migration history for proper database schema management
- **Impact**: The complex user activity summary function is now properly tracked and can be deployed consistently across environments

### 3. Standardized Scripts to TypeScript
- **Action**: Converted all `.js` files in the `scripts/` directory to `.ts` files
- **Files converted**:
  - `check-env.js` → `check-env.ts`
  - `check-redirection.js` → `check-redirection.ts`
  - `test-auth-token.js` → `test-auth-token.ts`
  - `test-auth-token-fixed.js` → `test-auth-token-fixed.ts`
  - `test-rls-policies.js` → `test-rls-policies.ts`
  - `test-token.js` → `test-token.ts`
  - Removed duplicate `create-test-user.js` (kept existing `.ts` version)
- **Technical changes**: Updated `require()` statements to `import` statements and added proper TypeScript syntax
- **Rationale**: Maintains type safety across the entire project and ensures consistent tooling

### 4. Verified Import References
- **Action**: Confirmed that all existing imports pointing to `@/lib/db/` were already correctly referencing `src/lib/db/`
- **Impact**: No import path updates were required, indicating the existing codebase was already following the correct convention

## Consequences

### Positive
- **Reduced Cognitive Load**: Developers no longer need to decide between root `lib/` and `src/lib/` directories
- **Improved Maintainability**: All SQL schema changes are now tracked in the migration system
- **Type Safety**: All scripts now benefit from TypeScript's type checking and IDE support
- **Consistency**: The entire project follows a uniform file type convention
- **Better Tooling**: TypeScript files integrate better with the project's build and development tools

### Neutral
- **Migration Required**: The SQL function will need to be applied to existing databases through the migration system
- **Script Execution**: Scripts now require `npx tsx` instead of `node` for execution (documented in file headers)

### Minimal Risk
- **No Breaking Changes**: All existing import paths continue to work as they were already pointing to the correct locations
- **Backward Compatibility**: The changes are purely organizational and don't affect runtime behavior

## Implementation Notes

- The cleanup was performed systematically with verification at each step
- All import references were checked to ensure no broken dependencies
- The legacy `lib/db.ts` file contained no actual code and was safely removed
- Script conversion maintained all functionality while adding type safety

## Future Considerations

- Consider adding a linting rule to prevent creation of files outside the `src/` directory for application code
- Establish clear guidelines for where different types of files should be placed in the project structure
- Monitor for any new inconsistencies as the project grows 