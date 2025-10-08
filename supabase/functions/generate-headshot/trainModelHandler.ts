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
  req: Request,
  user: User,
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  astriaApiKey: string,
) {
  try {
    const { name, images, steps = 500, face_crop = true } = (await req.json()) as TrainModelParams;

    // Validate inputs
    if (!name || !images || images.length < 4 || images.length > 20) {
      return new Response(
        JSON.stringify({ error: "Invalid training parameters. Need 4-20 images." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Call Astria API to create a tune (model)
    const response = await fetch("https://api.astria.ai/tunes", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${astriaApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Astria API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to start model training", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const astriaData = await response.json();
    console.log("✅ Astria model created:", astriaData);

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
      console.error("❌ Database error saving model:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save model to database", details: dbError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, model: dbModel, astriaModel: astriaData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ trainModelHandler error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error in trainModelHandler", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}