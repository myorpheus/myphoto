-- Apply remaining critical migrations that aren't covered by astria_integration_migration.sql

-- ============================================
-- 1. ADD IMAGE EXPIRY SYSTEM (from 20251007000000_add_image_expiry.sql)
-- ============================================

-- Add expires_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'images' 
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.images ADD COLUMN expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours');
    COMMENT ON COLUMN public.images.expires_at IS 'Timestamp when the image is scheduled for automatic deletion. NULL means the image is saved permanently.';
  END IF;
END $$;

-- Create index on expires_at for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_images_expires_at ON public.images(expires_at);

-- ============================================
-- 2. ADD CUSTOM PROMPT TO PROFILES (from 20251008000000_add_custom_prompt.sql)
-- ============================================

-- Add custom_astria_prompt column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'custom_astria_prompt'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN custom_astria_prompt TEXT;
    COMMENT ON COLUMN public.profiles.custom_astria_prompt IS 'User-defined custom text to append to Astria generation prompts.';
  END IF;
END $$;

-- Add constraint to limit prompt length
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'profiles' AND constraint_name = 'check_custom_prompt_length'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_custom_prompt_length CHECK (length(custom_astria_prompt) <= 500);
  END IF;
END $$;

-- ============================================
-- 3. ENABLE FEATURE FLAGS SYSTEM (from 20251006150000_enable_train_model_feature.sql)
-- ============================================

-- Create feature flags table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id BIGSERIAL PRIMARY KEY,
  feature_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on feature_flags
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Everyone can view feature flags" ON public.feature_flags;

-- Create RLS policies
CREATE POLICY "Admins can manage feature flags" ON public.feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Everyone can view feature flags" ON public.feature_flags
  FOR SELECT USING (true);

-- Insert/update feature flags
INSERT INTO public.feature_flags (feature_name, is_enabled, description)
VALUES 
  ('train_model', true, 'Enables train model functionality for admin and super_admin users'),
  ('headshot_generation', true, 'Enables headshot generation functionality for all users')
ON CONFLICT (feature_name) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  updated_at = NOW();

-- ============================================
-- 4. SCHEDULE AUTOMATIC IMAGE CLEANUP (from 20251007000001_schedule_image_cleanup.sql)
-- ============================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if it exists
SELECT cron.unschedule('cleanup-expired-images') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-images'
);

-- Schedule the cleanup function to run every hour
SELECT cron.schedule(
  'cleanup-expired-images',
  '0 * * * *',
  $$SELECT cleanup_expired_images()$$
);