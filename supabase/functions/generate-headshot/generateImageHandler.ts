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
  email?: string;
}

export async function generateImageHandler(
  body: GenerateImageParams,
  user: User,
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  geminiApiKey: string,
): Promise<Response> {
  try {
    // Body is already parsed in index.ts, so just destructure it
    const { model_id, prompt, custom_prompt, num_images = 4, style = 'professional', gender = 'man', negative_prompt } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log(`✅ Using Gemini for image generation`);
    console.log(`👤 User: ${user.email || user.id}`);

    // Check user credits - auto-create if not exists
    let { data: credits, error: creditsError } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    if (creditsError && creditsError.code === 'PGRST116') {
      // No credits row — create one with default 10 credits
      console.log("ℹ️ No credits row found, creating with 10 default credits");
      const { data: newCredits, error: insertError } = await supabase
        .from("user_credits")
        .insert({ user_id: user.id, credits: 10 })
        .select("credits")
        .single();
      if (insertError) {
        console.error("❌ Failed to create credits:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to initialize credits" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      credits = newCredits;
      creditsError = null;
    }

    if (creditsError || !credits || credits.credits < num_images) {
      console.error("❌ Insufficient credits:", creditsError || `Have ${credits?.credits || 0}, need ${num_images}`);
      return new Response(
        JSON.stringify({ error: "Insufficient credits", credits_available: credits?.credits || 0 }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate style-specific prompt optimized for Gemini image generation
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

    if (style === 'boudoir') {
      const boudoirConfig = styleConfigs.boudoir[gender as 'man' | 'woman'] || styleConfigs.boudoir.man;
      enhancedPrompt = `${prompt}, ${boudoirConfig.prompt}`;
    } else {
      const styleConfig = styleConfigs[style as 'professional' | 'doctor'] || styleConfigs.professional;
      enhancedPrompt = `${prompt}, ${styleConfig.prompt}`;
    }

    // 🎨 CUSTOM PROMPT INJECTION
    // Add user's custom prompt text if provided
    if (custom_prompt && custom_prompt.trim()) {
      enhancedPrompt = `${enhancedPrompt}, ${custom_prompt.trim()}`;
      console.log("🎨 Custom prompt added:", custom_prompt);
    }

    // 🤖 GEMINI 2.0 FLASH ENHANCEMENT
    // Enhance prompt with Google Gemini if API key is available
    if (isGeminiAvailable()) {
      console.log("🤖 Gemini available - enhancing prompt...");
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

    // Final prompt for Gemini image generation
    const finalPrompt = enhancedPrompt;
    const finalNegativePrompt = negative_prompt || "blurry, low quality, distorted features, artificial artifacts, side profiles";

    console.log("🖼️ Using Gemini image generation");
    console.log("🎨 Final prompt:", finalPrompt);
    console.log("🚫 Negative prompt:", finalNegativePrompt);

    // Generate images using Gemini API
    const generatedImages: Array<{ url: string; prompt: string }> = [];
    const imageRecords: Array<{
      model_id: string | null;
      user_id: string;
      prompt: string;
      url: string;
      status: string;
    }> = [];

    // Generate each image individually (Gemini API generates one at a time)
    for (let i = 0; i < num_images; i++) {
      console.log(`🖼️ Generating image ${i + 1}/${num_images}...`);

      // Call Gemini image generation API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: finalPrompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 8192,
              topP: 0.95,
              topK: 40
            },
            // Gemini image generation specific config
            responseModalities: ["image", "text"]
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Gemini API error for image ${i + 1}:`, response.status, errorText);
        continue; // Skip this image but continue with others
      }

      const data = await response.json();
      console.log(`✅ Gemini image ${i + 1} generated:`, data);

      // Extract image from Gemini response
      // Gemini returns images as base64 in the response
      let imageUrl = "";
      const imageData = data.candidates?.[0]?.content?.parts?.[0];

      if (imageData?.inlineData?.data) {
        // Convert base64 to data URL
        const base64Image = imageData.inlineData.data;
        const mimeType = imageData.inlineData.mimeType || "image/png";
        imageUrl = `data:${mimeType};base64,${base64Image}`;
        
        generatedImages.push({
          url: imageUrl,
          prompt: finalPrompt
        });

        imageRecords.push({
          model_id: model_id || null,
          user_id: user.id,
          prompt: prompt,
          url: imageUrl,
          status: "completed",
        });
      } else {
        // No image in response - may need to handle differently
        console.warn(`⚠️ No image data in Gemini response for image ${i + 1}`);
        
        // Still create a record but mark as failed
        imageRecords.push({
          model_id: model_id || null,
          user_id: user.id,
          prompt: prompt,
          url: "",
          status: "failed"
        });
      }
    }

    // If we have images to save, insert them
    if (imageRecords.length > 0) {
      const { data: dbImages, error: imagesError } = await supabase
        .from("images")
        .insert(imageRecords)
        .select();

      if (imagesError) {
        console.error("❌ Database error saving images:", imagesError);
      }
    }

    // Deduct credits
    const { error: creditUpdateError } = await supabase
      .from("user_credits")
      .update({ credits: credits.credits - num_images })
      .eq("user_id", user.id);

    if (creditUpdateError) {
      console.error("❌ Failed to deduct credits:", creditUpdateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        images: generatedImages,
        credits_remaining: credits.credits - num_images,
        generation_mode: "gemini"
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
