

## Analysis: Two Issues Found

### Issue 1: "Generate Photo" Button Not Working

After tracing the full flow, I identified **multiple critical problems** preventing photo generation:

**A. Database schema mismatch in the edge function (`generateImageHandler.ts`)**
- The edge function queries a table called `credits` but the actual table is `user_credits`. This causes an immediate "Insufficient credits" error on every generation attempt.
- The edge function tries to insert columns (`model_id`, `status`, `gemini_image_id`) into the `images` table, but those columns don't exist. The table only has: `id`, `user_id`, `url`, `prompt`, `created_at`.

**B. Missing RLS policies on all new tables**
- `images`, `models`, `samples`, `user_credits` all have RLS enabled but **zero policies**. This means even if images were saved, users can't read them back in the gallery.

**C. Missing columns in `images` and `models` tables**
- The `images` table needs `status` and `model_id` columns that the code expects.
- The `models` table needs `astria_model_id` column that services expect.

### Issue 2: Favicon in Admin Panel
- Add a favicon upload/URL section to the existing `AdminOGSettings.tsx` page, keeping it under 350 lines.

---

## Plan

### Step 1: Database migration to fix schema
Add missing columns to tables and create RLS policies:

- **`images` table**: Add `status text DEFAULT 'pending'` and `model_id uuid` columns
- **`models` table**: Add `astria_model_id integer` column
- **`samples` table**: Add `file_name text`, `file_path text`, `file_size integer` columns
- **RLS policies** for all four tables (`images`, `models`, `samples`, `user_credits`):
  - Users can SELECT/INSERT their own rows (`auth.uid() = user_id`)
  - Admins can SELECT all rows

### Step 2: Fix edge function table references
Update `generateImageHandler.ts`:
- Change `credits` table reference to `user_credits`
- Remove `gemini_image_id` from insert (column doesn't exist)
- Ensure `model_id` insert matches the new UUID column type

### Step 3: Fix edge function image storage
The Gemini API with `gemini-2.0-flash-exp` and `responseModalities: ["image"]` may not return actual images (it's a text model). The generated base64 data URLs are stored directly in the DB `url` field, which works but images may not actually generate. The edge function should store the image URL properly and mark status correctly.

### Step 4: Add favicon to AdminOGSettings
- Extend the `OGSettings` interface to include `favicon` field
- Add a favicon upload/URL section below the existing OG fields
- Apply the favicon dynamically to `<link rel="icon">` on save
- Keep the component under 350 lines

### Step 5: Update project-tasks.md
Document all changes made.

### Files to modify:
1. `supabase/functions/generate-headshot/generateImageHandler.ts` - Fix table name and column references
2. `src/pages/AdminOGSettings.tsx` - Add favicon section
3. `project-tasks.md` - Document changes
4. Database migration (via tool) - Add columns and RLS policies

