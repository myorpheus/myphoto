-- Create schema_migrations table if it doesn't exist
-- This table tracks which migrations have been applied

CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.schema_migrations IS 'Tracks applied database migrations';

-- Grant permissions
GRANT SELECT ON public.schema_migrations TO authenticated;
GRANT ALL ON public.schema_migrations TO postgres;

-- Verify table created
SELECT 'Schema migrations table created successfully' AS status;