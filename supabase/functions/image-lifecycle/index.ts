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

    const { action } = await req.json();

    console.log(`🕐 Processing image lifecycle action: ${action}`);

    switch (action) {
      case "cleanup_expired": {
        // Find images older than 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        const { data: expiredImages, error: fetchError } = await supabase
          .from("images")
          .select("id, url, user_id, created_at")
          .lt("created_at", oneHourAgo)
          .eq("status", "completed");

        if (fetchError) {
          console.error("❌ Error fetching expired images:", fetchError);
          return new Response(
            JSON.stringify({ error: "Failed to fetch expired images", details: fetchError }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!expiredImages || expiredImages.length === 0) {
          console.log("✅ No expired images found for cleanup");
          return new Response(
            JSON.stringify({ success: true, message: "No expired images to clean up", cleaned: 0 }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`🧹 Found ${expiredImages.length} expired images to clean up`);

        let cleanedCount = 0;
        const errors = [];

        // Delete each expired image
        for (const image of expiredImages) {
          try {
            // Delete from database
            const { error: deleteError } = await supabase
              .from("images")
              .delete()
              .eq("id", image.id);

            if (deleteError) {
              console.error(`❌ Failed to delete image ${image.id}:`, deleteError);
              errors.push(`Failed to delete image ${image.id}: ${deleteError.message}`);
              continue;
            }

            // Note: In production, you might also want to delete from storage bucket
            // if images are stored in Supabase Storage
            // const { error: storageError } = await supabase.storage
            //   .from('images')
            //   .remove([image.url]);

            cleanedCount++;
            console.log(`✅ Cleaned up image ${image.id} (created: ${image.created_at})`);
          } catch (error) {
            const errorMsg = `Unexpected error cleaning image ${image.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error("❌", errorMsg);
            errors.push(errorMsg);
          }
        }

        console.log(`🎉 Cleanup completed: ${cleanedCount} images cleaned, ${errors.length} errors`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            cleaned: cleanedCount, 
            errors: errors.length > 0 ? errors : undefined,
            message: `Cleaned up ${cleanedCount} expired images`
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_expiring_soon": {
        // Find images that will expire in the next 10 minutes
        const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        const { data: expiringSoonImages, error: fetchError } = await supabase
          .from("images")
          .select("id, url, user_id, created_at, prompt")
          .lt("created_at", tenMinutesFromNow)
          .gt("created_at", oneHourAgo)
          .eq("status", "completed");

        if (fetchError) {
          console.error("❌ Error fetching expiring images:", fetchError);
          return new Response(
            JSON.stringify({ error: "Failed to fetch expiring images", details: fetchError }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const imagesWithTimeLeft = (expiringSoonImages || []).map(image => {
          const createdAt = new Date(image.created_at);
          const expiresAt = new Date(createdAt.getTime() + 60 * 60 * 1000); // 1 hour later
          const timeLeftMs = expiresAt.getTime() - Date.now();
          const timeLeftMinutes = Math.max(0, Math.floor(timeLeftMs / (60 * 1000)));
          
          return {
            ...image,
            expires_at: expiresAt.toISOString(),
            time_left_minutes: timeLeftMinutes
          };
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            expiring_images: imagesWithTimeLeft,
            count: imagesWithTimeLeft.length
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "extend_image_life": {
        // Extend an image's life by updating its created_at timestamp
        const { image_id, user_id } = await req.json();

        if (!image_id || !user_id) {
          return new Response(
            JSON.stringify({ error: "Missing required parameters: image_id and user_id" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update the image's created_at to current time (extends life by 1 hour)
        const { data: updatedImage, error: updateError } = await supabase
          .from("images")
          .update({ created_at: new Date().toISOString() })
          .eq("id", image_id)
          .eq("user_id", user_id)
          .select()
          .single();

        if (updateError) {
          console.error(`❌ Failed to extend image life for ${image_id}:`, updateError);
          return new Response(
            JSON.stringify({ error: "Failed to extend image life", details: updateError }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!updatedImage) {
          return new Response(
            JSON.stringify({ error: "Image not found or access denied" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`⏰ Extended life for image ${image_id}`);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            image: updatedImage,
            message: "Image life extended by 1 hour"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_image_expiry": {
        // Get expiry information for a specific image
        const { image_id, user_id } = await req.json();

        if (!image_id) {
          return new Response(
            JSON.stringify({ error: "Missing required parameter: image_id" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: image, error: fetchError } = await supabase
          .from("images")
          .select("id, created_at, status")
          .eq("id", image_id)
          .eq("user_id", user_id || "")
          .single();

        if (fetchError || !image) {
          return new Response(
            JSON.stringify({ error: "Image not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const createdAt = new Date(image.created_at);
        const expiresAt = new Date(createdAt.getTime() + 60 * 60 * 1000); // 1 hour later
        const timeLeftMs = expiresAt.getTime() - Date.now();
        const timeLeftMinutes = Math.max(0, Math.floor(timeLeftMs / (60 * 1000)));
        const isExpired = timeLeftMs <= 0;

        return new Response(
          JSON.stringify({ 
            success: true, 
            image_id: image.id,
            created_at: image.created_at,
            expires_at: expiresAt.toISOString(),
            time_left_minutes: timeLeftMinutes,
            is_expired: isExpired,
            status: image.status
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use: cleanup_expired, get_expiring_soon, extend_image_life, or get_image_expiry" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("❌ Image lifecycle function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});