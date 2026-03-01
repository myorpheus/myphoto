

## Problem

The "Save Settings" button only saves to `localStorage`, which is browser-local and not persisted to Supabase. Settings are lost if the user switches browsers or clears storage, and there's no server-side confirmation.

## Plan

### Step 1: Create `site_settings` table via migration

```sql
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read and write
CREATE POLICY "Admins can manage site_settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Anyone can read (needed for applying branding on public pages)
CREATE POLICY "Anyone can read site_settings"
  ON public.site_settings FOR SELECT TO anon, authenticated
  USING (true);
```

### Step 2: Update `AdminOGSettings.tsx`

- **`loadSettings`**: Fetch from `supabase.from('site_settings').select().eq('key', 'og_branding').single()` instead of localStorage. Fall back to localStorage for migration.
- **`handleSave`**: Upsert to `site_settings` table with `key = 'og_branding'` and `value = settings JSON`. Show success/error toast based on Supabase response. Also keep localStorage as a cache for the global `App.tsx` branding initializer.

### Step 3: Update `App.tsx` branding initializer

- On app load, fetch `site_settings` where `key = 'og_branding'` and apply OG tags + favicon. Fall back to localStorage if fetch fails.

### Step 4: Update `project-tasks.md`

Document the Supabase persistence for OG settings.

### Files to modify
1. Database migration (new `site_settings` table)
2. `src/pages/AdminOGSettings.tsx` - load/save from Supabase
3. `src/App.tsx` - fetch branding from Supabase on load
4. `project-tasks.md`

