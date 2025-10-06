-- =====================================================
-- MYPHOTO COMPLETE MIGRATION SCRIPT (IDEMPOTENT)
-- Modified to handle existing objects
-- =====================================================

-- 1. UPDATE PROFILES TABLE DEFAULTS
ALTER TABLE public.profiles
ALTER COLUMN appsource SET DEFAULT 'PRu';

-- 2. CREATE USER ROLES SYSTEM (if not exists)
DO $$ 
BEGIN
    -- Create enum for user roles if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'creator', 'user');
    END IF;
END $$;

-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create/Update security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_role()
$$;

-- Helper functions for super_admin and creator checks
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = 'super_admin'::app_role
    );
$$;

CREATE OR REPLACE FUNCTION public.is_creator(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = 'creator'::app_role
    );
$$;

-- 3. CREATE COMMISSION SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.commission_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_type TEXT NOT NULL,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    club_id UUID,
    commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT check_percentage CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
    CONSTRAINT check_setting_type CHECK (
        (setting_type = 'default_user_commission' AND creator_id IS NULL AND club_id IS NULL) OR
        (setting_type = 'creator_specific' AND creator_id IS NOT NULL) OR
        (setting_type = 'club_specific' AND club_id IS NOT NULL)
    )
);

ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

-- Set default user commission rate (10%)
INSERT INTO public.commission_settings (setting_type, commission_percentage)
VALUES ('default_user_commission', 10.00)
ON CONFLICT DO NOTHING;

-- 4. CREATE HEADSHOT GENERATOR TABLES
CREATE TABLE IF NOT EXISTS public.models (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    astria_model_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.images (
    id BIGSERIAL PRIMARY KEY,
    model_id BIGINT REFERENCES public.models(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    astria_image_id INTEGER,
    url TEXT NOT NULL,
    prompt TEXT,
    status TEXT NOT NULL DEFAULT 'generating',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    credits INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    model_id BIGINT REFERENCES public.models(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;

-- 5. CREATE RLS POLICIES (drop existing and recreate)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Commission settings policies
DROP POLICY IF EXISTS "Super admins can manage commission settings" ON public.commission_settings;
CREATE POLICY "Super admins can manage commission settings"
ON public.commission_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Creators can view their commission settings" ON public.commission_settings;
CREATE POLICY "Creators can view their commission settings"
ON public.commission_settings FOR SELECT TO authenticated
USING (
    creator_id = auth.uid() OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin')
);

-- Models table policies
DROP POLICY IF EXISTS "Users can view their own models" ON public.models;
CREATE POLICY "Users can view their own models"
ON public.models FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own models" ON public.models;
CREATE POLICY "Users can create their own models"
ON public.models FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own models" ON public.models;
CREATE POLICY "Users can update their own models"
ON public.models FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own models" ON public.models;
CREATE POLICY "Users can delete their own models"
ON public.models FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all models" ON public.models;
CREATE POLICY "Admins can manage all models"
ON public.models FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- Images table policies
DROP POLICY IF EXISTS "Users can view their own images" ON public.images;
CREATE POLICY "Users can view their own images"
ON public.images FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own images" ON public.images;
CREATE POLICY "Users can create their own images"
ON public.images FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own images" ON public.images;
CREATE POLICY "Users can update their own images"
ON public.images FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own images" ON public.images;
CREATE POLICY "Users can delete their own images"
ON public.images FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all images" ON public.images;
CREATE POLICY "Admins can manage all images"
ON public.images FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- Credits table policies
DROP POLICY IF EXISTS "Users can view their own credits" ON public.credits;
CREATE POLICY "Users can view their own credits"
ON public.credits FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own credits" ON public.credits;
CREATE POLICY "Users can update their own credits"
ON public.credits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all credits" ON public.credits;
CREATE POLICY "Admins can manage all credits"
ON public.credits FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- Samples table policies
DROP POLICY IF EXISTS "Users can view their own samples" ON public.samples;
CREATE POLICY "Users can view their own samples"
ON public.samples FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own samples" ON public.samples;
CREATE POLICY "Users can create their own samples"
ON public.samples FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own samples" ON public.samples;
CREATE POLICY "Users can update their own samples"
ON public.samples FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own samples" ON public.samples;
CREATE POLICY "Users can delete their own samples"
ON public.samples FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all samples" ON public.samples;
CREATE POLICY "Admins can manage all samples"
ON public.samples FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- 6. ENHANCED USER INITIALIZATION FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Create profile with appsource set to 'PRu'
  INSERT INTO public.profiles (
      id, 
      appsource,
      display_name,
      created_at,
      updated_at
  )
  VALUES (
      NEW.id,
      'PRu',
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
      NOW(),
      NOW()
  );

  -- Count existing users (before this one)
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE id != NEW.id;

  -- First TWO users get Admin role
  IF user_count < 2 THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'admin'::app_role);
  ELSE
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'user'::app_role);
  END IF;

  -- Initialize credits for the user
  INSERT INTO public.credits (user_id, credits)
  VALUES (NEW.id, 5);

  RETURN NEW;
END;
$$;

-- 7. CREATE TRIGGER FOR NEW USER INITIALIZATION
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. MIGRATE EXISTING DATA
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.credits (user_id, credits)
SELECT id, 5
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.profiles
SET appsource = 'PRu'
WHERE appsource IS NULL OR appsource = '';