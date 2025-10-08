-- ============================================
-- IMMEDIATE FIX: Add custom_astria_prompt Column
-- ============================================
-- This script adds the missing column to profiles table
-- Time to execute: ~5 seconds
-- ============================================

-- Add the custom_astria_prompt column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS custom_astria_prompt TEXT;

-- Add a helpful comment
COMMENT ON COLUMN public.profiles.custom_astria_prompt IS
  'User-defined custom text to append to Astria generation prompts. Allows customization like "cinematic lighting, wearing a black turtleneck, golden hour"';

-- Add length constraint (prevent API issues with overly long prompts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_custom_prompt_length'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT check_custom_prompt_length
      CHECK (length(custom_astria_prompt) <= 500);
  END IF;
END $$;

-- Verify the column was added successfully
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'custom_astria_prompt';

-- Show a success message
DO $$
BEGIN
  RAISE NOTICE '✅ SUCCESS! The custom_astria_prompt column has been added to the profiles table.';
  RAISE NOTICE 'Column details: TEXT type, max 500 characters, nullable';
  RAISE NOTICE 'You can now use custom prompts in your headshot generation!';
END $$;
