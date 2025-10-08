-- Add image expiry feature
-- Migration: 20251007000000

-- Add expires_at column to images table
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient expiry queries
CREATE INDEX IF NOT EXISTS idx_images_expires_at 
ON public.images(expires_at) 
WHERE expires_at IS NOT NULL;

-- Create function to clean up expired images
CREATE OR REPLACE FUNCTION public.cleanup_expired_images()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired images
  DELETE FROM public.images
  WHERE expires_at IS NOT NULL 
    AND expires_at <= NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.cleanup_expired_images() IS 'Deletes images that have passed their expiration date';

-- Enable pg_cron extension (only works on Supabase with cron enabled)
-- Note: This may fail if pg_cron is not available on your plan
DO $$ 
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron extension not available - scheduled cleanup will need to be run manually or via edge function';
END $$;

-- Schedule daily cleanup job (only if pg_cron is available)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove existing job if it exists
    PERFORM cron.unschedule('cleanup-expired-images');
    
    -- Schedule new job to run daily at 2 AM
    PERFORM cron.schedule(
      'cleanup-expired-images',
      '0 2 * * *',
      'SELECT public.cleanup_expired_images();'
    );
    
    RAISE NOTICE 'Scheduled daily cleanup job at 2 AM';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not schedule cron job - you may need to run cleanup manually';
END $$;