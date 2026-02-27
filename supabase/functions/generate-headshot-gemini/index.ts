// Edge Function - Gemini 2.0 Flash EXP Image Generation
// Uses Google's Gemini experimental model for direct image generation
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateImageBody {
  prompt: string;
  num_images?: number;
  aspect_ratio?: string;
  quality?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
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

    // Parse request body
    const body: GenerateImageBody = await req.json();
    const { prompt, num_images = 1, aspect_ratio = "1:1", quality = "standard" } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🎨 Generating image with Gemini 2.0 Flash EXP for user ${user.id}`);
    console.log(`📝 Prompt: ${prompt}`);

    // Map aspect ratio to Gemini format
    const aspectRatioMap: Record<string, string> = {
      "1:1": "1:1",
      "16:9": "16:9",
      "9:16": "9:16",
      "4:3": "4:3",
      "3:4": "3:4"
    };
    const geminiAspectRatio = aspectRatioMap[aspect_ratio] || "1:1";

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

    // Call Gemini 2.0 Flash EXP API for image generation
    // Using the image generation endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
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
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2048,
            topP: 0.95,
            topK: 40
          },
          // Image generation specific config
          // Note: Gemini 2.0 Flash EXP uses different parameters for image generation
          responseModalities: ["image", "text"],
          responseMimeType: "image/png"
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gemini API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate image", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("✅ Gemini response received");

    // Extract generated image from response
    // Gemini returns images in base64 in the response
    const generatedImages: Array<{image: string; mimeType: string}> = [];
    
    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          generatedImages.push({
            image: part.inlineData.data,
            mimeType: part.inlineData.mimeType || "image/png"
          });
        }
      }
    }

    if (generatedImages.length === 0) {
      console.error("❌ No images generated in response");
      console.log("Full response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "No images generated", details: "Gemini did not return any images" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store images in Supabase storage
    const storedImages = [];
    
    for (let i = 0; i < generatedImages.length; i++) {
      const img = generatedImages[i];
      const imageBuffer = Uint8Array.from(atob(img.image), c => c.charCodeAt(0));
      
      const fileName = `${user.id}/gemini-${Date.now()}-${i}.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, imageBuffer, {
          contentType: "image/png",
          upsert: true
        });

      if (uploadError) {
        console.error("❌ Storage upload error:", uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);

      storedImages.push({
        storage_path: fileName,
        public_url: urlData.publicUrl,
        mime_type: img.mimeType
      });

      // Create image record in database
      await supabase.from("images").insert({
        user_id: user.id,
        prompt: prompt,
        status: "completed",
        image_url: urlData.publicUrl,
        // Note: Gemini doesn't have an astria_image_id equivalent
      });
    }

    // Deduct credits
    await supabase
      .from("credits")
      .update({ credits: credits.credits - num_images })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        images: storedImages,
        credits_remaining: credits.credits - num_images,
        model: "gemini-2.0-flash-exp"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Edge function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
