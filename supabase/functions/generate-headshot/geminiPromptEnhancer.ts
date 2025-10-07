// supabase/functions/generate-headshot/geminiPromptEnhancer.ts
// Gemini 2.5 Flash integration for Astria prompt enhancement

interface PromptEnhancementResult {
  enhancedPrompt: string;
  originalPrompt: string;
  wasEnhanced: boolean;
  error?: string;
}

/**
 * Enhances an Astria prompt using Google Gemini 2.5 Flash
 * Optimizes prompts specifically for Astria's nano banana model
 */
export async function enhancePromptWithGemini(
  basePrompt: string,
  style: string,
  gender?: string
): Promise<PromptEnhancementResult> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

  // If no API key, return original prompt
  if (!GEMINI_API_KEY) {
    console.log("⚠️ GEMINI_API_KEY not configured, using original prompt");
    return {
      enhancedPrompt: basePrompt,
      originalPrompt: basePrompt,
      wasEnhanced: false,
      error: "API key not configured"
    };
  }

  try {
    console.log("🤖 Enhancing prompt with Gemini 2.5 Flash...");
    console.log("📝 Original prompt:", basePrompt);
    console.log("🎨 Style:", style);
    if (gender) console.log("👤 Gender:", gender);

    // Build context-aware system prompt
    const systemPrompt = `You are an expert at creating Astria AI prompts for professional headshots.
Your task is to enhance prompts specifically for Astria's nano banana model.

Guidelines:
- Keep prompts concise and descriptive
- Focus on lighting, composition, and professional quality
- Include relevant style-specific details
- Avoid redundant or conflicting terms
- Optimize for photorealistic results
- Return ONLY the enhanced prompt text, no explanations

Current style: ${style}${gender ? `, Gender: ${gender}` : ''}`;

    const userPrompt = `Enhance this Astria prompt for ${style} style headshots: "${basePrompt}"

Return only the optimized prompt text.`;

    // Call Google Gemini API
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
                  text: `${systemPrompt}\n\n${userPrompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
            topP: 0.95,
            topK: 40
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API error: ${response.status} ${response.statusText}`);
      console.error("Error details:", errorText);

      // Return original prompt as fallback
      return {
        enhancedPrompt: basePrompt,
        originalPrompt: basePrompt,
        wasEnhanced: false,
        error: `API error: ${response.status}`
      };
    }

    const data = await response.json();

    // Extract enhanced prompt from Gemini response
    const enhancedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || basePrompt;

    console.log("✅ Enhanced prompt:", enhancedPrompt);
    console.log("📊 Tokens used:", data.usageMetadata?.totalTokenCount || "unknown");

    return {
      enhancedPrompt,
      originalPrompt: basePrompt,
      wasEnhanced: true
    };

  } catch (error) {
    console.error("❌ Error enhancing prompt with Gemini:", error);

    // Always fall back to original prompt on error
    return {
      enhancedPrompt: basePrompt,
      originalPrompt: basePrompt,
      wasEnhanced: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Checks if Gemini API is available and configured
 */
export function isGeminiAvailable(): boolean {
  return !!Deno.env.get("GEMINI_API_KEY");
}
