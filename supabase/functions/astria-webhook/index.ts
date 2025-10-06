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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ Supabase configuration missing");
      return new Response(
        JSON.stringify({ error: "Database configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const webhookData = await req.json();
    console.log("📥 Astria webhook received:", JSON.stringify(webhookData, null, 2));

    // Handle model training completion
    if (webhookData.type === "tune" || webhookData.tune) {
      const tune = webhookData.tune || webhookData;
      const astriaModelId = tune.id;
      const status = tune.status; // "trained", "training", "failed"

      console.log(`🔄 Updating model ${astriaModelId} status to: ${status}`);

      // Update model status in database
      const { data: updatedModel, error: updateError } = await supabase
        .from("models")
        .update({ 
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("astria_model_id", astriaModelId)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Failed to update model:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update model", details: updateError }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("✅ Model updated successfully:", updatedModel);

      return new Response(
        JSON.stringify({ success: true, message: "Model status updated", model: updatedModel }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle image generation completion
    if (webhookData.type === "prompt" || webhookData.images) {
      const images = webhookData.images || [];
      
      console.log(`📸 Processing ${images.length} generated images`);

      for (const image of images) {
        const imageId = image.id;
        const imageUrl = image.url;
        const status = image.status; // "completed", "processing", "failed"

        // Update image record in database
        const { error: updateError } = await supabase
          .from("images")
          .update({ 
            url: imageUrl,
            status: status === "completed" ? "completed" : status,
            updated_at: new Date().toISOString(),
          })
          .eq("astria_image_id", imageId);

        if (updateError) {
          console.error(`❌ Failed to update image ${imageId}:`, updateError);
        } else {
          console.log(`✅ Image ${imageId} updated successfully`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Images updated", count: images.length }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unknown webhook type
    console.warn("⚠️ Unknown webhook type:", webhookData.type);
    return new Response(
      JSON.stringify({ success: true, message: "Webhook received but not processed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});