-- DATABASE SCHEMA VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to check which migrations are already applied
-- Created: 2025-10-08

-- ============================================================
-- STEP 1: CHECK MIGRATION HISTORY
-- ============================================================
SELECT 'MIGRATION HISTORY' AS check_category;
SELECT version, applied_at
FROM public.schema_migrations
ORDER BY version DESC
LIMIT 20;

-- ============================================================
-- STEP 2: CHECK HEADSHOT TABLES (Migration 20251004081500)
-- ============================================================
SELECT 'HEADSHOT TABLES' AS check_category;

-- Check if tables exist
SELECT
  CASE
    WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'models')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS models_table,
  CASE
    WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'images')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS images_table,
  CASE
    WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'credits')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS credits_table,
  CASE
    WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'samples')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS samples_table;

-- Check RLS policies
SELECT
  tablename,
  policyname,
  cmd AS operation,
  CASE WHEN qual IS NOT NULL THEN 'Yes' ELSE 'No' END AS has_using,
  CASE WHEN with_check IS NOT NULL THEN 'Yes' ELSE 'No' END AS has_check
FROM pg_policies
WHERE tablename IN ('models', 'images', 'credits', 'samples')
ORDER BY tablename, policyname;

-- Check handle_new_user function
SELECT
  CASE
    WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'handle_new_user')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS handle_new_user_function;

-- Check trigger
SELECT
  CASE
    WHEN EXISTS (SELECT FROM pg_trigger WHERE tgname = 'on_auth_user_created')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS on_auth_user_created_trigger;

-- ============================================================
-- STEP 3: CHECK IMAGE EXPIRY (Migration 20251007000000)
-- ============================================================
SELECT 'IMAGE EXPIRY FEATURE' AS check_category;

-- Check if expires_at column exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'images' AND column_name = 'expires_at'
    )
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS expires_at_column;

-- Check index
SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM pg_indexes
      WHERE tablename = 'images' AND indexname = 'idx_images_expires_at'
    )
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS expires_at_index;

-- Check cleanup function
SELECT
  CASE
    WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'cleanup_expired_images')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS cleanup_expired_images_function;

-- ============================================================
-- STEP 4: CHECK IMAGE CLEANUP SCHEDULE (Migration 20251007000001)
-- ============================================================
SELECT 'IMAGE CLEANUP SCHEDULE' AS check_category;

-- Check pg_cron extension
SELECT
  CASE
    WHEN EXISTS (SELECT FROM pg_extension WHERE extname = 'pg_cron')
    THEN '✓ ENABLED'
    ELSE '✗ NOT ENABLED'
  END AS pg_cron_extension;

-- Check scheduled job
SELECT
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'cleanup-expired-images';

-- If no rows returned, job doesn't exist

-- ============================================================
-- STEP 5: CHECK CUSTOM PROMPT (Migration 20251008000000)
-- ============================================================
SELECT 'CUSTOM PROMPT FEATURE' AS check_category;

-- Check if custom_astria_prompt column exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'profiles' AND column_name = 'custom_astria_prompt'
    )
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS custom_astria_prompt_column;

-- Check column details if it exists
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'custom_astria_prompt';

-- Check constraint
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'check_custom_prompt_length';

-- Check index
SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM pg_indexes
      WHERE tablename = 'profiles' AND indexname = 'idx_profiles_custom_prompt'
    )
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS custom_prompt_index;

-- ============================================================
-- STEP 6: CHECK HAS_ROLE FUNCTION (Required by many policies)
-- ============================================================
SELECT 'ROLE MANAGEMENT' AS check_category;

SELECT
  CASE
    WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'has_role')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING - CRITICAL'
  END AS has_role_function;

-- ============================================================
-- STEP 7: SUMMARY OF MISSING COMPONENTS
-- ============================================================
SELECT 'SUMMARY' AS check_category;

-- Count missing components
WITH checks AS (
  SELECT
    1 AS check_id,
    NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'models') AS is_missing,
    'models table' AS component_name
  UNION ALL
  SELECT 2, NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'images'), 'images table'
  UNION ALL
  SELECT 3, NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'credits'), 'credits table'
  UNION ALL
  SELECT 4, NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'samples'), 'samples table'
  UNION ALL
  SELECT 5, NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'expires_at'), 'expires_at column'
  UNION ALL
  SELECT 6, NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'cleanup_expired_images'), 'cleanup_expired_images function'
  UNION ALL
  SELECT 7, NOT EXISTS (SELECT FROM cron.job WHERE jobname = 'cleanup-expired-images'), 'cleanup cron job'
  UNION ALL
  SELECT 8, NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'custom_astria_prompt'), 'custom_astria_prompt column'
  UNION ALL
  SELECT 9, NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'has_role'), 'has_role function (CRITICAL)'
  UNION ALL
  SELECT 10, NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'handle_new_user'), 'handle_new_user function'
)
SELECT
  COUNT(*) FILTER (WHERE is_missing) AS missing_components_count,
  string_agg(component_name, ', ') FILTER (WHERE is_missing) AS missing_components
FROM checks;

-- ============================================================
-- INSTRUCTIONS
-- ============================================================
-- After running this script:
-- 1. Review the output for any "✗ MISSING" components
-- 2. If components are missing, apply the corresponding migrations
-- 3. If components exist, mark those migrations as applied in schema_migrations table
-- 4. Prioritize fixing CRITICAL missing components first (has_role function)
