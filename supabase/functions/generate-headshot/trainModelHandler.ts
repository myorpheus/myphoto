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
  astriaApiKey: string,
) {
  try {
    // 1. Function entry confirmation
    console.log("➡️ trainModelHandler: Function entry");

    // 2. ASTRIA_API_KEY availability at runtime
    console.log(`🔑 trainModelHandler: ASTRIA_API_KEY availability: ${astriaApiKey ? 'Available' : 'Not Available'}`);

    // Body is already parsed in index.ts, so just destructure it
    const { name, images, steps = 500, face_crop = true } = body;

    // 3. Request parameters received
    console.log(`📋 trainModelHandler: Request parameters received: ${JSON.stringify({ name, imageCount: images.length, steps, face_crop })}`);

    // DEBUG: Log first image preview to verify data URL format
    if (images && images.length > 0) {
      console.log(`🔍 trainModelHandler: First image preview (first 100 chars):`, images[0].substring(0, 100));
    } else {
      console.log(`❌ trainModelHandler: Images array is EMPTY!`);
    }

    // Validate inputs
    if (!name || !images || images.length < 4 || images.length > 20) {
      console.warn("⚠️ trainModelHandler: Invalid training parameters. Need 4-20 images.");
      return new Response(
        JSON.stringify({ error: "Invalid training parameters. Need 4-20 images." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 4. Astria API request details
    const astriaApiRequestBody = {
      tune: {
        title: name,
        // FIXED: Astria API only allows letters, numbers, and spaces (no underscores)
        // Removed underscore, using space instead
        name: `${name} ${Date.now()}`,
        callback: `${supabaseUrl}/functions/v1/astria-webhook`,
      },
      images: images,
      steps: steps,
      face_crop: face_crop,
    };

    console.log(`🌐 trainModelHandler: Astria API request details:
      - URL: https://api.astria.ai/tunes
      - Method: POST
      - Body: ${JSON.stringify(astriaApiRequestBody)}`);

    // Call Astria API to create a tune (model)
    const response = await fetch("https://api.astria.ai/tunes", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${astriaApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(astriaApiRequestBody),
    });

    // 5. Astria API response status
    console.log(`📨 trainModelHandler: Astria API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Astria API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to start model training", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const astriaData = await response.json();
    console.log("✅ trainModelHandler: Astria model created:", astriaData);

    // 6. Database operations - Before insert
    console.log(`💾 trainModelHandler: Database operation - Inserting model data:
      - user_id: ${user.id}
      - astria_model_id: ${astriaData.id}
      - name: ${name}
      - status: ${astriaData.status || "training"}`);

    // Save model to database
    const { data: dbModel, error: dbError } = await supabase
      .from("models")
      .insert({
        user_id: user.id,
        astria_model_id: astriaData.id,
        name: name,
        status: astriaData.status || "training",
      })
      .select()
      .single();

    if (dbError) {
      console.error("❌ trainModelHandler: Database error saving model:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save model to database", details: dbError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Database operations - After insert
    console.log(`✅ trainModelHandler: Database operation - Model inserted successfully. Model data: ${JSON.stringify(dbModel)}`);

    return new Response(
      JSON.stringify({ success: true, model: dbModel, astriaModel: astriaData }),
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