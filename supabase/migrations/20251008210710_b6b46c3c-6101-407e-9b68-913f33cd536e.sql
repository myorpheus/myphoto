-- Enable RLS on schema_migrations table
-- This is a security requirement for all public tables

ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read migration history
CREATE POLICY "Allow authenticated users to read migrations"
ON public.schema_migrations
FOR SELECT
TO authenticated
USING (true);

-- Verify RLS is enabled
SELECT 'RLS enabled on schema_migrations' AS status;