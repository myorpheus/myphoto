-- Update handle_new_user trigger to promote first user to super_admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Create profile
  IF NEW.raw_user_meta_data->>'app_source' = 'myphoto' THEN
    INSERT INTO public.profiles (id, appsource)
    VALUES (NEW.id, 'PRu');
  ELSE
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
  END IF;
  
  -- Assign role: first user gets super_admin, others get user
  IF user_count = 1 THEN
    -- First user is super_admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin');
  ELSE
    -- All other users are regular users
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;