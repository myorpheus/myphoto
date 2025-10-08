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
  req: Request,
  user: User,
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  astriaApiKey: string,
): Promise<Response> {
  try {
    const { action, ...params } = await req.json();

    switch (action) {
      case "check_status": {
        const { tune_id } = params as StatusCheckParams;

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
            "Authorization": `Bearer ${astriaApiKey}`,
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
        console.log("🔍 ASTRIA_API_KEY exists:", !!astriaApiKey);
        console.log("🔍 ASTRIA_API_KEY length:", astriaApiKey ? astriaApiKey.length : 0);
        console.log("🔍 ASTRIA_API_KEY first 10 chars:", astriaApiKey ? astriaApiKey.substring(0, 10) + "..." : "null");

        // Validate API key format
        if (astriaApiKey && !astriaApiKey.startsWith('sd_')) {
          console.warn("⚠️ ASTRIA_API_KEY does not start with 'sd_' - may be invalid format");
        }

        const apiUrl = "https://api.astria.ai/tunes";
        console.log("🔍 API URL:", apiUrl);

        const headers = {
          "Authorization": `Bearer ${astriaApiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "Supabase-Edge-Function/1.0"
        };
        console.log("🔍 Request headers (auth masked):", {
          ...headers,
          "Authorization": `Bearer ${astriaApiKey ? astriaApiKey.substring(0, 10) + "..." : "null"}`
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
              apiKeyConfigured: !!astriaApiKey
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
            apiKeyConfigured: !!astriaApiKey,
            apiKeyFormat: astriaApiKey ? astriaApiKey.substring(0, 3) + "..." : "null"
          });

          // Provide specific error messages based on status codes
          let userFriendlyError = "Failed to fetch models";
          if (response.status === 401) {
            userFriendlyError = "Authentication failed - API key may be invalid";
          } else if (response.status === 403) {
            userFriendlyError = "Access forbidden - API key may lack permissions";
          } else if (response.status >= 500) {
            userFriendlyError = "Astria API server error - please try again";
          }

          return new Response(
            JSON.stringify({
              error: userFriendlyError,
              details: errorText,
              status: response.status,
              apiKeyConfigured: !!astriaApiKey,
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
              apiKeyConfigured: !!astriaApiKey
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