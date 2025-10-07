import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASTRIA_API_KEY = Deno.env.get("ASTRIA_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ASTRIA_API_KEY) {
      console.error("❌ ASTRIA_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Astria API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ Supabase configuration missing");
      return new Response(
        JSON.stringify({ error: "Database configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the authorization header to verify the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user's JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("❌ Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...params } = await req.json();

    console.log(`🚀 Processing Astria request: ${action} for user ${user.id}`);

    switch (action) {
      case "train_model": {
        const { name, images, steps = 500, face_crop = true } = params;

        // Validate inputs
        if (!name || !images || images.length < 4 || images.length > 20) {
          return new Response(
            JSON.stringify({ error: "Invalid training parameters. Need 4-20 images." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Call Astria API to create a tune (model)
        const response = await fetch("https://api.astria.ai/tunes", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${ASTRIA_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tune: {
              title: name,
              name: `${name}_${Date.now()}`,
              callback: `${SUPABASE_URL}/functions/v1/astria-webhook`,
            },
            images: images,
            steps: steps,
            face_crop: face_crop,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Astria API error:", response.status, errorText);
          return new Response(
            JSON.stringify({ error: "Failed to start model training", details: errorText }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const astriaData = await response.json();
        console.log("✅ Astria model created:", astriaData);

        // Save model to database
        const { data: dbModel, error: dbError } = await supabase
          .from("models")
          .insert({
            user_id: user.id,
            astria_model_id: astriaData.id,
            name: name,
            status: astriaData.status || "training",
          })
          .select()
          .single();

        if (dbError) {
          console.error("❌ Database error saving model:", dbError);
          return new Response(
            JSON.stringify({ error: "Failed to save model to database", details: dbError }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, model: dbModel, astriaModel: astriaData }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "generate_image": {
        const { model_id, prompt, num_images = 4, style = 'professional', gender = 'man', negative_prompt } = params;

        if (!model_id || !prompt) {
          return new Response(
            JSON.stringify({ error: "Missing required parameters: model_id and prompt" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get model from database to get Astria model ID
        const { data: model, error: modelError } = await supabase
          .from("models")
          .select("*")
          .eq("id", model_id)
          .eq("user_id", user.id)
          .single();

        if (modelError || !model) {
          return new Response(
            JSON.stringify({ error: "Model not found or access denied" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (model.status !== "trained") {
          return new Response(
            JSON.stringify({ error: "Model is not ready. Please wait for training to complete." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check user credits
        const { data: credits, error: creditsError } = await supabase
          .from("credits")
          .select("credits")
          .eq("user_id", user.id)
          .single();

        if (creditsError || !credits || credits.credits < num_images) {
          return new Response(
            JSON.stringify({ error: "Insufficient credits" }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate style-specific prompt and negative prompt optimized for nano banana
        const styleConfigs = {
          professional: {
            prompt: "professional, corporate headshot, full face frontal only, business attire, clean background, studio lighting, high resolution, sharp focus, professional photography, executive portrait",
            negativePrompt: "no side profiles, casual clothing, blurry, low quality, dark lighting, unprofessional appearance, distorted features, artificial artifacts"
          },
          doctor: {
            prompt: "doctor headshot, full face frontal only, white coat, medical professional, clinical setting, stethoscope, healthcare professional, professional medical portrait, clean white background", 
            negativePrompt: "no side profiles, casual clothing, non-medical setting, blurry, low quality, unprofessional appearance, distorted features, artificial artifacts"
          },
          boudoir: {
            man: {
              prompt: "boudoir, mid body shot, shirtless if man, artistic lighting, dramatic shadows, masculine aesthetic, professional boudoir photography, tasteful artistic portrait, sophisticated composition",
              negativePrompt: "no side profiles, explicit content, inappropriate poses, poor lighting, unprofessional appearance, distorted features, artificial artifacts, full nudity"
            },
            woman: {
              prompt: "boudoir, mid body shot, subtle, sexy lingerie, if woman detected, elegant feminine aesthetic, artistic lighting, dramatic shadows, professional boudoir photography, graceful pose, sophisticated composition",
              negativePrompt: "no side profiles, explicit content, inappropriate poses, poor lighting, unprofessional appearance, distorted features, artificial artifacts, full nudity"
            }
          }
        };

        let enhancedPrompt = prompt;
        let finalNegativePrompt = "no side profiles, blurry, low quality, distorted features, artificial artifacts";

        if (style === 'boudoir') {
          const boudoirConfig = styleConfigs.boudoir[gender as 'man' | 'woman'] || styleConfigs.boudoir.man;
          enhancedPrompt = `${prompt}, ${boudoirConfig.prompt}`;
          finalNegativePrompt = boudoirConfig.negativePrompt;
        } else {
          const styleConfig = styleConfigs[style as 'professional' | 'doctor'] || styleConfigs.professional;
          enhancedPrompt = `${prompt}, ${styleConfig.prompt}`;
          finalNegativePrompt = styleConfig.negativePrompt;
        }

        // Use custom negative prompt if provided, otherwise use style default
        if (negative_prompt) {
          finalNegativePrompt = negative_prompt;
        }

        console.log("🍌 Using nano banana generation model");
        console.log("🎨 Enhanced prompt:", enhancedPrompt);
        console.log("🚫 Negative prompt:", finalNegativePrompt);

        // Call Astria API to generate images with nano banana model
        const response = await fetch(`https://api.astria.ai/tunes/${model.astria_model_id}/prompts`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${ASTRIA_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: {
              text: enhancedPrompt,
              negative_prompt: finalNegativePrompt,
              num_images: num_images,
              callback: `${SUPABASE_URL}/functions/v1/astria-webhook`,
              // Nano banana generation parameters
              w: 768,
              h: 1024,
              steps: 25,
              cfg_scale: 7,
              seed: -1,
              controlnet: "canny",
              controlnet_conditioning_scale: 0.8,
              controlnet_txt2img: true,
              use_lpw: true,
              use_upscaler: true,
              upscaler_strength: 0.1,
              super_resolution: true,
              // Enable nano banana model
              face_correct: true,
              face_swap: false,
              inpaint_faces: true,
              restore_faces: true,
              // Nano banana specific optimizations
              hires_fix: true,
              enable_attention_slicing: true,
              enable_vae_slicing: true,
              // Force nano banana backend selection
              backend: "nano-banana",
              model_type: "nano-banana-v2"
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Astria API error:", response.status, errorText);
          return new Response(
            JSON.stringify({ error: "Failed to generate images", details: errorText }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const astriaData = await response.json();
        console.log("✅ Astria image generation started:", astriaData);

        // Create image records in database
        const imageRecords = Array.from({ length: num_images }, (_, i) => ({
          model_id: model_id,
          user_id: user.id,
          prompt: prompt,
          status: "generating",
          astria_image_id: astriaData.images?.[i]?.id || null,
        }));

        const { data: dbImages, error: imagesError } = await supabase
          .from("images")
          .insert(imageRecords)
          .select();

        if (imagesError) {
          console.error("❌ Database error saving images:", imagesError);
        }

        // Deduct credits
        const { error: creditUpdateError } = await supabase
          .from("credits")
          .update({ credits: credits.credits - num_images })
          .eq("user_id", user.id);

        if (creditUpdateError) {
          console.error("❌ Failed to deduct credits:", creditUpdateError);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            images: dbImages, 
            astriaPrompt: astriaData,
            credits_remaining: credits.credits - num_images 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "check_status": {
        const { tune_id } = params;

        if (!tune_id) {
          return new Response(
            JSON.stringify({ error: "Missing tune_id parameter" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Call Astria API to check status
        const response = await fetch(`https://api.astria.ai/tunes/${tune_id}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${ASTRIA_API_KEY}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Astria API error:", response.status, errorText);
          return new Response(
            JSON.stringify({ error: "Failed to check status", details: errorText }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const statusData = await response.json();
        
        return new Response(
          JSON.stringify({ success: true, status: statusData }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list_models": {
        // Enhanced logging for debugging
        console.log("🔍 === LIST_MODELS DEBUG START ===");
        console.log("🔍 User ID:", user.id);
        console.log("🔍 ASTRIA_API_KEY exists:", !!ASTRIA_API_KEY);
        console.log("🔍 ASTRIA_API_KEY length:", ASTRIA_API_KEY ? ASTRIA_API_KEY.length : 0);
        console.log("🔍 ASTRIA_API_KEY first 10 chars:", ASTRIA_API_KEY ? ASTRIA_API_KEY.substring(0, 10) + "..." : "null");
        
        // Validate API key format
        if (ASTRIA_API_KEY && !ASTRIA_API_KEY.startsWith('sd_')) {
          console.warn("⚠️ ASTRIA_API_KEY does not start with 'sd_' - may be invalid format");
        }
        
        const apiUrl = "https://api.astria.ai/tunes";
        console.log("🔍 API URL:", apiUrl);
        
        const headers = {
          "Authorization": `Bearer ${ASTRIA_API_KEY}`,
          "Content-Type": "application/json",
          "User-Agent": "Supabase-Edge-Function/1.0"
        };
        console.log("🔍 Request headers (auth masked):", {
          ...headers,
          "Authorization": `Bearer ${ASTRIA_API_KEY ? ASTRIA_API_KEY.substring(0, 10) + "..." : "null"}`
        });
        
        let response;
        try {
          console.log("🔍 Making API request to Astria...");
          response = await fetch(apiUrl, {
            method: "GET",
            headers,
          });
          console.log("🔍 API request completed");
        } catch (fetchError) {
          console.error("❌ Network error calling Astria API:", fetchError);
          const errMsg = fetchError instanceof Error ? fetchError.message : 'Unknown error';
          return new Response(
            JSON.stringify({ 
              error: "Network error connecting to Astria API", 
              details: errMsg,
              apiKeyConfigured: !!ASTRIA_API_KEY
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("🔍 Astria API response status:", response.status);
        console.log("🔍 Astria API response status text:", response.statusText);
        console.log("🔍 Astria API response headers:", Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          let errorText;
          let errorData;
          
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              errorData = await response.json();
              errorText = JSON.stringify(errorData);
              console.error("❌ Astria API JSON error:", errorData);
            } else {
              errorText = await response.text();
              console.error("❌ Astria API text error:", errorText);
            }
          } catch (parseError) {
            console.error("❌ Error parsing Astria API error response:", parseError);
            const errMsg = parseError instanceof Error ? parseError.message : 'Unknown error';
            errorText = `Failed to parse error response: ${errMsg}`;
          }
          
          console.error("❌ Complete Astria API error details:", {
            status: response.status,
            statusText: response.statusText,
            errorText,
            errorData,
            url: apiUrl,
            apiKeyConfigured: !!ASTRIA_API_KEY,
            apiKeyFormat: ASTRIA_API_KEY ? ASTRIA_API_KEY.substring(0, 3) + "..." : "null"
          });
          
          // Provide specific error messages based on status codes
          let userFriendlyError = "Failed to fetch models";
          if (response.status === 401) {
            userFriendlyError = "Authentication failed - API key may be invalid";
          } else if (response.status === 403) {
            userFriendlyError = "Access forbidden - API key may lack permissions";
          } else if (response.status === 429) {
            userFriendlyError = "Rate limit exceeded - please try again later";
          } else if (response.status >= 500) {
            userFriendlyError = "Astria API server error - please try again";
          }
          
          return new Response(
            JSON.stringify({ 
              error: userFriendlyError,
              details: errorText,
              status: response.status,
              apiKeyConfigured: !!ASTRIA_API_KEY,
              timestamp: new Date().toISOString()
            }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let models;
        try {
          console.log("🔍 Parsing successful response...");
          models = await response.json();
          console.log("✅ Response parsed successfully");
        } catch (parseError) {
          console.error("❌ Failed to parse successful response:", parseError);
          const errMsg = parseError instanceof Error ? parseError.message : 'Unknown error';
          return new Response(
            JSON.stringify({ 
              error: "Invalid response format from Astria API", 
              details: errMsg,
              apiKeyConfigured: !!ASTRIA_API_KEY
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log("✅ Fetched Astria models:", models);
        console.log("🔍 Models type:", typeof models);
        console.log("🔍 Is array?:", Array.isArray(models));
        console.log("🔍 Number of models:", Array.isArray(models) ? models.length : "not an array");
        
        if (Array.isArray(models)) {
          console.log("🔍 Model details:", models.map((m, i) => ({
            index: i,
            id: m.id,
            name: m.name || m.title,
            status: m.status,
            created_at: m.created_at,
            updated_at: m.updated_at
          })));
          
          // Look for the specific model
          const targetModel = models.find(m => 
            (m.name && m.name.toLowerCase().includes('newheadhotman')) ||
            (m.title && m.title.toLowerCase().includes('newheadhotman'))
          );
          
          if (targetModel) {
            console.log("🎯 Found target 'newheadhotman' model:", targetModel);
          } else {
            console.log("⚠️ Target 'newheadhotman' model not found");
            console.log("🔍 Available model names:", models.map(m => m.name || m.title));
          }
        } else {
          console.warn("⚠️ Response is not an array, unexpected format:", models);
        }
        
        console.log("🔍 === LIST_MODELS DEBUG END ===");
        
        return new Response(
          JSON.stringify({ success: true, models: models }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use: train_model, generate_image, check_status, or list_models" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("❌ Edge function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});