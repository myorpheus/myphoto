# Test Astria API Connection - Model: "new Ru man"

This guide helps you test the Astria API connection through the Edge Function.

## ✅ Quick Test via Web App (RECOMMENDED)

**This is the easiest way to test:**

1. **Start watching Edge Function logs** (in terminal):
   ```bash
   supabase functions logs generate-headshot --follow
   ```

2. **Open the web app**:
   - Go to: https://myphoto.heyphotoai.com
   - Sign in with your account

3. **Upload test images**:
   - Upload any 4-10 photos
   - Model name: "new Ru man"
   - Click "Start Training" or "Generate Headshots"

4. **Watch the logs** in your terminal for:
   - ✅ `✅ trainModelHandler: Astria model created:` - SUCCESS!
   - ❌ `❌ Astria API error: 422` - Still failing
   - 🔍 All the diagnostic logging we added

## 🧪 Test via curl Command (Advanced)

### Step 1: Get Authentication Token

**Option A: Via Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/imzlzufdujhcbebibgpj/auth/users
2. Click on any user (or create a test user)
3. Copy the JWT token (or generate a new one)

**Option B: Via Browser Console**
1. Open https://myphoto.heyphotoai.com
2. Sign in
3. Open DevTools Console (F12)
4. Run:
   ```javascript
   (await supabase.auth.getSession()).data.session.access_token
   ```
5. Copy the token

### Step 2: Run curl Command

```bash
curl -X POST \
  "https://imzlzufdujhcbebibgpj.supabase.co/functions/v1/generate-headshot" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN_HERE" \
  -d @/tmp/test-payload.json
```

**Replace `YOUR_AUTH_TOKEN_HERE` with the token from Step 1**

### Step 3: Check Response

**Success Response (200 OK):**
```json
{
  "success": true,
  "model": {
    "id": 123,
    "astria_model_id": 456,
    "name": "new Ru man",
    "status": "training"
  },
  "astriaModel": {
    "id": 456,
    "status": "training",
    "title": "new Ru man"
  }
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "error": "Failed to start model training",
  "details": "{\"images\":[\"must contain at least one image\"]}"
}
```

## 📊 Test Payload

The test uses 4 tiny 1x1 pixel JPEG images (minimal valid payload):

File: `/tmp/test-payload.json`

```json
{
  "action": "train_model",
  "name": "new Ru man",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  ],
  "steps": 500,
  "face_crop": true
}
```

## 🔍 What to Look For

### In Edge Function Logs:

**✅ Success Pattern:**
```
➡️ trainModelHandler: Function entry
🔑 trainModelHandler: ASTRIA_API_KEY availability: Available
📋 trainModelHandler: Request parameters received: {"name":"new Ru man","imageCount":4,"steps":500,"face_crop":true}
🔍 trainModelHandler: Images type: object
🔍 trainModelHandler: Images is Array: true
  - Image 1: type=string, length=631, starts with="data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
  - Image 2: type=string, length=631, starts with="data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
  - Image 3: type=string, length=631, starts with="data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
  - Image 4: type=string, length=631, starts with="data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
🌐 trainModelHandler: Astria API request details:
  - Body keys: tune, images, steps, face_crop
  - Body.images is Array: true
  - Body.images length: 4
📦 trainModelHandler: Stringified body length: XXXXX characters
📨 trainModelHandler: Astria API response status: 201
✅ trainModelHandler: Astria model created: {id: 12345, status: "training", ...}
```

**❌ Error Pattern (422):**
```
📨 trainModelHandler: Astria API response status: 422
❌ Astria API error details:
  - Status: 422
  - Response body: {"images":["must contain at least one image"]}
  - Parsed error: {
      "images": [
        "must contain at least one image"
      ]
    }
```

## 🛠️ Alternative: Node.js Test Script

If you prefer a standalone script:

```bash
# Get your auth token first (see Step 1 above)
node test-edge-function-new-ru-man.js "YOUR_AUTH_TOKEN"
```

## 📝 Next Steps

**If Test Succeeds** ✅:
- Astria API connection is working!
- The issue was likely with image encoding or size
- You can now use the app normally

**If Test Fails** ❌:
- Share the complete log output
- Include both Edge Function logs and curl response
- We'll analyze the exact error details from Astria

## 🎯 Expected Outcome

This test will definitively show whether:
1. ✅ The Astria API key is valid and working
2. ✅ The request format is correct
3. ✅ Images are being sent properly
4. ❌ Or identify the exact error from Astria API

The comprehensive logging will show exactly where the problem occurs.
