# ONCA Database Migrations

## Overview

This directory contains all database migrations for ONCA. Migrations are applied sequentially to evolve the database schema over time.

## Current Migrations

### Active Migrations (Apply in Order)

1. **007_temp_uploads.sql** - Temporary uploads table for file processing
2. **008_consolidate_to_directives.sql** - Migrate master_transactions to directive tables
3. **009_ai_boundary_enforcement.sql** - AI read-only access controls

### Archived Migrations

See `/archive` directory for historical migrations that have been consolidated into the main schema.

## Migration Strategy

### For Fresh Installations

Use `schema.sql` in the parent directory - it contains the complete, consolidated schema.

### For Existing Installations

Apply migrations sequentially:
```sql
-- Run in Supabase SQL Editor
\i 007_temp_uploads.sql
\i 008_consolidate_to_directives.sql
\i 009_ai_boundary_enforcement.sql
```

## Naming Convention

Migrations follow the format: `NNN_descriptive_name.sql`

- `NNN`: Sequential number (001, 002, etc.)
- `descriptive_name`: Kebab-case description of what the migration does

## Creating New Migrations

1. Create file: `db/migrations/010_your_migration_name.sql`
2. Include both UP and DOWN sections (if possible)
3. Make migrations idempotent (use `IF NOT EXISTS`, `IF EXISTS`)
4. Test on development database first
5. Update this README

## Best Practices

- **Idempotent**: Migrations should be safe to run multiple times
- **Atomic**: Each migration should be a single logical change
- **Documented**: Include comments explaining WHY, not just WHAT
- **Tested**: Test on development before production
- **Reversible**: Include rollback instructions when possible

## Rollback

If a migration fails:

1. Check error message in Supabase logs
2. Fix the issue in the migration file
3. If data was partially migrated, manually clean up
4. Re-run the corrected migration

## Archive

The `/archive` directory contains old migrations that have been:
- Consolidated into `schema.sql`
- Superseded by newer migrations
- No longer needed for fresh installations

These are kept for historical reference only.

## Questions?

Refer to `INSTRUCTIONS.md` for the overall database architecture and design principles.
