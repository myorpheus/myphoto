# Priority Checklist

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

---

## 🎯 NEXT PRIORITY: Custom Astria Prompt Editing
**Priority**: MEDIUM - Feature Enhancement & User Customization
**Status**: PLANNING PHASE
**Goal**: Allow users to customize Astria API prompts with custom requirements (e.g., "only gemini nano banana to generate the photos")

### Implementation Checklist:

#### 1. Understand Astria API Prompt Structure
- [ ] **Locate Service Logic**: Identify file making Astria API calls (likely `src/services/astria.ts` or `supabase/functions/generate-headshot/`)
- [ ] **Analyze Request Body**: Examine how `prompt` field is currently constructed
- [ ] **Consult API Documentation**: Review Astria API docs for prompt parameter specs (length limits, formatting)
- [ ] **Determine Injection Point**: Decide strategy for adding custom text (e.g., concatenation: `base_prompt, custom_user_text`)

#### 2. Create UI for Prompt Customization
- [ ] **Identify UI Component**: Choose location for input field (`GenerationOptions.tsx` or `HeadshotGenerator.tsx`)
- [ ] **Add Input Field**: Create textarea using existing UI components
- [ ] **Implement State Management**: Use `useState` to manage custom prompt value
- [ ] **Add UI Elements**:
  - [ ] Clear label: "Custom Prompt Details"
  - [ ] Placeholder text: e.g., "cinematic lighting, wearing a black turtleneck"
  - [ ] "Save Preference" button for storing custom prompt

#### 3. Integrate Custom Prompts into Generation Requests
- [ ] **Pass State to Parent**: Propagate custom prompt string to generation trigger component
- [ ] **Modify Service Call**: Update function signature to accept custom prompt parameter
- [ ] **Update Backend/Edge Function**:
  - [ ] Modify Supabase function payload to include custom prompt
  - [ ] Update edge function logic to receive parameter
- [ ] **Combine Prompts**: Merge base prompt with custom prompt in backend (proper formatting)
- [ ] **End-to-End Test**: Verify final prompt sent to Astria includes custom text

#### 4. Store User Preferences
- [ ] **Update Database Schema**:
  - [ ] Create migration file in `supabase/migrations/`
  - [ ] Add `custom_astria_prompt` text column to `profiles` table
  - [ ] Run migration
- [ ] **Implement "Save" Functionality**:
  - [ ] Create function to update user's `custom_astria_prompt` in database
  - [ ] Hook to "Save Preference" button's onClick event
- [ ] **Implement "Load" Functionality**:
  - [ ] Fetch user's `custom_astria_prompt` on page load
  - [ ] Set initial state of input field with saved preference
- [ ] **Provide User Feedback**: Toast notification on successful save (use `use-toast` hook)
