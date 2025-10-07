# Gemini 2.5 Flash Integration Setup

## Overview

This project uses Google Gemini 2.5 Flash (gemini-2.0-flash-exp) to enhance Astria AI prompts before image generation. The integration improves headshot quality by optimizing prompts specifically for Astria's nano banana model.

## Features

- **Smart Prompt Enhancement**: Gemini analyzes and improves prompts based on style (professional, doctor, boudoir)
- **Graceful Fallback**: If Gemini is unavailable, uses style-based prompts
- **Context-Aware**: Considers style and gender for optimal results
- **Production-Ready**: Proper error handling and logging

## Setup Instructions

### 1. Get Google AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy your API key (starts with `AIza...`)

### 2. Set Supabase Secret

Run the following command in your terminal:

```bash
supabase secrets set GEMINI_API_KEY="YOUR_API_KEY_HERE"
```

Replace `YOUR_API_KEY_HERE` with your actual Google AI API key.

### 3. Redeploy Edge Function

After setting the secret, redeploy the generate-headshot edge function:

```bash
supabase functions deploy generate-headshot
```

### 4. Verify Integration

Check the Supabase function logs when generating images. You should see:

```
🤖 Gemini 2.5 Flash available - enhancing prompt...
✅ Gemini enhancement successful
📝 Original: [original prompt]
🚀 Enhanced: [enhanced prompt]
```

If the API key is not configured, you'll see:

```
ℹ️ Gemini API not configured - using style-based prompts only
```

## How It Works

### Prompt Enhancement Flow

1. User selects a style (professional/doctor/boudoir) and uploads photos
2. System generates a base prompt with style-specific templates
3. **Gemini Enhancement** (if configured):
   - Sends base prompt to Gemini 2.5 Flash
   - Gemini optimizes for Astria's nano banana model
   - Returns enhanced prompt with better details and composition
4. Enhanced prompt sent to Astria API for image generation

### Example Enhancement

**Original Prompt:**
```
professional, corporate headshot, full face frontal only, business attire, clean background
```

**Gemini-Enhanced Prompt:**
```
professional corporate executive headshot, full frontal face composition, sharp focus on facial features, business formal attire with neutral tie, clean seamless gray background, studio lighting with soft shadows, high resolution 8K quality, professional photography, confident expression
```

## Configuration Options

### Temperature & Creativity

Edit `geminiPromptEnhancer.ts` to adjust creativity:

```typescript
generationConfig: {
  temperature: 0.7,  // 0.0-1.0, higher = more creative
  maxOutputTokens: 200,
  topP: 0.95,
  topK: 40
}
```

### Style-Specific Prompts

Modify the system prompt in `geminiPromptEnhancer.ts` to customize how Gemini enhances each style.

## Testing

### Test Gemini Integration Locally

1. Set environment variable:
   ```bash
   export GEMINI_API_KEY="your_api_key"
   ```

2. Deploy function:
   ```bash
   supabase functions deploy generate-headshot
   ```

3. Test via HeadshotGenerator UI:
   - Upload 4-10 photos
   - Select a style
   - Click "Generate Headshots"
   - Check function logs for Gemini output

### Check Function Logs

```bash
supabase functions logs generate-headshot
```

Look for Gemini-related messages:
- `🤖 Gemini 2.5 Flash available`
- `✅ Gemini enhancement successful`
- `⚠️ Gemini enhancement skipped` (if there's an error)

## API Costs

### Google AI Studio (Free Tier)

- **Rate Limit**: 15 requests per minute
- **Daily Quota**: 1,500 requests per day
- **Token Limit**: 32,000 tokens per minute
- **Cost**: **FREE** for personal/testing use

### Production Usage

For production with high volume:
1. Enable billing in Google Cloud Console
2. Monitor usage in Google AI Studio
3. Typical cost: ~$0.00025 per prompt enhancement
4. Budget example: 10,000 enhancements ≈ $2.50/month

## Troubleshooting

### "API key not configured" Error

**Solution:** Set the GEMINI_API_KEY secret:
```bash
supabase secrets set GEMINI_API_KEY="your_key"
supabase functions deploy generate-headshot
```

### "Gemini enhancement skipped" Warning

**Possible causes:**
1. Rate limit exceeded (15 req/min)
2. Invalid API key
3. Network timeout
4. Google AI API downtime

**Solution:** Check function logs for detailed error message. System will fall back to style-based prompts automatically.

### Prompts Not Improving

1. Check if Gemini is actually being called (look for logs)
2. Try adjusting temperature in `generationConfig`
3. Modify system prompt to be more specific
4. Compare "Original" vs "Enhanced" prompts in logs

## Files Modified

- `supabase/functions/generate-headshot/geminiPromptEnhancer.ts` - Gemini integration
- `supabase/functions/generate-headshot/generateImageHandler.ts` - Integration point
- `GEMINI_SETUP.md` - This documentation

## Benefits

✅ **Better Image Quality**: AI-optimized prompts produce better results
✅ **Zero Config Required**: Works without Gemini (graceful fallback)
✅ **Production Ready**: Error handling and logging built-in
✅ **Cost Effective**: Free tier supports thousands of requests
✅ **Flexible**: Easy to customize for different use cases

## Support

For issues or questions about Gemini integration:
1. Check function logs: `supabase functions logs generate-headshot`
2. Verify API key: `supabase secrets list`
3. Review Google AI Studio quota: https://makersuite.google.com/
4. Test with curl to isolate issues

## Next Steps

After setup is complete:
1. ✅ Set GEMINI_API_KEY secret
2. ✅ Deploy edge function
3. ✅ Test with sample images
4. ✅ Monitor function logs
5. ✅ Compare results with/without Gemini
6. ✅ Adjust prompts if needed
