# Deployment Instructions - Fix "Model not found" Error

## ✅ Changes Completed

### Frontend (HeadshotGenerator.tsx)
- ✅ Removed model selection dropdown
- ✅ Added single "Generate Headshots Now" button  
- ✅ Simplified UI for better user experience
- ✅ Built successfully: `npm run build`

### Backend (generateImageHandler.ts)
- ✅ Bypassed database model lookup (was causing PGRST116 error)
- ✅ Added support for DEFAULT_ASTRIA_TUNE_ID environment variable
- ✅ Modified to use configured tune_id directly
- ✅ Committed and pushed to GitHub

## 🔧 Deployment Steps

### Step 1: Get Your Astria Tune ID

You need to get the tune_id for your "new Ru man" model from Astria.

**Option A: Via Astria Dashboard**
1. Go to https://www.astria.ai/tunes
2. Find your "new Ru man" model
3. Copy the ID number (it's in the URL or model details)

**Option B: Via API (if you have direct API access)**
```bash
curl -H "Authorization: Bearer YOUR_ASTRIA_API_KEY" https://api.astria.ai/tunes
```

Look for the model with `"title": "new Ru man"` and note its `"id"` field.

### Step 2: Set Environment Variable in Supabase

Once you have the tune_id, set it in Supabase:

```bash
supabase secrets set DEFAULT_ASTRIA_TUNE_ID="YOUR_TUNE_ID_HERE"
```

**Example:**
```bash
supabase secrets set DEFAULT_ASTRIA_TUNE_ID="2979897"
```

### Step 3: Deploy Edge Function

Deploy the updated edge function:

```bash
cd /Users/dimaglinskii/Documents/GitHub/myphoto
supabase functions deploy generate-headshot --project-ref imzlzufdujhcbebibgpj
```

### Step 4: Verify Deployment

After deployment, verify everything works:

1. Navigate to `/generate` page in your app
2. Click "Generate Headshots Now" button
3. Check Supabase logs for success:
   - Should see: `✅ Using configured Astria tune_id: YOUR_TUNE_ID`
   - Should NOT see: `❌ Model not found or access denied`

## 🧪 Testing Checklist

- [ ] Environment variable `DEFAULT_ASTRIA_TUNE_ID` is set
- [ ] Edge function deployed successfully
- [ ] Frontend build deployed (dist/ folder)
- [ ] Click "Generate Headshots Now" button
- [ ] Check Supabase logs - should show tune_id being used
- [ ] Verify no PGRST116 errors
- [ ] Images start generating

## 📝 What Changed

**Before:**
- Frontend sent `model_id` (database ID)
- Backend queried database for model with user_id filter
- Query returned 0 rows → PGRST116 error
- User couldn't generate images

**After:**
- Frontend sends simple generate request
- Backend uses configured `DEFAULT_ASTRIA_TUNE_ID`
- No database lookup (skips the error entirely)
- Calls Astria API directly with tune_id
- User can generate images immediately

## ⚠️ Important Notes

1. **Tune ID Format**: The tune_id should be a number (e.g., "2979897")
2. **Model Must Be Trained**: Ensure "new Ru man" model is fully trained in Astria
3. **API Key**: ASTRIA_API_KEY must still be set in Supabase secrets
4. **Credits**: Users still need sufficient credits to generate

## 🔍 Troubleshooting

### If you still see "Model not found" error:
- Check that DEFAULT_ASTRIA_TUNE_ID is set: `supabase secrets list`
- Verify edge function was deployed: Check version number in logs
- Check Supabase logs for the tune_id being used

### If you see "Access denied" from Astria:
- Verify ASTRIA_API_KEY is correct
- Verify the tune_id exists and is accessible with your API key
- Try the API call manually with curl

### If images don't generate:
- Check user has sufficient credits
- Check Astria dashboard for the generation job status
- Verify webhook callback URL is correct

## 📞 Next Steps

After successful deployment:
1. Test image generation with the new UI
2. Monitor Supabase logs for any errors
3. Update project-tasks.mdc with results
4. Consider adding admin dashboard configuration for tune_id selection
