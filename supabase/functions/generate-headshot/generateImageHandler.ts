import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "./utils.ts";
import { enhancePromptWithGemini, isGeminiAvailable } from "./geminiPromptEnhancer.ts";

interface GenerateImageParams {
  model_id: string;
  prompt: string;
  custom_prompt?: string;
  num_images?: number;
  style?: string;
  gender?: string;
  negative_prompt?: string;
}

interface User {
  id: string;
  email: string;
}

export async function generateImageHandler(
  req: Request,
  user: User,
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  astriaApiKey: string,
): Promise<Response> {
  try {
    const { model_id, prompt, custom_prompt, num_images = 4, style = 'professional', gender = 'man', negative_prompt } = await req.json() as GenerateImageParams;

    if (!model_id || !prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: model_id and prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get model from database to get Astria model ID
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("id", model_id)
      .eq("user_id", user.id)
      .single();

    if (modelError || !model) {
      console.error("❌ Model not found or access denied:", modelError);
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
      console.error("❌ Insufficient credits:", creditsError);
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

    // 🎨 CUSTOM PROMPT INJECTION
    // Add user's custom prompt text if provided
    if (custom_prompt && custom_prompt.trim()) {
      enhancedPrompt = `${enhancedPrompt}, ${custom_prompt.trim()}`;
      console.log("🎨 Custom prompt added:", custom_prompt);
    }

    // 🤖 GEMINI 2.5 FLASH ENHANCEMENT
    // Enhance prompt with Google Gemini if API key is available
    if (isGeminiAvailable()) {
      console.log("🤖 Gemini 2.5 Flash available - enhancing prompt...");
      const geminiResult = await enhancePromptWithGemini(enhancedPrompt, style, gender);

      if (geminiResult.wasEnhanced) {
        console.log("✅ Gemini enhancement successful");
        console.log("📝 Original:", geminiResult.originalPrompt);
        console.log("🚀 Enhanced:", geminiResult.enhancedPrompt);
        enhancedPrompt = geminiResult.enhancedPrompt;
      } else {
        console.log("⚠️ Gemini enhancement skipped:", geminiResult.error || "Unknown reason");
      }
    } else {
      console.log("ℹ️ Gemini API not configured - using style-based prompts only");
    }

    console.log("🍌 Using nano banana generation model");
    console.log("🎨 Final prompt:", enhancedPrompt);
    console.log("🚫 Negative prompt:", finalNegativePrompt);

    // Call Astria API to generate images with nano banana model
    const response = await fetch(`https://api.astria.ai/tunes/${model.astria_model_id}/prompts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${astriaApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: {
          text: enhancedPrompt,
          negative_prompt: finalNegativePrompt,
          num_images: num_images,
          callback: `${supabaseUrl}/functions/v1/astria-webhook`,
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
  } catch (error) {
    console.error("❌ generateImageHandler error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error in generateImageHandler", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}