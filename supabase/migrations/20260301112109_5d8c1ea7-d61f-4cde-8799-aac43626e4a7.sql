
-- Fix user_roles table: user_id should be uuid to match auth.users.id
-- Drop existing table (it's empty) and recreate properly
DROP TABLE IF EXISTS public.user_roles;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own roles
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
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

-- Insert super_admin role for current user
INSERT INTO public.user_roles (user_id, role)
VALUES ('bd530216-d396-499f-b414-4f65818f29bd', 'super_admin');
