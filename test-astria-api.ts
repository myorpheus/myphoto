// Test script to diagnose Astria API 422 error
// This sends a minimal request to Astria API to isolate the issue

// Tiny 1x1 red pixel JPEG (only 631 bytes)
const tinyTestImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

const ASTRIA_API_KEY = Deno.env.get("ASTRIA_API_KEY") || "your-api-key-here";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://imzlzufdujhcbebibgpj.supabase.co";

// Test with 4 copies of the same tiny image (meeting 4-20 requirement)
const testImages = [
  tinyTestImage,
  tinyTestImage,
  tinyTestImage,
  tinyTestImage,
];

const requestBody = {
  tune: {
    title: "Test Model",
    name: `test_model_${Date.now()}`,
    callback: `${SUPABASE_URL}/functions/v1/astria-webhook`,
  },
  images: testImages,
  steps: 500,
  face_crop: true,
};

console.log("🧪 Testing Astria API with minimal request");
console.log(`📊 Request details:`);
console.log(`  - Images count: ${testImages.length}`);
console.log(`  - First image length: ${testImages[0].length}`);
console.log(`  - First image prefix: ${testImages[0].substring(0, 30)}`);
console.log(`  - Total payload size: ${JSON.stringify(requestBody).length} bytes`);
console.log(`  - API Key length: ${ASTRIA_API_KEY.length}`);
console.log("");

try {
  console.log("🚀 Sending request to https://api.astria.ai/tunes");
  const response = await fetch("https://api.astria.ai/tunes", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ASTRIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  console.log(`📨 Response status: ${response.status}`);

  const responseText = await response.text();
  console.log(`📄 Response body: ${responseText}`);

  if (response.ok) {
    console.log("✅ SUCCESS! Astria API accepted the request");
    const data = JSON.parse(responseText);
    console.log(`📦 Created tune ID: ${data.id}`);
  } else {
    console.log("❌ FAILED! Astria API rejected the request");
    console.log("🔍 This confirms the issue is with the request format or API key");
  }
} catch (error) {
  console.error("❌ Error:", error);
}
