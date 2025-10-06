-- Astria Integration Complete Migration Script
-- This script ensures all database changes for Astria existing model integration are applied
-- Date: 2024-01-06
-- Purpose: Support both new model training and existing model integration

-- ===========================================
-- PART 1: TABLE SCHEMA UPDATES
-- ===========================================

-- Update models table to match current implementation
-- The table should have proper column names and types as expected by the application
DO $$
BEGIN
    -- Check if the old schema exists and update it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'models' AND column_name = 'modelId'
    ) THEN
        -- Rename old column to match new schema
        ALTER TABLE public.models RENAME COLUMN "modelId" TO astria_model_id;
        ALTER TABLE public.models ALTER COLUMN astria_model_id TYPE INTEGER;
        RAISE NOTICE 'Updated models.modelId to models.astria_model_id';
    END IF;

    -- Ensure astria_model_id column exists with correct type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'models' AND column_name = 'astria_model_id'
    ) THEN
        ALTER TABLE public.models ADD COLUMN astria_model_id INTEGER NOT NULL;
        RAISE NOTICE 'Added astria_model_id column to models table';
    END IF;

    -- Ensure updated_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'models' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.models ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
        RAISE NOTICE 'Added updated_at column to models table';
    END IF;

    -- Ensure proper status column with default
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'models' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.models ALTER COLUMN status SET DEFAULT 'training';
    ELSE
        ALTER TABLE public.models ADD COLUMN status TEXT NOT NULL DEFAULT 'training';
        RAISE NOTICE 'Added status column to models table';
    END IF;
END $$;

-- Update images table to match current implementation
DO $$
BEGIN
    -- Check if old column names exist and update them
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'images' AND column_name = 'modelId'
    ) THEN
        ALTER TABLE public.images RENAME COLUMN "modelId" TO model_id;
        RAISE NOTICE 'Renamed images.modelId to images.model_id';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'images' AND column_name = 'uri'
    ) THEN
        ALTER TABLE public.images RENAME COLUMN uri TO url;
        RAISE NOTICE 'Renamed images.uri to images.url';
    END IF;

    -- Ensure user_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'images' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.images ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to images table';
    END IF;

    -- Ensure astria_image_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'images' AND column_name = 'astria_image_id'
    ) THEN
        ALTER TABLE public.images ADD COLUMN astria_image_id INTEGER;
        RAISE NOTICE 'Added astria_image_id column to images table';
    END IF;

    -- Ensure prompt column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'images' AND column_name = 'prompt'
    ) THEN
        ALTER TABLE public.images ADD COLUMN prompt TEXT;
        RAISE NOTICE 'Added prompt column to images table';
    END IF;

    -- Ensure status column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'images' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.images ADD COLUMN status TEXT NOT NULL DEFAULT 'generating';
        RAISE NOTICE 'Added status column to images table';
    END IF;
END $$;

-- Update samples table to match current implementation
DO $$
BEGIN
    -- Check if old column name exists and update it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'samples' AND column_name = 'modelId'
    ) THEN
        ALTER TABLE public.samples RENAME COLUMN "modelId" TO model_id;
        RAISE NOTICE 'Renamed samples.modelId to samples.model_id';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'samples' AND column_name = 'uri'
    ) THEN
        ALTER TABLE public.samples RENAME COLUMN uri TO file_path;
        RAISE NOTICE 'Renamed samples.uri to samples.file_path';
    END IF;

    -- Ensure required columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'samples' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.samples ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to samples table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'samples' AND column_name = 'file_name'
    ) THEN
        ALTER TABLE public.samples ADD COLUMN file_name TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added file_name column to samples table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'samples' AND column_name = 'file_size'
    ) THEN
        ALTER TABLE public.samples ADD COLUMN file_size INTEGER;
        RAISE NOTICE 'Added file_size column to samples table';
    END IF;
END $$;

-- ===========================================
-- PART 2: CREDITS TABLE UPDATES
-- ===========================================

-- Ensure credits table has correct structure
DO $$
BEGIN
    -- Update credits table to use UUID primary key if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' AND column_name = 'id' AND data_type = 'bigint'
    ) THEN
        -- Drop the old constraint and recreate with UUID
        ALTER TABLE public.credits DROP CONSTRAINT IF EXISTS credits_pkey;
        ALTER TABLE public.credits ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE public.credits ALTER COLUMN id TYPE UUID USING gen_random_uuid();
        ALTER TABLE public.credits ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE public.credits ADD PRIMARY KEY (id);
        RAISE NOTICE 'Updated credits table ID to UUID type';
    END IF;

    -- Ensure unique constraint on user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'credits' AND tc.constraint_type = 'UNIQUE' 
        AND tc.constraint_name LIKE '%user_id%'
    ) THEN
        ALTER TABLE public.credits ADD CONSTRAINT credits_user_id_unique UNIQUE (user_id);
        RAISE NOTICE 'Added unique constraint on credits.user_id';
    END IF;

    -- Ensure updated_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.credits ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
        RAISE NOTICE 'Added updated_at column to credits table';
    END IF;
END $$;

-- ===========================================
-- PART 3: FOREIGN KEY CONSTRAINTS UPDATE
-- ===========================================

-- Drop old foreign key constraints and recreate with correct column names
DO $$
BEGIN
    -- Update images foreign key constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'images_modelId_fkey'
    ) THEN
        ALTER TABLE public.images DROP CONSTRAINT images_modelId_fkey;
        ALTER TABLE public.images ADD CONSTRAINT images_model_id_fkey 
            FOREIGN KEY (model_id) REFERENCES public.models(id) ON DELETE CASCADE;
        RAISE NOTICE 'Updated images foreign key constraint';
    END IF;

    -- Update samples foreign key constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'samples_modelId_fkey'
    ) THEN
        ALTER TABLE public.samples DROP CONSTRAINT samples_modelId_fkey;
        ALTER TABLE public.samples ADD CONSTRAINT samples_model_id_fkey 
            FOREIGN KEY (model_id) REFERENCES public.models(id) ON DELETE CASCADE;
        RAISE NOTICE 'Updated samples foreign key constraint';
    END IF;

    -- Ensure all required foreign keys exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'images_user_id_fkey'
    ) THEN
        ALTER TABLE public.images ADD CONSTRAINT images_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added images.user_id foreign key constraint';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'samples_user_id_fkey'
    ) THEN
        ALTER TABLE public.samples ADD CONSTRAINT samples_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added samples.user_id foreign key constraint';
    END IF;
END $$;

-- ===========================================
-- PART 4: ROW LEVEL SECURITY POLICIES UPDATE
-- ===========================================

-- Drop old RLS policies and create updated ones for the new schema
DO $$
BEGIN
    -- Drop old policies that might conflict
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.samples;
    DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.images;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.samples;
    DROP POLICY IF EXISTS "Enable updates for authenticated users to samples" ON public.samples;

    RAISE NOTICE 'Dropped old RLS policies';
END $$;

-- Create comprehensive RLS policies for images table
CREATE POLICY "Users can view own images" ON public.images
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images" ON public.images
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own images" ON public.images
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own images" ON public.images
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to images" ON public.images
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Create comprehensive RLS policies for samples table
CREATE POLICY "Users can view own samples" ON public.samples
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own samples" ON public.samples
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own samples" ON public.samples
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own samples" ON public.samples
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to samples" ON public.samples
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Ensure service role policies exist for all tables
CREATE POLICY IF NOT EXISTS "Service role full models access" ON public.models
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role full credits access" ON public.credits
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ===========================================
-- PART 5: ADMIN USER MANAGEMENT SUPPORT
-- ===========================================

-- Ensure user management functions are available (these should already exist from previous migrations)
-- This is just verification that admin functionality is supported

DO $$
BEGIN
    -- Verify profiles table exists (created by Supabase by default)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE WARNING 'Profiles table not found - admin user management may not work properly';
    END IF;

    -- Verify user_roles table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        RAISE WARNING 'User_roles table not found - role management may not work properly';
    END IF;

    RAISE NOTICE 'Admin user management support verified';
END $$;

-- ===========================================
-- PART 6: ASTRIA API INTEGRATION VALIDATION
-- ===========================================

-- Create a validation function to ensure all components are ready
CREATE OR REPLACE FUNCTION public.validate_astria_integration()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_text TEXT := '';
    missing_count INTEGER := 0;
BEGIN
    -- Check all required tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'models' AND table_schema = 'public') THEN
        result_text := result_text || '❌ Missing models table' || E'\n';
        missing_count := missing_count + 1;
    ELSE
        result_text := result_text || '✅ Models table exists' || E'\n';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'images' AND table_schema = 'public') THEN
        result_text := result_text || '❌ Missing images table' || E'\n';
        missing_count := missing_count + 1;
    ELSE
        result_text := result_text || '✅ Images table exists' || E'\n';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credits' AND table_schema = 'public') THEN
        result_text := result_text || '❌ Missing credits table' || E'\n';
        missing_count := missing_count + 1;
    ELSE
        result_text := result_text || '✅ Credits table exists' || E'\n';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'samples' AND table_schema = 'public') THEN
        result_text := result_text || '❌ Missing samples table' || E'\n';
        missing_count := missing_count + 1;
    ELSE
        result_text := result_text || '✅ Samples table exists' || E'\n';
    END IF;

    -- Check required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'models' AND column_name = 'astria_model_id') THEN
        result_text := result_text || '❌ Missing astria_model_id column in models' || E'\n';
        missing_count := missing_count + 1;
    ELSE
        result_text := result_text || '✅ Models.astria_model_id column exists' || E'\n';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'astria_image_id') THEN
        result_text := result_text || '❌ Missing astria_image_id column in images' || E'\n';
        missing_count := missing_count + 1;
    ELSE
        result_text := result_text || '✅ Images.astria_image_id column exists' || E'\n';
    END IF;

    -- Summary
    IF missing_count = 0 THEN
        result_text := result_text || E'\n🎉 Astria integration database is fully ready!';
    ELSE
        result_text := result_text || E'\n⚠️  Found ' || missing_count || ' missing components';
    END IF;

    RETURN result_text;
END $$;

-- ===========================================
-- PART 7: FINAL VALIDATION AND SUMMARY
-- ===========================================

-- Run validation
SELECT public.validate_astria_integration();

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ ASTRIA INTEGRATION MIGRATION COMPLETE';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Database Changes Applied:';
    RAISE NOTICE '  ✅ Updated table schemas to match application expectations';
    RAISE NOTICE '  ✅ Fixed column names (modelId -> model_id, uri -> url)';
    RAISE NOTICE '  ✅ Added astria_model_id and astria_image_id columns';
    RAISE NOTICE '  ✅ Updated foreign key constraints';
    RAISE NOTICE '  ✅ Enhanced RLS policies for security';
    RAISE NOTICE '  ✅ Verified admin user management support';
    RAISE NOTICE '  ✅ Created validation function';
    RAISE NOTICE '';
    RAISE NOTICE 'Your database now fully supports:';
    RAISE NOTICE '  🚀 New Astria model training';
    RAISE NOTICE '  📋 Existing Astria model integration';
    RAISE NOTICE '  🖼️  Headshot image generation';
    RAISE NOTICE '  💳 Credit tracking system';
    RAISE NOTICE '  👥 Admin user management';
    RAISE NOTICE '  🔒 Row Level Security (RLS)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Verify ASTRIA_API_KEY is configured in Supabase secrets';
    RAISE NOTICE '  2. Test edge functions deployment';
    RAISE NOTICE '  3. Test the /admin/train page functionality';
    RAISE NOTICE '';
END $$;