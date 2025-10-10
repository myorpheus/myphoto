# CRITICAL FIX: 422 Error - Wrong API Endpoint Used

## 🚨 ROOT CAUSE IDENTIFIED (2025-10-10)

**PROBLEM**: Code is calling `/tunes` (training endpoint) instead of `/tunes/{tune_id}/prompts` (generation endpoint) when trying to use existing trained models.

**IMPACT**: Cannot use existing trained model "new Ru man" for image generation - all generation requests fail with 422 error.

**STATUS**: 🔴 CRITICAL - ALL IMAGE GENERATION BLOCKED

---

## 📊 Log Analysis - Key Finding:

```
📋 Request parameters: {"name":"headshots1760091235212","imageCount":4,"steps":500,"face_crop":true}
🌐 URL: https://api.astria.ai/tunes  ← WRONG! This is for TRAINING
📦 Body includes: tune, images, steps, face_crop  ← WRONG! This is training format
📨 Astria API response: 422 {"images":["must contain at least one image"]}
```

**What's Happening:**
- User wants to USE existing trained model "new Ru man"
- Code sends training request (with images) to `/tunes`
- Astria rejects because it's the wrong endpoint/format

**What SHOULD Happen:**
- Get `tune_id` for existing "new Ru man" model
- Call `/tunes/{tune_id}/prompts` (generation endpoint)
- Send PROMPT (text), not images
- Astria generates images using the trained model

---

##  Fix Checklist

### [P0] CRITICAL: Implement Model Selection & Generation

#### Step 1: Add Function to Retrieve Existing Models
- [ ] Create `listUserModels()` in `statusCheckHandler.ts`
- [ ] Call Astria API: `GET https://api.astria.ai/tunes`
- [ ] Return list of user's trained models with `tune_id`, `title`, `status`
- [ ] Filter to only show models with `status: "trained"`

#### Step 2: Modify Frontend to Select Existing Model
- [ ] Add model selection UI before generation
- [ ] Allow user to choose: "Train New Model" vs "Use Existing Model"
- [ ] If using existing, show dropdown of trained models
- [ ] Pass `tune_id` to generation request

#### Step 3: Fix generateImageHandler.ts
- [ ] Check if request has `tune_id` (existing model) or `images` (new training)
- [ ] **FOR EXISTING MODEL** (has `tune_id`):
  - [ ] Call `/tunes/{tune_id}/prompts` endpoint
  - [ ] Send prompt body:
    ```json
    {
      "prompt": {
        "text": "ohwx man in professional suit",
        "negative_prompt": "blurry, low quality",
        "num_images": 4,
        "super_resolution": true
      }
    }
    ```
  - [ ] **DO NOT** include `images` array
- [ ] **FOR NEW TRAINING** (has `images`):
  - [ ] Keep existing logic calling `/tunes`
  - [ ] Include `images` array as currently done

#### Step 4: Update Request Body Format
Current (WRONG for generation):
```typescript
{
  tune: { title, name, callback },
  images: [...],  // ← Remove for generation!
  steps: 500,
  face_crop: true
}
```

Correct for generation:
```typescript
{
  prompt: {
    text: "ohwx man in business attire",  // Include trigger word
    negative_prompt: "blurry, distorted",
    num_images: 4,
    super_resolution: true,
    face_correct: true
  }
}
```

#### Step 5: Test End-to-End
- [ ] List existing models via API
- [ ] Verify "new Ru man" appears in list with `tune_id`
- [ ] Select "new Ru man" model
- [ ] Generate images with prompt
- [ ] Verify request goes to `/tunes/{tune_id}/prompts`
- [ ] Verify response includes generated image URLs
- [ ] Check no 422 errors

---

## 🔍 Astria API Endpoints Reference

### Training Endpoint (Create New Model)
```
POST https://api.astria.ai/tunes
Body: { tune: {...}, images: [...], steps, face_crop }
```

### Generation Endpoint (Use Existing Model)
```
POST https://api.astria.ai/tunes/{tune_id}/prompts
Body: { prompt: { text, negative_prompt, num_images, ... } }
```

### List Models
```
GET https://api.astria.ai/tunes
Headers: Authorization: Bearer {API_KEY}
```

---

## 📝 Files to Modify

1. **`supabase/functions/generate-headshot/statusCheckHandler.ts`**
   - Add `listModels()` function
   - Call Astria API to get all tunes
   - Return filtered list of trained models

2. **`supabase/functions/generate-headshot/generateImageHandler.ts`**
   - Add logic to distinguish training vs generation
   - Use correct endpoint based on request type
   - Format request body correctly for each case

3. **`src/services/headshotGeneratorService.ts`**
   - Add `listModels()` method
   - Modify `generateImage()` to accept `tune_id`
   - Update request format for generation

4. **`src/pages/HeadshotGenerator.tsx`** or **`src/components/ModelSelector.tsx`** (new)
   - Add UI to select existing model
   - Show "Train New" vs "Use Existing" toggle
   - Display list of trained models

---

## ⚡ Quick Fix for Testing

To quickly test with existing "new Ru man" model:

1. **Get the tune_id**:
   ```bash
   curl -H "Authorization: Bearer YOUR_ASTRIA_API_KEY" https://api.astria.ai/tunes
   ```

2. **Test generation endpoint directly**:
   ```bash
   curl -X POST "https://api.astria.ai/tunes/{TUNE_ID}/prompts" \
     -H "Authorization: Bearer YOUR_ASTRIA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": {
         "text": "ohwx man in business suit",
         "negative_prompt": "blurry, low quality",
         "num_images": 4
       }
     }'
   ```

3. **Verify it works** (should return 200 OK with prompt_id)

4. **Update code** to use this format

---

## 🎯 Expected Outcome

**BEFORE (Broken)**:
```
User clicks "Generate" → Code calls /tunes with images → 422 error
```

**AFTER (Fixed)**:
```
User selects "new Ru man" → Code calls /tunes/{tune_id}/prompts with prompt → Images generated ✅
```

---

## Related Documentation
- `astria_prompt.md` - Sections 3 & 5 (endpoints and format)
- `project-tasks.mdc` - Fix #0.2 (similar API format confusion)
