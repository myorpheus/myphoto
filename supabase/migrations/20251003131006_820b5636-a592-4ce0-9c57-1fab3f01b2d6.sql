-- Update default value for appsource column in profiles table
ALTER TABLE public.profiles 
ALTER COLUMN appsource SET DEFAULT 'PRu';