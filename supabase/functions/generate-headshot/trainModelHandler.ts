import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "./utils.ts";

interface TrainModelParams {
  name: string;
  images: string[];
  steps?: number;
  face_crop?: boolean;
}

interface User {
  id: string;
  email?: string;
}

export async function trainModelHandler(
  body: TrainModelParams,
  user: User,
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  geminiApiKey: string,
) {
  try {
    // 1. Function entry confirmation
    console.log("➡️ trainModelHandler: Function entry");

    // 2. Gemini mode - no model training needed
    console.log(`🔑 trainModelHandler: Gemini mode - no model training required`);
    console.log(`🔑 trainModelHandler: GEMINI_API_KEY available: ${!!geminiApiKey}`);

    // Body is already parsed in index.ts, so just destructure it
    const { name, images, steps = 500, face_crop = true } = body;

    // 3. Request parameters received
    console.log(`📋 trainModelHandler: Request parameters received: ${JSON.stringify({ name, imageCount: images?.length, steps, face_crop })}`);

    // With Gemini, we don't need to train custom models
    // Gemini's image generation model works out of the box
    // However, we can store reference images in the database for personalization if needed
    
    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Save reference images to database for future use (optional personalization)
    // This is a no-op for now since Gemini doesn't require model training
    console.log("💾 trainModelHandler: Gemini mode - storing reference images (optional)");

    if (images && images.length > 0) {
      // Validate images are valid data URLs
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (!image.startsWith('data:image/') || !image.includes(';base64,')) {
          console.warn(`⚠️ trainModelHandler: Image ${i + 1} is not a valid data URL format`);
        }
      }
    }

    // Return success response indicating Gemini doesn't need model training
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Gemini image generation does not require model training. You can now generate headshots directly using the 'generate_image' action.",
        generation_mode: "gemini",
        model: "gemini-2.0-flash-exp",
        note: "Reference images can be stored for future personalization features"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // 7. General error catch
    console.error("❌ trainModelHandler error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error in trainModelHandler", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } finally {
    console.log("🏁 trainModelHandler: Function exit");
  }
}
