// Test Edge Function with "new Ru man" model
// Run with: node test-edge-function-new-ru-man.js

const https = require('https');

// Configuration from .env or hardcode for testing
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://imzlzufdujhcbebibgpj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Get auth token from command line
const AUTH_TOKEN = process.argv[2];

if (!AUTH_TOKEN) {
  console.error("❌ ERROR: Auth token required");
  console.error("");
  console.error("Get auth token from Supabase:");
  console.error("1. Go to: https://supabase.com/dashboard/project/imzlzufdujhcbebibgpj/auth/users");
  console.error("2. Create or select a test user");
  console.error("3. Click 'Generate Access Token' or use existing token");
  console.error("");
  console.error("Usage: node test-edge-function-new-ru-man.js <AUTH_TOKEN>");
  process.exit(1);
}

// Tiny 1x1 red pixel JPEG (631 bytes) - 4 copies to meet 4-20 image requirement
const tinyTestImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

const requestBody = {
  action: "train_model",
  name: "new Ru man",
  images: [
    tinyTestImage,
    tinyTestImage,
    tinyTestImage,
    tinyTestImage,
  ],
  steps: 500,
  face_crop: true,
};

const postData = JSON.stringify(requestBody);

console.log("🧪 Testing Edge Function - Model: 'new Ru man'");
console.log(`📊 Request details:`);
console.log(`  - Model name: new Ru man`);
console.log(`  - Images count: 4`);
console.log(`  - First image length: ${tinyTestImage.length} chars`);
console.log(`  - Total payload size: ${postData.length} bytes`);
console.log(`  - Auth token length: ${AUTH_TOKEN.length}`);
console.log(`  - Supabase URL: ${SUPABASE_URL}`);
console.log("");

const url = new URL(`${SUPABASE_URL}/functions/v1/generate-headshot`);

const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

if (SUPABASE_ANON_KEY) {
  options.headers['apikey'] = SUPABASE_ANON_KEY;
}

console.log("🚀 Sending request to Edge Function");
console.log(`   ${url.href}`);
console.log("");

const req = https.request(options, (res) => {
  console.log(`📨 Response status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`📨 Response headers:`, JSON.stringify(res.headers, null, 2));
  console.log("");

  let responseBody = '';

  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    console.log(`📄 Response body:`);

    try {
      const data = JSON.parse(responseBody);
      console.log(JSON.stringify(data, null, 2));

      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log("");
        console.log("✅ SUCCESS! Edge Function accepted the request");
        if (data.model) {
          console.log(`📦 Model ID: ${data.model.id}`);
          console.log(`📦 Astria tune ID: ${data.model.astria_model_id}`);
          console.log(`📦 Status: ${data.model.status}`);
        }
        if (data.astriaModel) {
          console.log(`📦 Astria response: ${JSON.stringify(data.astriaModel, null, 2)}`);
        }
      } else {
        console.log("");
        console.log("❌ FAILED! Edge Function returned an error");
        console.log(`🔍 Status code: ${res.statusCode}`);
        if (data.error) {
          console.log(`🔍 Error: ${data.error}`);
        }
        if (data.details) {
          console.log(`🔍 Details: ${JSON.stringify(data.details, null, 2)}`);
        }
      }
    } catch (e) {
      console.log(responseBody);
      console.log("");
      console.log("⚠️ Could not parse response as JSON");
    }
  });
});

req.on('error', (error) => {
  console.error("❌ Request error:", error.message);
  console.error(error);
});

req.write(postData);
req.end();
