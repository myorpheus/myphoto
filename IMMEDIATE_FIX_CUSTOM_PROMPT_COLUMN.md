# IMMEDIATE FIX: Custom Astria Prompt Column Missing

**Date**: 2025-10-08
**Error**: `column profiles.custom_astria_prompt does not exist` (Error 42703)
**Priority**: 🔥 **CRITICAL** - This is blocking custom prompt functionality
**Time to Fix**: ⏱️ **5 minutes**

---

## 🚨 The Problem

Your web app is trying to load custom Astria prompts from the database, but the column doesn't exist yet.

**Error Details**:
```
GET /rest/v1/profiles?select=custom_astria_prompt&user_id=eq.5140acc7-51ef-4dd0-a346-eac610b18f38
Status: 400 (Bad Request)
Error: {
  code: '42703',
  message: 'column profiles.custom_astria_prompt does not exist'
}
```

---

## ✅ The Solution (5 Minutes)

### Step 1: Open Supabase SQL Editor (1 minute)

1. Go to: https://supabase.com/dashboard/project/imzlzufdujhcbebibgpj
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"** button

### Step 2: Copy and Run This SQL (2 minutes)

**Copy this entire SQL script and paste it into the SQL Editor**:

```sql
-- ============================================
-- IMMEDIATE FIX: Add custom_astria_prompt Column
-- ============================================
-- This script adds the missing column to profiles table
-- Time to execute: ~5 seconds
-- ============================================

-- Add the custom_astria_prompt column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS custom_astria_prompt TEXT;

-- Add a helpful comment
COMMENT ON COLUMN public.profiles.custom_astria_prompt IS
  'User-defined custom text to append to Astria generation prompts. Allows customization like "cinematic lighting, wearing a black turtleneck, golden hour"';

-- Add length constraint (prevent API issues with overly long prompts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_custom_prompt_length'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT check_custom_prompt_length
      CHECK (length(custom_astria_prompt) <= 500);
  END IF;
END $$;

-- Verify the column was added successfully
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'custom_astria_prompt';

-- Show a success message
DO $$
BEGIN
  RAISE NOTICE '✅ SUCCESS! The custom_astria_prompt column has been added to the profiles table.';
  RAISE NOTICE 'Column details: TEXT type, max 500 characters, nullable';
  RAISE NOTICE 'You can now use custom prompts in your headshot generation!';
END $$;
```

**Then click the "Run" button** (or press Ctrl+Enter / Cmd+Enter)

### Step 3: Verify Success (1 minute)

You should see output like:

```
column_name              | data_type | character_maximum_length | is_nullable
------------------------|-----------|--------------------------|-------------
custom_astria_prompt     | text      | null                     | YES

NOTICE: ✅ SUCCESS! The custom_astria_prompt column has been added...
```

### Step 4: Test the Fix (1 minute)

1. Refresh your web app: https://myphoto.heyphotoai.com
2. Navigate to the headshot generator page
3. The database error should be gone ✅
4. You should be able to use custom prompts now

---

## 🎯 Expected Results

**Before Fix**:
- ❌ Error 42703: column does not exist
- ❌ Cannot load saved custom prompts
- ❌ Red error in browser console
- ❌ Custom prompt feature not working

**After Fix**:
- ✅ No database errors
- ✅ Can save custom prompts to database
- ✅ Can load saved prompts
- ✅ Custom prompt feature fully functional

---

## 🔍 Why This Happened

### Root Cause
A **migration file exists** (`supabase/migrations/20251008000000_add_custom_prompt.sql`) but it **hasn't been applied** to the production database yet.

### Why Migrations Weren't Applied
- Local migrations and remote database can get out of sync
- Migrations need to be pushed manually or via deployment
- This is a common issue with database migrations

### Recurring Pattern (from project-tasks.mdc)
This is part of a **recurring pattern** in the project:
- Frontend code expects database columns that don't exist yet
- Migrations exist but aren't applied
- Similar issues fixed: 2025-10-06 (complete MYPHOTO migration)

---

## 🛡️ Prevention (For Future)

To prevent this from happening again:

### 1. Automated Migration Checks
Add a migration status check to your deployment pipeline:
```bash
# Before deploying, verify migrations are applied
supabase db pull
git diff supabase/migrations/
```

### 2. Database Schema Versioning
Track database schema versions in your code:
```typescript
// Check if required columns exist before using them
const hasCustomPromptColumn = await checkColumnExists('profiles', 'custom_astria_prompt');
if (!hasCustomPromptColumn) {
  console.warn('Database schema outdated - custom prompts disabled');
}
```

### 3. Better Error Messages
Update the frontend to show user-friendly messages:
```typescript
if (error.code === '42703') {
  toast({
    title: 'Feature Not Available',
    description: 'Custom prompts require a database update. Contact support.',
  });
}
```

---

## 📚 Related Documentation

- **Full Migration File**: `supabase/migrations/20251008000000_add_custom_prompt.sql`
- **Debugging Guide**: `FIX_DATABASE_AND_DEBUG_GUIDE.md`
- **All Fixes Today**: `WORK_SUMMARY_2025-10-08.md`
- **Project Tasks**: `project-tasks.mdc` (see Fix #3)

---

## 🆘 If This Doesn't Work

### Check These:

1. **Wrong Database?**
   - Verify you're connected to the correct Supabase project
   - Check project ID: `imzlzufdujhcbebibgpj`

2. **Permissions Issue?**
   ```sql
   -- Check your role permissions
   SELECT current_user, current_database();
   ```

3. **Column Already Exists?**
   ```sql
   -- If you get "column already exists" error, just verify:
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'profiles' AND column_name = 'custom_astria_prompt';
   ```

4. **Still Getting Errors?**
   - Copy the full error message
   - Check Supabase logs: Functions → generate-headshot → Logs
   - Share the error for further help

---

## ✅ Success Checklist

After running the SQL, verify these:

- [ ] SQL script executed without errors
- [ ] Verification query shows the column exists
- [ ] Browser console shows no more "42703" errors
- [ ] Web app loads without database errors
- [ ] Can type in custom prompt field
- [ ] Can save custom prompt (click "Save as Default")
- [ ] Saved prompt persists after page reload

---

## 📞 Next Steps

After fixing the database column:

1. **Fix #1** ✅ Database schema fixed
2. **Fix #2** ⏳ Still need to debug trainModelHandler 500 error
   - Check Supabase Edge Function logs
   - Share the error details
   - Apply specific fix

---

**Status**: Ready to fix in 5 minutes! 🚀
**Action**: Copy the SQL script above and run it in Supabase SQL Editor
