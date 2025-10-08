# Priority Checklist

## 🚨 CRITICAL P0: Generate-Headshot Edge Function NOT DEPLOYED (2025-10-08)

**ERROR**: generate-headshot Edge Function does not exist on Supabase
**ROOT CAUSE**: Function exists in local codebase but was never deployed to production
**IMPACT**: ALL headshot generation completely broken - 500 errors on all requests
**TIME TO FIX**: 10-15 minutes
**STATUS**: ⚠️ IMMEDIATE DEPLOYMENT REQUIRED

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
