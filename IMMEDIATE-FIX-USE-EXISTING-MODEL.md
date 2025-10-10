# IMMEDIATE FIX: Use Existing "new Ru man" Model

## 🎯 Problem
Code is calling training endpoint when user wants to use EXISTING trained model "new Ru man".

## ✅ Solution (4 Steps)

### Step 1: Get the `tune_id` for "new Ru man"

**Execute this command:**
```bash
curl -H "Authorization: Bearer YOUR_ASTRIA_API_KEY" https://api.astria.ai/tunes
```

**Expected Response** (find your model):
```json
[
  {
    "id": 123,
    "title": "new Ru man",
    "name": "new_ru_man_model",
    "status": "trained",
    "created_at": "2024-10-26T...",
    "updated_at": "2024-10-26T..."
  }
]
```

**Note the `id` field** - this is your `tune_id`. Example: `123`

---

### Step 2: Test Generation Endpoint

**Execute this command** (replace `{TUNE_ID}` with your ID from Step 1):
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

**Expected Response** (200 OK):
```json
{
  "id": 789,
  "text": "ohwx man in business suit",
  "negative_prompt": "blurry, low quality",
  "tune_id": 123,
  "created_at": "2024-10-27T..."
}
```

✅ If you get this response, the endpoint works! Continue to Step 3.

❌ If 422 error: Check tune_id and API key
❌ If 401 error: API key is invalid

---

### Step 3: Update `generateImageHandler.ts`

**File:** `supabase/functions/generate-headshot/generateImageHandler.ts`

**Add this logic:**

```typescript
export async function generateImageHandler(
  body: any,
  user: User,
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  astriaApiKey: string,
) {
  try {
    const { tune_id, promptText, negativePrompt, num_images = 4 } = body;

    console.log(`📋 generateImageHandler: Request received`);
    console.log(`  - tune_id: ${tune_id}`);
    console.log(`  - promptText: ${promptText}`);

    // Check if using existing model or training new one
    if (tune_id) {
      // ✅ USE EXISTING MODEL (Generation)
      console.log(`✅ Using existing model: ${tune_id}`);

      const astriaApiUrl = `https://api.astria.ai/tunes/${tune_id}/prompts`;
      const requestBody = {
        prompt: {
          text: promptText || "ohwx man in business attire",
          negative_prompt: negativePrompt || "blurry, low quality, distorted",
          num_images: num_images,
          super_resolution: true,
          face_correct: true,
          w: 768,
          h: 1024
        }
      };

      console.log(`🌐 Calling Astria API: POST ${astriaApiUrl}`);

      const response = await fetch(astriaApiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${astriaApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📨 Astria API response: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Astria API error:", response.status, errorText);
        return new Response(
          JSON.stringify({ error: "Failed to generate images", details: errorText }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const astriaData = await response.json();
      console.log("✅ Astria prompt created:", astriaData);

      return new Response(
        JSON.stringify({ success: true, prompt: astriaData }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      // ❌ TRAINING NEW MODEL (should not happen if using existing model)
      console.log("⚠️ No tune_id provided - this will attempt training");
      return new Response(
        JSON.stringify({ error: "tune_id required to use existing model" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("❌ generateImageHandler error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
```

---

### Step 4: Update Frontend to Pass `tune_id`

**File:** `src/services/headshotGeneratorService.ts`

**Add method to use existing model:**

```typescript
/**
 * Generate images using existing trained model
 */
async generateWithExistingModel(params: {
  tuneId: number;
  promptText: string;
  negativePrompt?: string;
  numImages?: number;
  accessToken: string;
}): Promise<any> {
  const { tuneId, promptText, negativePrompt, numImages = 4, accessToken } = params;

  console.log('🎨 Generating with existing model:', tuneId);

  const response = await fetch(this.edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      action: 'generate_image',
      tune_id: tuneId,
      promptText: promptText,
      negativePrompt: negativePrompt || 'blurry, low quality',
      num_images: numImages,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Generation failed: ${response.statusText}`);
  }

  return await response.json();
}
```

**Quick Test (Hardcode tune_id):**

For testing, you can temporarily hardcode the tune_id in your frontend:

```typescript
// In your component
const TUNE_ID_NEW_RU_MAN = 123; // Replace with your actual tune_id

async function handleGenerate() {
  const result = await headshotGeneratorService.generateWithExistingModel({
    tuneId: TUNE_ID_NEW_RU_MAN,
    promptText: "ohwx man in professional business attire",
    numImages: 4,
    accessToken: await headshotGeneratorService.getAccessToken(),
  });

  console.log('Generation result:', result);
}
```

---

## 🧪 Testing Checklist

- [ ] Step 1: Get tune_id for "new Ru man" ✅
- [ ] Step 2: Test curl command returns 200 OK ✅
- [ ] Step 3: Update generateImageHandler.ts ✅
- [ ] Step 4: Update frontend to pass tune_id ✅
- [ ] Deploy Edge Function: `supabase functions deploy generate-headshot`
- [ ] Build frontend: `npm run build`
- [ ] Test in browser: Check Network tab for correct endpoint
- [ ] Verify logs: Check Supabase logs for success messages
- [ ] Verify images: Wait for generation to complete

---

## 🎯 Expected Flow

**BEFORE (Broken)**:
```
User clicks Generate
  ↓
trainModelHandler called (WRONG!)
  ↓
POST /tunes with images array (WRONG!)
  ↓
422 Error: "must contain at least one image"
```

**AFTER (Fixed)**:
```
User clicks Generate
  ↓
generateImageHandler called (CORRECT!)
  ↓
POST /tunes/{tune_id}/prompts with prompt (CORRECT!)
  ↓
200 OK: Images generating...
```

---

## 📝 Important Notes

1. **Trigger Word**: Always include "ohwx man" or "ohwx woman" in your prompt text
2. **Negative Prompt**: Use to avoid unwanted features
3. **API Key**: Ensure ASTRIA_API_KEY is set in Supabase secrets
4. **Webhook**: Generation is async - images will be available after callback

---

## 🚀 Next Steps After Fix

1. Add UI to select model (dropdown with trained models)
2. Add prompt input field for custom prompts
3. Add negative prompt input field
4. Save commonly used prompts
5. Add model management (list, delete, retrain)

---

## 📚 Related Documentation

- `FIX-422-WRONG-ENDPOINT.md` - Detailed analysis
- `astria_prompt.md` - API reference
- `project-tasks.mdc` - Fix #0.3 entry
