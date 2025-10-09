# Priority Checklist

## 🚨 CRITICAL P0: TrainModelHandler 500 Error - STILL FAILING (2025-10-08)

**ERROR**: "Internal server error in trainModelHandler" - 500 from generate-headshot
**STATUS**: ✅ Function deployed (v51) BUT ⚠️ Still returning 500 errors
**IMPACT**: Users cannot train models - headshot generation completely blocked
**ROOT CAUSE**: Unknown - Need to check Supabase logs and configuration
**TIME TO FIX**: 15-30 minutes (depends on root cause)

### ⚡ IMMEDIATE INVESTIGATION REQUIRED

**Most Likely Causes** (based on Gemini CLI analysis):
1. **ASTRIA_API_KEY not configured or invalid** (MOST LIKELY)
2. Database connection issues
3. Invalid request parameters
4. Astria API authentication failure

### [P0] DEBUGGING CHECKLIST - Do These IN ORDER

#### Step 1: Check Supabase Edge Function Logs (DO THIS FIRST)

**⚠️ IMPORTANT: Cannot query edge_logs with SQL**
If you get error "sql parser error: Expected: end of statement, found: edge_logs":
- This means you're trying to query logs with SQL (NOT possible)
- edge_logs is NOT a table - it's a concept/feature
- Must use Dashboard GUI or CLI commands below

**Option A: Dashboard (GUI) - RECOMMENDED**
- [ ] Open Supabase Dashboard → Functions → generate-headshot
- [ ] Click "Logs" tab (NOT SQL Editor)
- [ ] View logs in the GUI interface
- [ ] Find the most recent 500 error invocation
- [ ] Look for the actual error message (not just "Internal server error")

**Option B: CLI Commands**
```bash
# View logs in terminal
supabase functions logs generate-headshot

# Follow logs in real-time
supabase functions logs generate-headshot --follow

# Filter by time range
supabase functions logs generate-headshot --start "2025-10-08T19:00:00Z"

# Search for errors
supabase functions logs generate-headshot | grep "error"
```

**What to look for in logs:**
- [ ] "ASTRIA_API_KEY is not defined"
- [ ] "Failed to create tune" or Astria API error
- [ ] "Failed to save model to database"
- [ ] Database connection errors
- [ ] JSON parsing errors

#### Step 2: Verify Environment Variables (CRITICAL)
- [ ] Open Supabase Dashboard → Settings → Edge Functions → Secrets
- [ ] Verify `ASTRIA_API_KEY` exists and is NOT empty
- [ ] Verify key format: Should start with "sd_" (Stable Diffusion API key)
- [ ] Check for typos, extra spaces, or newline characters
- [ ] **Test the API key directly:**
  ```bash
  curl -H "Authorization: Bearer YOUR_ASTRIA_KEY" https://api.astria.ai/tunes
  ```
- [ ] If curl returns 401/403, API key is invalid
- [ ] If curl returns list of tunes, API key is valid

#### Step 3: Verify Database Tables Exist
- [ ] Run `verify-database-schemas.sql` in SQL Editor
- [ ] Confirm these tables exist:
  - [ ] `models` table with columns: id, user_id, astria_model_id, name, status
  - [ ] `credits` table with user credit data
  - [ ] `images` table for generated images
- [ ] Verify RLS policies allow INSERT on models table
- [ ] Check service role has proper permissions

#### Step 4: Check Request Parameters (Client-Side)
- [ ] Open browser DevTools → Network tab
- [ ] Click "Generate Headshots" button
- [ ] Find the POST request to `/functions/v1/generate-headshot`
- [ ] Check Request Payload contains:
  - [ ] `action: "train_model"`
  - [ ] `name`: Valid model name (letters, numbers, spaces only)
  - [ ] `images`: Array of 4-20 base64 image strings
  - [ ] Verify images are valid base64 data
- [ ] Check Response tab for detailed error message

#### Step 5: Test Astria API Integration Manually
If API key is valid but still failing:
- [ ] Copy one of the base64 image strings from request
- [ ] Test Astria API directly with curl:
  ```bash
  curl -X POST https://api.astria.ai/tunes \
    -H "Authorization: Bearer YOUR_ASTRIA_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "tune": {
        "title": "Test Model",
        "name": "test 123456",
        "callback": "https://imzlzufdujhcbebibgpj.supabase.co/functions/v1/astria-webhook"
      },
      "images": ["BASE64_IMAGE_DATA_HERE"],
      "steps": 500,
      "face_crop": true
    }'
  ```
- [ ] If this fails, note the exact error from Astria
- [ ] If this succeeds, issue is in Edge Function code

#### Step 6: Add Debug Logging (If cause still unknown)
Add these console.log statements to trainModelHandler.ts:
```typescript
// After line 24
console.log("🔍 Received params:", { name, imageCount: images.length, steps, face_crop });

// After line 35
console.log("🔍 Supabase client initialized");
console.log("🔍 ASTRIA_API_KEY exists:", !!astriaApiKey);
console.log("🔍 ASTRIA_API_KEY length:", astriaApiKey?.length);

// Before line 38 (API call)
console.log("🔍 Calling Astria API...");

// After line 67
console.log("🔍 Astria response:", astriaData);
```
- [ ] Deploy updated function: `supabase functions deploy generate-headshot`
- [ ] Test again and check logs for debug output

### Common Issues & Solutions

**Issue 1: "ASTRIA_API_KEY is not defined"**
- **Solution**: Set secret via CLI: `supabase secrets set ASTRIA_API_KEY="sd_your_key"`

**Issue 2: Astria API returns 401 Unauthorized**
- **Solution**: API key is invalid. Get new key from Astria dashboard

**Issue 3: "Failed to save model to database"**
- **Solution**: Check database table exists and RLS policies allow INSERT

**Issue 4: "only English letters, numbers and spaces allowed"**
- **Solution**: Model name contains invalid characters (underscores, etc.)

**Issue 5: "Need 4-20 images"**
- **Solution**: Upload correct number of training images

### What We've Already Done ✅
- ✅ Deployed generate-headshot function (v51)
- ✅ All 6 handler files uploaded
- ✅ Function shows as ACTIVE in dashboard
- ✅ Reviewed code for obvious issues

### What We Still Need ⚠️
- ⚠️ Verify ASTRIA_API_KEY is configured
- ⚠️ Check actual error in Supabase logs
- ⚠️ Test Astria API key validity
- ⚠️ Verify database tables exist

---

## 🚨 CRITICAL P0.2: Astria API 422 Error - Images Array Format Issue (2025-10-09)

**ERROR**: Astria API returns 422 - "images must contain at least one image"
**STATUS**: ⚠️ CODE FIXED + BUILT - ❌ NOT DEPLOYED YET
**IMPACT**: Model training completely blocked - users cannot create new models
**ROOT CAUSE**: fileToBase64 function was stripping data URL prefix, Astria API requires full data URLs
**FIX STATUS**: ✅ Code fixed, ✅ Built (index-DzN9IrE0.js), ❌ NOT deployed to production
**TIME TO FIX**: 5 minutes (deploy + test)

### 🔴 URGENT: Error Still Occurring - Deployment Needed

**Current Situation (2025-10-09T15:42:01):**
- ✅ **GEMINI CLI ANALYSIS COMPLETE**: Code fix verified as CORRECT
- ⚠️ Error logs show SAME 422 error after fix was applied
- ✅ This is EXPECTED - the fix hasn't been deployed yet!
- ✅ Built files (dist/) are ready but not uploaded to production server
- 📊 **Gemini Confirmation**: fileToBase64 now correctly returns full data URL with prefix

### ⚡ IMMEDIATE FIX REQUIRED

**Root Cause Identified**:
- The `fileToBase64` function in `src/utils/file-utils.ts` was stripping the `data:image/jpeg;base64,` prefix
- Astria API expects FULL data URLs with prefix: `["data:image/jpeg;base64,..."]`
- Code was sending only base64 strings without prefix: `["iVBORw0KGgo..."]`

**Fix Applied**:
- Modified `fileToBase64` to return complete data URL (`reader.result`)
- Updated comment to clarify Astria API format requirement

### 🤖 GEMINI CLI ANALYSIS FINDINGS (2025-10-09T15:45:00)

**Analysis Performed**:
- ✅ Reviewed astria_prompt.md - Confirmed Astria API requires full data URL prefix
- ✅ Reviewed src/utils/file-utils.ts - Confirmed code NOW returns full data URL
- ✅ Reviewed priority-checklist.md - Confirmed deployment status is NOT DEPLOYED

**Gemini Conclusions**:
1. **Is the code fix correct?** ✅ YES - fileToBase64 correctly returns full data URL with prefix
2. **Why is error still occurring?** ⚠️ Fix NOT deployed to production environment yet
3. **Next steps?** 🚀 Deploy built files (dist/) to https://myphoto.heyphotoai.com

**Gemini Verification**: The fix aligns 100% with Astria API requirements documented in astria_prompt.md section 5

### [P0.2] DEPLOYMENT CHECKLIST - Do These IN ORDER

**🤖 GEMINI CLI GENERATED - Comprehensive Deployment & Testing Guide**

#### Step 1: Pre-Deployment Verification (REQUIRED)
- [ ] **Verify Build Artifacts**:
  - [ ] Confirm correct build version: dist/assets/index-DzN9IrE0.js
  - [ ] Verify git commit hash: 8f961d1 (fix) + 84751ac (docs)
  - [ ] Check no unintended changes included in build
- [ ] **Configuration Review**:
  - [ ] Verify all environment variables for production
  - [ ] Check ASTRIA_API_KEY configured in Supabase secrets
  - [ ] Confirm API authentication mechanisms working
- [ ] **Backup Current System**:
  - [ ] Create Supabase database backup via Dashboard
  - [ ] Snapshot current deployment state
- [ ] **Monitor Baseline Metrics**:
  - [ ] Note current CPU, memory, network usage
  - [ ] Establish baseline for performance comparison

#### Step 2: Build Frontend (COMPLETED ✅)
- [x] Navigate to project root: `cd /Users/dimaglinskii/Documents/GitHub/myphoto`
- [x] Install dependencies if needed: `npm install`
- [x] Build production bundle: `npm run build`
- [x] Verify build success (no errors)
- [x] Note new build hash in `dist/assets/` directory: index-DzN9IrE0.js

#### Step 3: Deploy to Production (CRITICAL - USER ACTION REQUIRED)
- [ ] **Deployment Window**:
  - [ ] Confirm deployment timing with stakeholders
  - [ ] Announce any potential service interruptions
- [ ] **Staged Deployment (Recommended)**:
  - [ ] Deploy to staging environment first if available
  - [ ] Perform thorough testing in staging
- [ ] **Production Deployment**:
  - [ ] Deploy updated frontend to https://myphoto.heyphotoai.com
  - [ ] Use deployment strategy that minimizes downtime
  - [ ] Monitor deployment process for errors
- [ ] **Clear Caches**:
  - [ ] Clear CDN cache if applicable (wait 5 minutes or purge)
  - [ ] Verify deployment timestamp updated
- [ ] **Update Monitoring**:
  - [ ] Ensure monitoring systems track application health
  - [ ] Verify alerts configured for issues

#### Step 4: Post-Deployment Testing (CRITICAL VERIFICATION)

**4A. Basic Functionality Tests**:
- [ ] Verify core API endpoints functioning (health check, auth)
- [ ] Check browser console for JavaScript errors

**4B. 422 Error Fix Verification**:
- [ ] Open https://myphoto.heyphotoai.com in browser
- [ ] Clear browser cache (Cmd+Shift+R / Ctrl+Shift+F5)
- [ ] Navigate to headshot generator
- [ ] Upload 4-10 training photos (JPEG/PNG)
- [ ] Enter valid model name (letters, numbers, spaces only)
- [ ] Click "Start Training" or "Generate Headshots"
- [ ] **CRITICAL**: Open browser DevTools → Network tab
- [ ] Find POST request to `/functions/v1/generate-headshot`
- [ ] **SUCCESS CRITERIA**:
  - [ ] Check Request Payload → `images` array
  - [ ] **Verify**: Each image string starts with `data:image/jpeg;base64,` or `data:image/png;base64,`
  - [ ] **Verify**: Response is 200 OK (NOT 422)
  - [ ] **Verify**: Response includes tune_id or model details
  - [ ] **Verify**: Training status shows "training" or "queued"
  - [ ] **Verify**: No errors in browser console

**4C. Boundary Testing**:
- [ ] Test with <4 images → Verify 422 error with clear message
- [ ] Test with >20 images → Verify 422 error with clear message
- [ ] Test with invalid model name (special chars) → Verify rejection
- [ ] Test with very large images (>10MB) → Verify handling

**4D. Performance Testing**:
- [ ] Monitor API response times (should be <2 seconds)
- [ ] Check resource utilization (CPU, memory)
- [ ] Verify no performance regressions

#### Step 5: Monitor Edge Function Logs
- [ ] Open Supabase Dashboard → Functions → generate-headshot → Logs
- [ ] Watch for new training requests in real-time
- [ ] **SUCCESS CRITERIA**:
  - [ ] No more 422 errors from Astria API
  - [ ] Log shows "✅ Astria model created:" or similar success message
  - [ ] tune_id returned successfully in logs
  - [ ] No authentication errors (401/403)
  - [ ] No server errors (500)

#### Step 6: End-to-End Verification
- [ ] Wait for model training to complete (5-10 minutes typical)
- [ ] **SUCCESS CRITERIA**:
  - [ ] Training completes successfully (status: "trained")
  - [ ] Model appears in models list on dashboard
  - [ ] Can select trained model for image generation
  - [ ] Can generate images with trained model
  - [ ] Generated images display correctly
  - [ ] No errors in browser console during entire workflow
  - [ ] Callback webhook triggered successfully (if configured)

#### Step 7: Rollback Plan (IF NEEDED)

**Rollback Triggers**:
- Any success criteria not met
- Significant issues identified after deployment
- New errors introduced by the deployment
- Performance regressions detected

**Rollback Procedure**:
- [ ] **Initiate Rollback**:
  - [ ] Announce rollback to stakeholders
  - [ ] Document reason for rollback
- [ ] **Revert Application**:
  - [ ] Deploy previous stable build artifact
  - [ ] Revert configuration changes if any were made
  - [ ] Clear caches again
- [ ] **Restore Database** (if needed):
  - [ ] Restore from backup created in Step 1
  - [ ] Verify data integrity after restore
- [ ] **Verify Rollback Success**:
  - [ ] Test that previous functionality is restored
  - [ ] Monitor for stability
- [ ] **Post-Mortem**:
  - [ ] Investigate cause of failure
  - [ ] Document findings
  - [ ] Address issues before next deployment attempt
  - [ ] Update checklist with lessons learned

### What Was Fixed:

**File Modified**: `src/utils/file-utils.ts` (lines 14-16)

**Before (BROKEN)**:
```typescript
reader.onload = () => {
  if (typeof reader.result === 'string') {
    // Remove the data URL prefix (data:image/jpeg;base64,)
    const base64 = reader.result.split(',')[1];
    resolve(base64);
  }
};
```

**After (FIXED)**:
```typescript
reader.onload = () => {
  if (typeof reader.result === 'string') {
    // FIXED: Astria API expects full data URL with prefix (data:image/jpeg;base64,...)
    // Return the complete data URL, not just the base64 part
    resolve(reader.result);
  }
};
```

### Expected Behavior After Fix:

**Request Payload Format** (in Network tab):
```json
{
  "action": "train_model",
  "name": "My Model",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD..."
  ],
  "steps": 500,
  "face_crop": true
}
```

**Astria API Response** (200 OK):
```json
{
  "success": true,
  "model": {
    "id": 12345,
    "status": "training",
    "name": "My Model 1728401234567"
  }
}
```

### Rollback Plan (If Fix Doesn't Work):

If the fix causes new issues:
1. Revert `src/utils/file-utils.ts` to previous version
2. Rebuild: `npm run build`
3. Redeploy frontend
4. Investigate alternative solutions (check Astria API docs)

### Prevention Measures:

- [ ] Add unit tests for `fileToBase64` function
- [ ] Test with actual Astria API before deploying
- [ ] Add validation in edge function to check data URL format
- [ ] Document expected formats in code comments

### Common Issues After Deployment:

**Issue 1: Still getting 422 errors**
- **Check**: Browser cache - force refresh (Cmd+Shift+R)
- **Check**: CDN cache - wait 5 minutes or purge manually
- **Check**: Correct build deployed (check build hash)

**Issue 2: Images too large (413 error)**
- **Solution**: Add client-side image compression before upload
- **Solution**: Validate file sizes (max 10MB per image)

**Issue 3: Different error from Astria**
- **Action**: Check edge function logs for new error message
- **Action**: Verify Astria API key is valid
- **Action**: Check Astria API documentation for changes

---

## 🚨 RESOLVED: Generate-Headshot Edge Function Deployment (2025-10-08)

**ERROR**: generate-headshot Edge Function does not exist on Supabase
**STATUS**: ✅ RESOLVED - Function deployed (v51)
**DEPLOYED**: 2025-10-08 19:30:10 UTC

### Files to Deploy:
- `supabase/functions/generate-headshot/index.ts` (entry point)
- `supabase/functions/generate-headshot/trainModelHandler.ts`
- `supabase/functions/generate-headshot/generateImageHandler.ts`
- `supabase/functions/generate-headshot/statusCheckHandler.ts`
- `supabase/functions/generate-headshot/geminiPromptEnhancer.ts`
- `supabase/functions/generate-headshot/utils.ts`

### Dependencies Required:
- `@supabase/supabase-js@2.39.3`
- Deno standard library (HTTP server)

### Environment Variables Required:
- `ASTRIA_API_KEY` - Astria AI authentication
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Admin database access
- `GEMINI_API_KEY` - Google Gemini prompt enhancement (optional)

### [P0] IMMEDIATE DEPLOYMENT STEPS:

#### Prerequisites Check:
- [ ] Verify Supabase CLI installed: `supabase --version`
- [ ] Login to Supabase: `supabase login`
- [ ] Link to project: `supabase link --project-id imzlzufdujhcbebibgpj`

#### Deploy Function:
- [ ] Navigate to project root: `cd /Users/dimaglinskii/Documents/GitHub/myphoto`
- [ ] Deploy function: `supabase functions deploy generate-headshot`
- [ ] Wait for deployment confirmation message
- [ ] Note the deployed version number

#### Set Environment Variables:
- [ ] Set ASTRIA_API_KEY: `supabase secrets set ASTRIA_API_KEY="your_key"`
- [ ] Set GEMINI_API_KEY: `supabase secrets set GEMINI_API_KEY="your_key"`
- [ ] Verify secrets: `supabase secrets list`

#### Verify Deployment:
- [ ] Open Supabase Dashboard → Functions
- [ ] Confirm `generate-headshot` appears in list
- [ ] Check status shows "Ready" (not "Failed")
- [ ] Click function → View logs
- [ ] Test with curl or web app

#### Test Complete Workflow:
- [ ] Open web app: https://myphoto.heyphotoai.com
- [ ] Upload 4-10 training photos
- [ ] Click "Generate Headshots"
- [ ] Verify no 500 errors
- [ ] Confirm images generate successfully

### Post-Deployment Verification:

**Database Permissions:**
- [ ] Verify service role can INSERT into `models` table
- [ ] Verify service role can SELECT/UPDATE `credits` table
- [ ] Verify service role can INSERT into `images` table

**Webhook Configuration:**
- [ ] Verify `astria-webhook` Edge Function exists
- [ ] Test webhook URL: `${supabaseUrl}/functions/v1/astria-webhook`
- [ ] Check webhook logs for incoming events

**CORS & Security:**
- [ ] Review CORS headers in utils.ts (currently allows all origins)
- [ ] Consider restricting to production domain only
- [ ] Verify API keys not exposed in client code

### Quick Deploy Commands (Copy-Paste):
```bash
# Navigate to project
cd /Users/dimaglinskii/Documents/GitHub/myphoto

# Deploy function
supabase functions deploy generate-headshot

# Set secrets (replace with actual keys)
supabase secrets set ASTRIA_API_KEY="sd_your_actual_key_here"
supabase secrets set GEMINI_API_KEY="your_gemini_key_here"

# Verify deployment
supabase functions list
supabase secrets list
```

### Why This Happened:
- Function code was created locally but never deployed
- No deployment verification in git workflow
- This is the root cause of all 500 errors seen today

---

## 🚨 CRITICAL P0: SQL Migrations NOT APPLIED (2025-10-08)

**ERROR**: 17 local SQL migrations never applied to remote Supabase database
**ROOT CAUSE**: Migration history diverged - migrations created locally but applied via dashboard with different timestamps
**IMPACT**: Missing database tables, columns, functions, RLS policies, and scheduled jobs
**TIME TO FIX**: 30-60 minutes (careful manual application required)
**STATUS**: ⚠️ IMMEDIATE DATABASE SYNC REQUIRED

### Critical Migrations NOT Applied:

**CRITICAL MISSING SCHEMAS**:
1. `20251004081500_create_headshot_tables.sql` - Core headshot functionality tables
2. `20251007000000_add_image_expiry.sql` - Image expiration feature
3. `20251007000001_schedule_image_cleanup.sql` - Automated cleanup (pg_cron job)
4. `20251008000000_add_custom_prompt.sql` - Custom prompt column
5. `20251006141946_promote_all_users_to_super_admin.sql` - Admin permissions
6. `20251006150000_enable_train_model_feature.sql` - Model training feature

**17 Total Local Migrations Not Applied**:
- 20231010160942_remote_schema.sql
- 20251003131006, 20251003131257, 20251003134416, 20251003134725
- 20251004081500 ⚠️ CRITICAL
- 20251006092016, 20251006112438
- 20251006141946 ⚠️ CRITICAL
- 20251006150000 ⚠️ CRITICAL
- 20251006175016, 20251006213549
- 20251007000000 ⚠️ CRITICAL
- 20251007000001 ⚠️ CRITICAL
- 20251008000000 ⚠️ CRITICAL
- 20251008130000 (duplicate?)
- 20251008182515 (applied via dashboard)

### ⚡ QUICK START: Run Verification Script First

**BEFORE applying any migrations, run this verification script:**

- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Copy contents of `verify-database-schemas.sql`
- [ ] Paste and execute in SQL Editor
- [ ] Review output to see what's MISSING vs what EXISTS
- [ ] This will show you exactly which migrations to apply

### [P0] PHASE 1: Analysis and Reconciliation

#### Task 1.1: Run Comprehensive Schema Verification (P0)
- [ ] Open `verify-database-schemas.sql` in your editor
- [ ] Copy the entire SQL script
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Paste and execute the verification script
- [ ] Review the output categories:
  - Migration History
  - Headshot Tables (models, images, credits, samples)
  - Image Expiry Feature
  - Image Cleanup Schedule
  - Custom Prompt Feature
  - Role Management (has_role function)
  - Summary of missing components
- [ ] Note down all components marked "✗ MISSING"
- [ ] Pay special attention to CRITICAL missing components

#### Task 1.2: Inventory Remote Migrations (P0)
- [ ] Check the Migration History section from verification script
- [ ] Compare version numbers with local migration files
- [ ] Identify which migrations are truly not applied

#### Task 1.2: Compare Local and Remote (P0)
- [ ] Use diff tool to identify truly missing migrations
- [ ] Create `missing_migrations.txt` list
- [ ] Create `potential_duplicates.txt` list (different timestamps, same functionality)
- [ ] Focus on CRITICAL migrations first

#### Task 1.3: Investigate Potential Duplicates (P0)
- [ ] Review SQL code of each potential duplicate
- [ ] Check if functionality already exists with different timestamp
- [ ] Example: `20251008130000_add_custom_prompt_column.sql` vs `20251008000000_add_custom_prompt.sql`
- [ ] Document findings: "Migration X implemented as Migration Y"

### [P0] PHASE 2: Migration Application

#### Task 2.1: Backup Remote Database (P0) - CRITICAL
- [ ] **MUST DO FIRST**: Create full database backup via Supabase Dashboard
- [ ] Navigate to: Settings → Database → Backups → Create Backup
- [ ] Wait for backup completion confirmation
- [ ] **DO NOT PROCEED without backup**

#### Task 2.2: Apply Critical Migrations First (P0)
Apply in this exact order via Supabase Dashboard SQL Editor:

- [ ] **1. create_headshot_tables.sql**
  - [ ] Open file: `supabase/migrations/20251004081500_create_headshot_tables.sql`
  - [ ] Copy SQL content
  - [ ] Paste into Supabase SQL Editor
  - [ ] Execute
  - [ ] Verify: Check tables exist (models, images, samples, credits)
  - [ ] Record migration:
    ```sql
    INSERT INTO public.schema_migrations (version) VALUES ('20251004081500');
    ```

- [ ] **2. add_image_expiry.sql**
  - [ ] Open file: `supabase/migrations/20251007000000_add_image_expiry.sql`
  - [ ] Copy SQL content
  - [ ] Execute in SQL Editor
  - [ ] Verify: Check `images.expires_at` column exists
  - [ ] Record migration:
    ```sql
    INSERT INTO public.schema_migrations (version) VALUES ('20251007000000');
    ```

- [ ] **3. schedule_image_cleanup.sql**
  - [ ] Open file: `supabase/migrations/20251007000001_schedule_image_cleanup.sql`
  - [ ] Execute in SQL Editor
  - [ ] Verify: Check pg_cron job exists
    ```sql
    SELECT * FROM cron.job WHERE jobname = 'cleanup-expired-images';
    ```
  - [ ] Record migration

- [ ] **4. add_custom_prompt.sql**
  - [ ] Open file: `supabase/migrations/20251008000000_add_custom_prompt.sql`
  - [ ] Execute in SQL Editor
  - [ ] Verify: Check `profiles.custom_astria_prompt` column exists
  - [ ] Record migration

- [ ] **5. promote_all_users_to_super_admin.sql**
  - [ ] Open file and review carefully
  - [ ] Execute in SQL Editor
  - [ ] Verify: Check user roles updated

- [ ] **6. enable_train_model_feature.sql**
  - [ ] Open file and review carefully
  - [ ] Execute in SQL Editor
  - [ ] Verify: Check feature enabled

#### Task 2.3: Apply Remaining Migrations (P1)
- [ ] Apply remaining non-critical migrations in timestamp order
- [ ] Use same process: Open → Copy → Execute → Verify → Record
- [ ] Check logs after each migration

### [P0/P1] PHASE 3: Verification

#### Task 3.1: Verify Migration Application (P0)
After EACH migration:
- [ ] Check migration recorded:
  ```sql
  SELECT version FROM public.schema_migrations WHERE version = 'YOUR_TIMESTAMP';
  ```
- [ ] Check Supabase Dashboard logs for errors
- [ ] If errors: STOP, restore from backup, fix script, retry

#### Task 3.2: Verify Critical Schema Changes (P0)
- [ ] **Headshot Tables**: Check tables exist
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name IN ('models', 'images', 'samples', 'credits');
  ```
- [ ] **Image Expiry**: Check column exists
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'images' AND column_name = 'expires_at';
  ```
- [ ] **Cleanup Job**: Check pg_cron job
  ```sql
  SELECT * FROM cron.job;
  ```
- [ ] **Custom Prompt**: Check column exists
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'profiles' AND column_name = 'custom_astria_prompt';
  ```

#### Task 3.3: Test Functionality (P0)
- [ ] Test headshot generation workflow
- [ ] Test image expiry feature
- [ ] Test custom prompt saving
- [ ] Test admin permissions
- [ ] Check all API endpoints working

### [P2] PHASE 4: Prevention and Synchronization

#### Task 4.1: Download Remote Migrations (P2)
- [ ] Create placeholder files for 23 remote-only migrations
- [ ] Name with remote timestamp (e.g., `20250605012618.sql`)
- [ ] Add comment: "Applied remotely via dashboard"
- [ ] This syncs local history with remote

#### Task 4.2: Establish Migration Workflow (P2)
- [ ] **ALWAYS use Supabase CLI for migrations**
- [ ] NEVER apply via dashboard (except emergencies)
- [ ] Document emergency dashboard applications
- [ ] Add migration deployment to CI/CD pipeline
- [ ] Create MIGRATION_GUIDE.md with best practices

#### Task 4.3: Regular Audits (P2)
- [ ] Weekly: Run `supabase migration list --linked`
- [ ] Check for discrepancies
- [ ] Document any manual applications
- [ ] Keep deployment-gap-analysis.txt updated

### Quick Migration Status Check:
```bash
# Check migration sync status
supabase migration list --linked

# Expected output: All local migrations should have Remote timestamps
```

### Why This Happened:
- Migrations created locally but applied via Supabase Dashboard with different timestamps
- No automated deployment verification
- Manual dashboard usage bypassed migration tracking
- This is a RECURRING pattern (see project-tasks.mdc)

### Documentation:
- deployment-gap-analysis.txt - Complete gap analysis
- See Fix #3 in project-tasks.mdc for custom_astria_prompt column issue

---

## 🚨 CRITICAL: Custom Astria Prompt Database Column Missing (2025-10-08)

**Error**: column profiles.custom_astria_prompt does not exist (Error 42703)
**Impact**: Custom prompt feature completely broken
**Time to Fix**: 5 minutes
**Status**: ⏳ IMMEDIATE USER ACTION REQUIRED

### Quick Fix - Run SQL Now:
**Document**: IMMEDIATE_FIX_CUSTOM_PROMPT_COLUMN.md (step-by-step guide)

### Detailed Checklist:

#### [P0] IMMEDIATE FIX STEPS (Must Do Now)
- [ ] Open Supabase SQL Editor (https://supabase.com/dashboard/project/imzlzufdujhcbebibgpj)
- [ ] Click 'New Query'
- [ ] Copy SQL from IMMEDIATE_FIX_CUSTOM_PROMPT_COLUMN.md
- [ ] Run the SQL script
- [ ] Verify success message appears

#### [P0] VERIFICATION STEPS (Confirm It Worked)
- [ ] Check SQL output shows: custom_astria_prompt | text
- [ ] Refresh web app at https://myphoto.heyphotoai.com
- [ ] Check browser console - no more 42703 errors
- [ ] Navigate to headshot generator page
- [ ] Verify no database errors appear

#### [P1] TESTING STEPS (Make Sure Everything Works)
- [ ] Try typing in custom prompt field
- [ ] Click 'Save as Default' button
- [ ] Reload the page
- [ ] Verify saved prompt persists
- [ ] Try generating headshots with custom prompt

#### [P2] POST-FIX ACTIONS
- [ ] Monitor application logs for new errors
- [ ] Document the fix was completed
- [ ] Update local migration status if needed

### Why This Happened:
- Migration file exists: supabase/migrations/20251008000000_add_custom_prompt.sql
- But migration wasn't applied to production database
- This is a **recurring pattern** (see project-tasks.mdc for similar issues from 2025-10-06)

### Related Issues:
- 2025-10-06: Complete MYPHOTO Database Migration (similar pattern)
- Frontend/backend schema mismatches (recurring theme)

---

## 🚨 CRITICAL: TrainModelHandler 500 Error (Debugging In Progress)

**Error**: Internal server error in trainModelHandler (500)
**Impact**: Users cannot train models - blocks entire headshot generation workflow
**Status**: ⏳ AWAITING SUPABASE LOGS INVESTIGATION

### Detailed Debugging Checklist:

#### [P0] CRITICAL - IMMEDIATE INVESTIGATION REQUIRED

**1. Supabase Edge Function Logs Analysis**
- [ ] Open Supabase Dashboard → Functions → generate-headshot → Logs
- [ ] Find the most recent 500 error invocation
- [ ] Copy the complete error message and stack trace
- [ ] Look for specific error patterns:
  - [ ] "ASTRIA_API_KEY is not defined" or similar env var errors
  - [ ] Database connection failures
  - [ ] JSON parsing errors in request body
  - [ ] Astria API authentication failures (401/403)
  - [ ] Image encoding/base64 errors

**2. Environment Variables Verification**
- [ ] Navigate to Supabase Dashboard → Project Settings → Edge Functions → Secrets
- [ ] Verify ASTRIA_API_KEY exists and is not empty
- [ ] Verify key format starts with expected prefix (e.g., "sd_")
- [ ] Check for typos, extra spaces, or newline characters
- [ ] Test key directly with Astria API using curl:
  ```bash
  curl -H "Authorization: Bearer YOUR_KEY" https://api.astria.ai/tunes
  ```
- [ ] Verify edge function can access the secret (add logging if needed)

#### [P1] HIGH PRIORITY - VERIFY DATA FLOW

**3. Database Connectivity & RLS Policies**
- [ ] Check edge function can connect to Supabase database
- [ ] Verify RLS policies on `models` table allow INSERT for authenticated users
- [ ] Verify RLS policies on `credits` table allow SELECT/UPDATE for authenticated users
- [ ] Test database query directly in Supabase SQL Editor:
  ```sql
  SELECT * FROM credits WHERE user_id = 'USER_ID';
  SELECT * FROM models WHERE user_id = 'USER_ID' ORDER BY created_at DESC LIMIT 5;
  ```
- [ ] Check if service role key has proper permissions

**4. Input Parameter Validation**
- [ ] Verify image data format (base64 with data URL prefix)
- [ ] Check image count is within 4-20 range
- [ ] Verify model name contains only letters, numbers, spaces
- [ ] Check request body structure matches expected format:
  ```json
  {
    "action": "train_model",
    "name": "ModelName",
    "images": ["data:image/jpeg;base64,..."],
    "steps": 500,
    "face_crop": true
  }
  ```
- [ ] Add console logging to trainModelHandler to inspect incoming parameters

#### [P2] MEDIUM PRIORITY - API INTEGRATION CHECKS

**5. Astria API Request/Response Analysis**
- [ ] Review Astria API documentation for tune creation endpoint
- [ ] Verify request body format matches Astria's requirements
- [ ] Check callback URL is accessible: `${supabaseUrl}/functions/v1/astria-webhook`
- [ ] Test Astria API directly with sample request
- [ ] Review Astria API rate limits and quota
- [ ] Check if account has active subscription/credits

**6. Code Review - trainModelHandler.ts**
- [ ] Review lines 23-32: Input validation logic
- [ ] Review lines 35-56: Astria API call structure
- [ ] Review lines 70-80: Database insert logic
- [ ] Add try-catch blocks around each major operation
- [ ] Add detailed logging before/after each API call

### Debugging Steps to Add Logging:

Add these console.log statements to trainModelHandler.ts:

```typescript
// After line 24
console.log("🔍 DEBUG - Received parameters:", {
  name,
  imageCount: images.length,
  steps,
  face_crop
});

// After line 35
console.log("🔍 DEBUG - Supabase client initialized");

// Before line 38
console.log("🔍 DEBUG - Calling Astria API with:", {
  title: name,
  name: `${name} ${Date.now()}`,
  callback: `${supabaseUrl}/functions/v1/astria-webhook`,
  imageCount: images.length
});

// After line 67
console.log("🔍 DEBUG - Astria response:", astriaData);

// Before line 71
console.log("🔍 DEBUG - Inserting into database:", {
  user_id: user.id,
  astria_model_id: astriaData.id,
  name: name,
  status: astriaData.status || "training"
});
```

### Known Similar Issues from project-tasks.mdc:
- **2025-10-06**: Database service methods disabled/commented out
- **2025-10-06**: Missing API key configurations
- **Pattern**: Frontend/backend parameter mismatches causing 500 errors

### Next Action:
**USER MUST**: Access Supabase logs and share the complete error message. Without the actual error details, we cannot proceed with a specific fix.

**Documentation**: FIX_DATABASE_AND_DEBUG_GUIDE.md

---

- [x] Use Gemini CLI to analyze tasks
- [x] Integrate checklist into priority-checklist.md
- [x] Fix Generate Headshots Button (CRITICAL)
- [x] Update project-tasks.mdc with solution
- [ ] **Skip "Start Training Button" debugging - prioritize Gallery features**

## ✅ Completed: Generate Headshots Button Fix
**Fixed:** Incorrect tuneId retrieval causing all image generation to fail
**Files Modified:**
- `src/hooks/useHeadshotGenerator.ts` (lines 221-226)
- `src/services/headshotGeneratorService.ts` (lines 183-188)

## 🚨 FIXED: Internal Server Error in trainModelHandler (2025-10-08)

**Error**: Internal server error in trainModelHandler
**Symptom**: Photos won't generate - training fails before images can be created

**Root Cause**: Model names containing underscores rejected by Astria API
**Astria Rule**: Only English letters, numbers, and spaces allowed in model names

**Fixes Applied**:
1. headshotGeneratorService.ts:82 - Changed underscore replacement to special character removal
2. trainModelHandler.ts:49 - Changed underscore separator to space in timestamp

**Files Modified**:
- `src/services/headshotGeneratorService.ts` (line 81-82)
- `supabase/functions/generate-headshot/trainModelHandler.ts` (line 47-49)

**Deployment**:
- Frontend: Rebuilt (dist/assets/index-B21eVNwg.js)
- Edge Function: v41 deployed to Supabase

**Testing Required**:
- [ ] Upload 4-10 photos
- [ ] Click Generate Headshots
- [ ] Verify no 'Internal server error'
- [ ] Confirm training starts successfully
- [ ] Verify images generate after training

## 🚨 HIGH PRIORITY: Headshot Generation Button Debugging Checklist

**I. Initial Checks & Configuration Verification**

- [ ] **1. Browser Console Errors:**
  - [ ] Open browser developer console (Network and Console tabs)
  - [ ] Click Generate Headshot button
  - [ ] Check for JavaScript errors, network failures (4xx, 5xx), CORS issues
  - [ ] Check for JavaScript warnings
- [ ] **2. Environment Variables (Client-Side):**
  - [ ] Verify VITE_SUPABASE_URL in .env file
  - [ ] Verify VITE_ASTRIA_API_KEY in .env file
- [ ] **3. Supabase Secrets:**
  - [ ] Confirm ASTRIA_API_KEY is present and correct
  - [ ] Verify no typos or extra spaces
- [ ] **4. Edge Function Deployment:**
  - [ ] Verify generate-headshot function deployed at v39
  - [ ] Verify astria-webhook function deployed at v38
  - [ ] Check function logs for errors
- [ ] **5. User Authentication:**
  - [ ] Ensure user is authenticated
  - [ ] Check authentication token is passed to edge function
- [ ] **6. Credits Balance:**
  - [ ] Verify user has sufficient Astria API credits

**II. Code Flow Verification**

- [ ] **1. HeadshotGenerator.tsx:**
  - [ ] Verify button onClick calls handlePhotosSelected
  - [ ] Check conditional rendering isn't blocking button
  - [ ] Confirm success message display logic is correct
- [ ] **2. useHeadshotGenerator.ts:**
  - [ ] Verify state management for loading, errors, images
  - [ ] Check response handling (success and error cases)
  - [ ] Log data being sent to service before API call
- [ ] **3. headshotGeneratorService.ts:**
  - [ ] Verify correct data (including custom prompt) sent to edge function
  - [ ] Check error handling and parsing
  - [ ] Verify response parsing (image URLs, status)
- [ ] **4. generate-headshot Edge Function:**
  - [ ] Verify authentication handling
  - [ ] Confirm ASTRIA_API_KEY usage from secrets
  - [ ] Check train_model action calls Astria API correctly
  - [ ] Check generate_image action calls Astria API correctly
  - [ ] Verify custom prompt injection into API request
  - [ ] Add detailed logging for API calls
- [ ] **5. astria-webhook Edge Function:**
  - [ ] Verify webhook receives and processes Astria events
  - [ ] Check status updates in database
  - [ ] Verify error handling for webhook processing

**III. Testing Steps**

- [ ] **1. Simple Test:**
  - [ ] Click Generate Headshot with default settings
  - [ ] Observe console and network requests
  - [ ] Verify images display
  - [ ] Verify success message displays
- [ ] **2. Error Scenario Testing:**
  - [ ] Test with invalid API key
  - [ ] Test with insufficient credits
  - [ ] Test with invalid prompt
  - [ ] Test with network errors

**IV. Fix Actions**

- [ ] Fix any identified API key issues
- [ ] Address CORS issues if present
- [ ] Improve error handling throughout flow
- [ ] Fix prompt injection if broken
- [ ] Add comprehensive logging
- [ ] Ensure module sizes under 300 lines

## Next Priority: Gallery & Image Management Features
Based on project-tasks.mdc analysis, the next priorities are:

### Phase 0.5: Display Generated Images & Status
- [x] Show generated images on /generate page after generation ✅ VERIFIED
- [x] Add success/error toast notifications ✅ VERIFIED
- [x] Real-time progress updates during generation ✅ VERIFIED
- [x] Handle generation failures gracefully ✅ VERIFIED

### Gallery Enhancements - All VERIFIED as IMPLEMENTED
- [x] Verify Full Gallery on Overview page works correctly ✅ IMPLEMENTED
- [x] Verify Multi-Resolution Downloads (4K, 1080p, 720p) ✅ IMPLEMENTED
- [x] Verify Dedicated Gallery Page with filtering ✅ IMPLEMENTED
- [x] Verify Gallery Link on /generate page ✅ IMPLEMENTED

**Verification Details:**
- **Full Gallery**: Overview.tsx shows all user images with grid layout
- **Multi-Resolution**: image-resolution.ts provides 4K/1080p/720p/original downloads
- **Gallery Page**: Gallery.tsx with FilterBar component (search, status filter, sort)
- **Gallery Link**: HeadshotGenerator.tsx has Gallery button in header

### Completed Features
- [x] Pending Images Display on /generate ✅ IMPLEMENTED
- [x] 24-Hour Image Lifecycle (auto-delete) ✅ IMPLEMENTED

## ✅ COMPLETED: 24-Hour Image Lifecycle & Auto-Cleanup
**Priority**: HIGH - Storage Management & Cost Optimization
**Status**: FULLY IMPLEMENTED
**Completion Date**: 2025-10-07

### ✅ Implementation Complete:
1. ✅ Add `expires_at` column to images table - Migration 20251007000000
2. ✅ Create cleanup database function - `cleanup_expired_images()`
3. ✅ Schedule automatic cleanup - pg_cron runs hourly at :00
4. ✅ Service layer for UI integration - imageExpiryService.ts
5. ✅ "Save Forever" feature ready - `saveImageForever()` method

### Files Created:
- `supabase/migrations/20251007000000_add_image_expiry.sql`
- `supabase/migrations/20251007000001_schedule_image_cleanup.sql`
- `src/services/imageExpiryService.ts`

### Next Steps (Optional UI Enhancement):
- Show expiry countdown on image cards
- Add "Save Forever" button to UI
- Display expiry warnings for images expiring soon

---

## ✅ COMPLETED: Pending Images Display on /generate
**Priority**: MEDIUM - User Experience Enhancement
**Status**: FULLY IMPLEMENTED
**Completion Date**: 2025-10-07

### ✅ Implementation Complete:
1. ✅ Added allGeneratedImages state to track all images with status
2. ✅ Created GeneratedImage interface with id, url, status, created_at
3. ✅ Updated pollImageCompletion to update state every 10 seconds
4. ✅ Created PendingImageGrid component with real-time status display
5. ✅ Integrated component into HeadshotGenerator during 'generating' step

### Features Implemented:
- **Real-time Status Tracking**: Images update from pending → generating → completed/failed
- **Visual Status Indicators**:
  - ✅ Green CheckCircle for completed images
  - 🔄 Animated Loader for generating images
  - ❌ AlertCircle for failed images
  - 📋 Placeholder cards for pending images
- **Progress Counter**: "Generating Images (2/4)" display
- **Grid Layout**: Responsive 2-column (mobile) to 4-column (desktop) grid
- **Automatic Updates**: State refreshes every 10s during polling

### Files Created:
- `src/components/PendingImageGrid.tsx` (117 lines)
  - ImageCard subcomponent for status-based rendering
  - PlaceholderCard for not-yet-started images
  - Skeleton loaders and status badges

### Files Modified:
- `src/hooks/useHeadshotGenerator.ts`:
  - Added GeneratedImage interface (lines 8-13)
  - Added allGeneratedImages state (line 38)
  - Updated pollImageCompletion to track all images (lines 195-202)
  - Added allGeneratedImages to return (line 313)
- `src/pages/HeadshotGenerator.tsx`:
  - Imported PendingImageGrid component (line 9)
  - Added allGeneratedImages to hook destructure (line 25)
  - Updated 'generating' case to show PendingImageGrid (lines 46-57)

### User Experience Improvements:
- Users can watch images generate in real-time
- Clear visual feedback for each image's status
- Reduced perceived wait time with engaging progress display
- Better transparency into the generation process
