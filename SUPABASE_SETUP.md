# 🚀 Supabase Astria Integration Setup Guide

## 🔑 Critical Setup Required - ASTRIA_API_KEY Configuration

The Astria integration requires configuring your API key in **Supabase Secrets** (not just the frontend .env file).

### ⚡ Quick Setup Steps

1. **Get Your Astria API Key**
   - Log in to https://www.astria.ai/
   - Go to Account → API Settings
   - Copy your API key (starts with `sd_`)

2. **Add Secret to Supabase**
   - Go to your Supabase project dashboard
   - Navigate to **Settings** → **Edge Functions** → **Environment Variables**
   - Add secret:
     - Name: `ASTRIA_API_KEY`
     - Value: `your_actual_api_key_here`

3. **Redeploy Edge Functions** (if needed)
   ```bash
   supabase functions deploy generate-headshot
   ```

### 🧪 Testing the Integration

1. Visit: https://myphoto.heyphotoai.com/admin/train
2. Open browser console (F12)
3. Look for debug messages:

**✅ Success Indicators:**
```
🔄 Step 1: Loading existing Astria models...
✅ Step 2: Raw API response: {success: true, models: [...]}
📊 Step 3: Found X models from Astria account
🎯 Step 5: Selected default model: {name: "...", id: ...}
```

**❌ Error Indicators:**
```
❌ API Error 401: Unauthorized (API Key not configured)
❌ API Error 401: Invalid API key format
❌ Critical Error loading Astria models: ...
```

### 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| `401 Unauthorized` | API key not configured in Supabase secrets |
| `Invalid API key format` | API key should start with `sd_` |
| `No models found` | Train models in your Astria account first |
| `Edge function error` | Redeploy edge functions after adding secret |

### 📋 Expected Behavior After Setup

✅ **Automatic model loading** when visiting /admin/train page  
✅ **"newheadhotMAN" model auto-selected** as default (if it exists)  
✅ **"Use Existing Model" button enabled** automatically  
✅ **Dropdown populated** with your Astria models  
✅ **Enhanced debug logging** in console  

### 🎯 Model Selection Logic

The system searches for your default model using multiple strategies:

1. **Exact match**: Models named "newheadhotman" 
2. **Pattern match**: Models containing "newheadshot" or "headshot"
3. **Trained fallback**: Any trained/finished model
4. **Any available**: Any model (including undefined status)

Models with `undefined` status are treated as **available** since Astria API often returns this for ready models.

### 🔧 Advanced Configuration

**Supabase CLI Method:**
```bash
# Set the secret via CLI
supabase secrets set ASTRIA_API_KEY=your_actual_key_here

# Verify it's set
supabase secrets list

# Redeploy functions
supabase functions deploy generate-headshot
```

**Environment Variables (Alternative):**
```bash
# In your Supabase project settings
ASTRIA_API_KEY=your_actual_key_here
```

---

**🎉 Once configured, you'll have full access to:**
- ✨ Your existing trained Astria models
- 🚀 One-click model integration for headshot generation  
- 📊 Automatic "newheadhotMAN" default selection
- 🔍 Comprehensive debugging and error reporting