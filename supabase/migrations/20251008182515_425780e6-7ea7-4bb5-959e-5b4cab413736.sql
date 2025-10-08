-- Add custom_astria_prompt column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS custom_astria_prompt TEXT;

-- Add comment describing the column
COMMENT ON COLUMN public.profiles.custom_astria_prompt IS
  'User-defined custom text to append to Astria generation prompts';

-- Add length constraint to prevent overly long prompts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_custom_prompt_length'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT check_custom_prompt_length CHECK (length(custom_astria_prompt) <= 500);
  END IF;
END $$;

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'custom_astria_prompt';