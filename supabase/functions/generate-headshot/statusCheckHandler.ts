import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "./utils.ts";

interface StatusCheckParams {
  tune_id?: string;
}

interface User {
  id: string;
  email?: string;
}

export async function statusCheckHandler(
  body: any,
  user: User,
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  geminiApiKey: string,
): Promise<Response> {
  try {
    // Body is already parsed in index.ts and contains action + params
    const { action, ...params } = body;

    switch (action) {
      case "check_status": {
        // With Gemini, there's no model training status to check
        // Gemini generates images directly without training custom models
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Gemini image generation does not require model training",
            generation_mode: "gemini",
            model: "gemini-2.0-flash-exp"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list_models": {
        // With Gemini, there are no custom models to list
        // Gemini uses the built-in image generation model
        console.log("🔍 === LIST_MODELS (Gemini Mode) ===");
        console.log("ℹ️ Using Gemini for image generation - no custom models needed");

        return new Response(
          JSON.stringify({ 
            success: true, 
            models: [],
            message: "Gemini image generation uses built-in model (gemini-2.0-flash-exp). No custom model training required.",
            generation_mode: "gemini"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action for statusCheckHandler" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("❌ statusCheckHandler error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error in statusCheckHandler", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
