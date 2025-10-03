-- Update handle_new_user trigger to only set appsource for myphoto webapp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only set appsource to 'PRu' if the signup came from the myphoto webapp
    -- Check if the app_source metadata exists and equals 'myphoto'
    IF NEW.raw_user_meta_data->>'app_source' = 'myphoto' THEN
        INSERT INTO public.profiles (id, appsource)
        VALUES (NEW.id, 'PRu');
    ELSE
        INSERT INTO public.profiles (id)
        VALUES (NEW.id);
    END IF;
    RETURN NEW;
END;
$$;