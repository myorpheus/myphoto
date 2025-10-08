# Fix Database Schema & Debug TrainModelHandler Guide

**Date**: 2025-10-08
**Status**: 🔧 ACTION REQUIRED
**Priority**: CRITICAL

---

## 🐛 Two Critical Issues Identified

### Issue #1: Missing Database Column ✅ SOLUTION PROVIDED
**Error**: `column profiles.custom_astria_prompt does not exist`
**Impact**: Cannot load saved custom prompts from database

### Issue #2: TrainModelHandler Still Failing 🔍 NEEDS INVESTIGATION
**Error**: `Internal server error in trainModelHandler` (500)
**Impact**: Photo generation fails during model training phase

---

## ✅ FIX #1: Add Missing Database Column

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard/project/imzlzufdujhcbebibgpj
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run This SQL Command

Copy and paste this SQL into the editor and click **Run**:

```sql
-- Add custom_astria_prompt column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS custom_astria_prompt TEXT;

-- Add comment to describe the column's purpose
COMMENT ON COLUMN public.profiles.custom_astria_prompt IS
  'User-defined custom text to append to Astria generation prompts';

-- Add check constraint to limit prompt length
ALTER TABLE public.profiles
ADD CONSTRAINT IF NOT EXISTS check_custom_prompt_length
  CHECK (length(custom_astria_prompt) <= 500);

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'custom_astria_prompt';
```

### Step 3: Verify Success

You should see output like:
```
column_name              | data_type | character_maximum_length
------------------------|-----------|-------------------------
custom_astria_prompt     | text      | null
```

**Status**: ✅ This fix should resolve the database error immediately

---

## 🔍 FIX #2: Debug TrainModelHandler Error

The 500 error needs more investigation. Here's how to find the real cause:

### Step 1: Check Supabase Edge Function Logs

1. Go to https://supabase.com/dashboard/project/imzlzufdujhcbebibgpj
2. Click on **Edge Functions** in the left sidebar
3. Click on **generate-headshot** function
4. Click on the **Logs** tab
5. Look for the most recent execution (should be within the last few minutes)
6. Find the log entry with status 500
7. Click to expand and see the full error details

### Step 2: What to Look For in Logs

Look for these specific error patterns:

#### Pattern 1: Astria API Rejection
```
❌ Astria API error: 400 {"error": "..."}
```
**Likely causes**:
- Invalid image format
- Image too large
- Wrong API parameters
- Model name still has issues

#### Pattern 2: Image Encoding Error
```
Error: Invalid base64 string
Error: Cannot read property 'readAsDataURL'
```
**Likely causes**:
- Images not properly encoded
- Corrupted file data
- Missing image data

#### Pattern 3: Database Error
```
Error: duplicate key value violates unique constraint
Error: relation "models" does not exist
```
**Likely causes**:
- Database schema mismatch
- Missing table or column
- Duplicate model name

#### Pattern 4: Network/Timeout Error
```
Error: fetch failed
Error: timeout of 60000ms exceeded
```
**Likely causes**:
- Network connectivity issues
- Astria API is down
- Request too large

### Step 3: Copy Full Error Log

Please copy the FULL error message from the Supabase logs and provide it. It will look something like:

```
2025-10-08T15:30:45.123Z ERROR: <actual error message here>
  at trainModelHandler (file:///...)
  Stack trace: ...
```

---

## 🧪 Diagnostic Tests to Run

### Test 1: Verify Images Are Being Encoded

Add this to browser console before uploading:

```javascript
// Monitor file selection
const fileInput = document.querySelector('input[type="file"]');
if (fileInput) {
  fileInput.addEventListener('change', (e) => {
    console.log('📁 Files selected:', e.target.files.length);
    Array.from(e.target.files).forEach((file, i) => {
      console.log(`File ${i+1}:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });
    });
  });
}
```

**Expected**: Should log file details for all 4 images

### Test 2: Check Network Request Payload

1. Open browser DevTools → Network tab
2. Click "Generate Headshots"
3. Find the POST request to `/functions/v1/generate-headshot`
4. Click on it → Request tab → View payload
5. Check if `images` array contains base64 data

**Expected**: Should see array with 4 base64-encoded image strings starting with `data:image/jpeg;base64,`

### Test 3: Verify Model Name Format

In browser console after clicking generate:

```javascript
// This will be logged automatically from the code
// Look for this line in console:
📝 Model name created: headshots-1759942303804
```

**Expected**: Model name should:
- ✅ Contain only letters, numbers, spaces, hyphens
- ❌ NOT contain underscores
- ✅ Example: "headshots-1759942303804" or "headshots 1759942303804"

---

## 🎯 Common Causes & Quick Fixes

### Cause 1: Image Files Too Large

**Symptom**: 500 error, timeout, or "payload too large"
**Fix**: Resize images before upload

```javascript
// Add this image compression before upload
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const files = Array.from(selectedFiles);
const validFiles = files.filter(file => file.size < MAX_FILE_SIZE);
```

### Cause 2: Wrong Image Format

**Symptom**: 400 error from Astria API
**Fix**: Only allow JPEG/PNG

```javascript
const validFiles = files.filter(file =>
  file.type === 'image/jpeg' || file.type === 'image/png'
);
```

### Cause 3: Astria API Rate Limiting

**Symptom**: 429 error from Astria
**Fix**: Wait before retrying, check Astria dashboard for limits

### Cause 4: Invalid API Key

**Symptom**: 401 Unauthorized from Astria
**Fix**: Verify ASTRIA_API_KEY in Supabase secrets:
1. Dashboard → Settings → Edge Functions → Secrets
2. Check ASTRIA_API_KEY is set correctly

---

## 📋 Debugging Checklist

Use this checklist to systematically debug the issue:

- [ ] **Database Fix Applied**
  - [ ] Run SQL to add custom_astria_prompt column
  - [ ] Verify column exists in profiles table
  - [ ] Refresh web app and check if database error is gone

- [ ] **Check Edge Function Logs**
  - [ ] Open Supabase dashboard → Edge Functions → Logs
  - [ ] Find most recent generate-headshot execution
  - [ ] Copy full error message and stack trace
  - [ ] Identify specific error pattern (see Step 2 above)

- [ ] **Verify Image Data**
  - [ ] Run diagnostic Test 1 (file monitoring)
  - [ ] Confirm 4 images are selected
  - [ ] Check file sizes are reasonable (<5MB each)
  - [ ] Verify file types are JPEG or PNG

- [ ] **Check Network Request**
  - [ ] Run diagnostic Test 2 (network payload)
  - [ ] Verify images array has 4 entries
  - [ ] Check base64 encoding is correct
  - [ ] Verify model name format

- [ ] **Test Astria API Directly**
  - [ ] Use curl or Postman
  - [ ] Send test request with sample image
  - [ ] Verify API key works
  - [ ] Check for any API-level errors

---

## 🚨 Next Steps

### Immediate Actions:

1. **Run the SQL fix** for the database column (5 minutes)
   - This will fix Error #1 immediately

2. **Check Supabase logs** for the actual trainModelHandler error
   - Copy the full error message
   - Share it so we can identify the specific cause

3. **Run diagnostic tests** in browser console
   - Verify images are being encoded correctly
   - Check network request payload

### After Getting Log Details:

Once you provide the actual error from Supabase logs, I can:
- Identify the exact cause of the 500 error
- Provide a specific fix for trainModelHandler
- Deploy the fix to Supabase
- Test end-to-end to ensure everything works

---

## 📞 Information Needed

To fix the trainModelHandler error, please provide:

1. **Full error from Supabase Edge Function logs**
   - Dashboard → Edge Functions → generate-headshot → Logs
   - Copy the complete error message including stack trace

2. **Network request details**
   - Browser DevTools → Network → POST to generate-headshot
   - Request payload (especially the `images` array)

3. **Image file details**
   - Number of files selected
   - File sizes
   - File types

4. **Any other errors in browser console**
   - Copy any red error messages

---

## 💡 Why This Happens

### Database Column Missing
The `custom_astria_prompt` column was added in a migration file, but migrations haven't been synced to the production database yet. Running the SQL directly will fix this immediately.

### TrainModelHandler Error
Without seeing the actual Supabase logs, we can only speculate:
- Could be image encoding issues
- Could be Astria API validation failures
- Could be network/timeout issues
- Could be a bug in the edge function code

The Supabase logs will tell us exactly what's failing.

---

## ✅ Success Criteria

After applying fixes, you should see:

1. ✅ No "custom_astria_prompt does not exist" error
2. ✅ No "Internal server error in trainModelHandler"
3. ✅ Training starts successfully
4. ✅ Model status changes to "training" in database
5. ✅ After 5-10 minutes, images generate successfully

---

**Ready to Fix**: Run the SQL command above and check the Supabase logs to identify the trainModelHandler error cause.
