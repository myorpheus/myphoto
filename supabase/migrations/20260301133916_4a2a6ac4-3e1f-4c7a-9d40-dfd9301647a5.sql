
-- Add missing columns to images table
ALTER TABLE public.images ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.images ADD COLUMN IF NOT EXISTS model_id uuid;

-- Add missing column to models table
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS astria_model_id integer;

-- Add missing columns to samples table
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS file_size integer;

-- RLS policies for images
CREATE POLICY "Users can manage own images" ON public.images
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all images" ON public.images
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- RLS policies for models
CREATE POLICY "Users can manage own models" ON public.models
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all models" ON public.models
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- RLS policies for samples
CREATE POLICY "Users can manage own samples" ON public.samples
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all samples" ON public.samples
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- RLS policies for user_credits
CREATE POLICY "Users can manage own credits" ON public.user_credits
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all credits" ON public.user_credits
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
