-- Migration: Add custom Astria prompt column to profiles table
-- Description: Allows users to save custom prompt text for headshot generation
-- Created: 2025-10-08

-- Add custom_astria_prompt column to profiles table
ALTER TABLE public.profiles
ADD COLUMN custom_astria_prompt TEXT;

-- Add comment to describe the column's purpose
COMMENT ON COLUMN public.profiles.custom_astria_prompt IS
  'User-defined custom text to append to Astria generation prompts. Allows users to add custom requirements like lighting, clothing, or specific styles.';

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_custom_prompt ON public.profiles(user_id)
  WHERE custom_astria_prompt IS NOT NULL;

-- Add check constraint to limit prompt length (optional but recommended)
ALTER TABLE public.profiles
ADD CONSTRAINT check_custom_prompt_length
  CHECK (length(custom_astria_prompt) <= 500);

COMMENT ON CONSTRAINT check_custom_prompt_length ON public.profiles IS
  'Limits custom prompt to 500 characters to prevent API issues and ensure reasonable prompt lengths';
