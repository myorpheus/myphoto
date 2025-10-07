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

    console.log("🧹 Starting scheduled image cleanup...");

    // Find images older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: expiredImages, error: fetchError } = await supabase
      .from("images")
      .select("id, url, user_id, created_at, status")
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
        JSON.stringify({ 
          success: true, 
          message: "No expired images to clean up", 
          cleaned: 0,
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🧹 Found ${expiredImages.length} expired images to clean up`);

    let cleanedCount = 0;
    const errors = [];

    // Delete expired images in batches for better performance
    const batchSize = 10;
    for (let i = 0; i < expiredImages.length; i += batchSize) {
      const batch = expiredImages.slice(i, i + batchSize);
      const imageIds = batch.map(img => img.id);
      
      try {
        const { error: deleteError } = await supabase
          .from("images")
          .delete()
          .in("id", imageIds);

        if (deleteError) {
          console.error(`❌ Failed to delete batch starting at ${i}:`, deleteError);
          errors.push(`Batch ${i}-${i + batch.length - 1}: ${deleteError.message}`);
          continue;
        }

        cleanedCount += batch.length;
        console.log(`✅ Cleaned up batch: ${batch.length} images (${i + 1}-${i + batch.length})`);
        
        // Log details for each cleaned image
        batch.forEach(img => {
          const ageHours = Math.round((Date.now() - new Date(img.created_at).getTime()) / (60 * 60 * 1000));
          console.log(`  - Image ${img.id}: ${ageHours}h old, user ${img.user_id}`);
        });
        
      } catch (error) {
        const errorMsg = `Unexpected error cleaning batch ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error("❌", errorMsg);
        errors.push(errorMsg);
      }
    }

    // Log cleanup statistics
    console.log(`🎉 Scheduled cleanup completed:`);
    console.log(`  - Total found: ${expiredImages.length}`);
    console.log(`  - Successfully cleaned: ${cleanedCount}`);
    console.log(`  - Errors: ${errors.length}`);
    console.log(`  - Success rate: ${((cleanedCount / expiredImages.length) * 100).toFixed(1)}%`);

    // Log user statistics
    const userStats = expiredImages.reduce((acc, img) => {
      acc[img.user_id] = (acc[img.user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`📊 Images cleaned by user:`);
    Object.entries(userStats).forEach(([userId, count]) => {
      console.log(`  - User ${userId}: ${count} images`);
    });

    // Send notification if there were significant cleanups or errors
    if (cleanedCount > 50 || errors.length > 5) {
      console.log("⚠️  Large cleanup or multiple errors detected - consider review");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        cleaned: cleanedCount, 
        total_found: expiredImages.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Scheduled cleanup: ${cleanedCount} expired images removed`,
        timestamp: new Date().toISOString(),
        user_stats: userStats
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Scheduled cleanup function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        error: "Scheduled cleanup failed", 
        details: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});