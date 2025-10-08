-- Migration: Schedule automatic image cleanup with pg_cron
-- Description: Sets up pg_cron to run cleanup_expired_images() every hour
-- Created: 2025-10-07
-- Prerequisites: pg_cron extension must be enabled in Supabase project

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup function to run every hour
-- Runs at the start of every hour (e.g., 1:00, 2:00, 3:00, etc.)
SELECT cron.schedule(
  'cleanup-expired-images',  -- Job name
  '0 * * * *',               -- Cron schedule: every hour at minute 0
  $$SELECT cleanup_expired_images()$$  -- SQL command to execute
);

-- Add a comment explaining the cron job
COMMENT ON EXTENSION pg_cron IS 'Schedules cleanup_expired_images() to run every hour to remove expired images from the database.';
