// Edge Function v52 - Headshot Generation with Model Training
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { trainModelHandler } from "./trainModelHandler.ts";
import { generateImageHandler } from "./generateImageHandler.ts";
import { statusCheckHandler } from "./statusCheckHandler.ts";
import { corsHeaders } from "./utils.ts";

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

    // Read body once - cannot be consumed multiple times
    const body = await req.json();
    const { action } = body;

    console.log(`🚀 Processing request: ${action} for user ${user.id}`);

    switch (action) {
      case "train_model":
        return await trainModelHandler(body, user, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ASTRIA_API_KEY);
      case "generate_image":
        return await generateImageHandler(body, user, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ASTRIA_API_KEY);
      case "check_status":
      case "list_models":
        return await statusCheckHandler(body, user, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ASTRIA_API_KEY);
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