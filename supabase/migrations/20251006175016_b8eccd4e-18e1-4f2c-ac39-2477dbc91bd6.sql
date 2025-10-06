-- Enable Train Model Feature Migration
-- This migration adds a feature flag system to control train model availability
-- and ensures all necessary components are ready for train model functionality

-- Create feature flags table for controlling application features
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id BIGSERIAL PRIMARY KEY,
  feature_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on feature_flags table
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for feature_flags - admins can manage, everyone can view
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

-- Insert the train_model feature flag and enable it
INSERT INTO public.feature_flags (feature_name, is_enabled, description)
VALUES (
  'train_model', 
  true, 
  'Enables train model functionality for admin and super_admin users'
) ON CONFLICT (feature_name) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  updated_at = NOW();

-- Insert headshot_generation feature flag (ensure it's enabled)
INSERT INTO public.feature_flags (feature_name, is_enabled, description)
VALUES (
  'headshot_generation', 
  true, 
  'Enables headshot generation functionality for all users'
) ON CONFLICT (feature_name) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  updated_at = NOW();

-- Create function to check if a feature is enabled
CREATE OR REPLACE FUNCTION public.is_feature_enabled(feature_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(is_enabled, FALSE)
    FROM public.feature_flags
    WHERE feature_flags.feature_name = $1
  );
END;
$$;

-- Create function to enable/disable features (admin only)
CREATE OR REPLACE FUNCTION public.set_feature_enabled(feature_name TEXT, enabled BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Update feature flag
  UPDATE public.feature_flags
  SET 
    is_enabled = enabled,
    updated_at = NOW()
  WHERE feature_flags.feature_name = $1;

  -- Insert if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO public.feature_flags (feature_name, is_enabled)
    VALUES ($1, enabled);
  END IF;

  RETURN enabled;
END;
$$;

-- Verify that all required tables for train model exist
DO $$
DECLARE
    table_count INTEGER := 0;
BEGIN
    -- Count required tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('models', 'images', 'credits', 'samples', 'user_roles');
    
    -- Log results
    RAISE NOTICE 'Found % required tables for train model functionality', table_count;
    
    IF table_count < 5 THEN
        RAISE WARNING 'Missing required tables. Expected: models, images, credits, samples, user_roles';
    ELSE
        RAISE NOTICE 'All required tables present. Train model database layer is ready.';
    END IF;
END $$;

-- Log success
DO $$
BEGIN
    RAISE NOTICE '✅ Train Model Feature Migration Complete';
    RAISE NOTICE '   - Feature flags table created';
    RAISE NOTICE '   - train_model feature enabled';
    RAISE NOTICE '   - Admin management functions created';
    RAISE NOTICE '   - Database verification completed';
    RAISE NOTICE '   - Train model functionality is now database-enabled';
END $$;