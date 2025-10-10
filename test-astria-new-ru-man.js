// Test Astria API with model "new Ru man"
// Run with: node test-astria-new-ru-man.js

const https = require('https');

// Tiny 1x1 red pixel JPEG (631 bytes)
const tinyTestImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

// Get API key from command line or environment
const ASTRIA_API_KEY = process.argv[2] || process.env.ASTRIA_API_KEY;

if (!ASTRIA_API_KEY) {
  console.error("❌ ERROR: ASTRIA_API_KEY not provided");
  console.error("Usage: node test-astria-new-ru-man.js <API_KEY>");
  console.error("   or: ASTRIA_API_KEY=<key> node test-astria-new-ru-man.js");
  process.exit(1);
}

// Test with 4 copies of the tiny image (meeting 4-20 requirement)
const testImages = [
  tinyTestImage,
  tinyTestImage,
  tinyTestImage,
  tinyTestImage,
];

const requestBody = {
  tune: {
    title: "new Ru man",
    name: `new Ru man ${Date.now()}`,
    callback: "https://imzlzufdujhcbebibgpj.supabase.co/functions/v1/astria-webhook",
  },
  images: testImages,
  steps: 500,
  face_crop: true,
};

const postData = JSON.stringify(requestBody);

console.log("🧪 Testing Astria API - Model: 'new Ru man'");
console.log(`📊 Request details:`);
console.log(`  - Model name: new Ru man ${Date.now()}`);
console.log(`  - Images count: ${testImages.length}`);
console.log(`  - First image length: ${testImages[0].length} chars`);
console.log(`  - Total payload size: ${postData.length} bytes`);
console.log(`  - API Key length: ${ASTRIA_API_KEY.length}`);
console.log(`  - API Key prefix: ${ASTRIA_API_KEY.substring(0, 10)}...`);
console.log("");

const options = {
  hostname: 'api.astria.ai',
  port: 443,
  path: '/tunes',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ASTRIA_API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log("🚀 Sending request to https://api.astria.ai/tunes");
console.log("");

const req = https.request(options, (res) => {
  console.log(`📨 Response status: ${res.statusCode}`);
  console.log(`📨 Response headers:`, JSON.stringify(res.headers, null, 2));
  console.log("");

  let responseBody = '';

  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    console.log(`📄 Response body:`);
    console.log(responseBody);
    console.log("");

    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log("✅ SUCCESS! Astria API accepted the request");
      try {
        const data = JSON.parse(responseBody);
        console.log(`📦 Created tune ID: ${data.id}`);
        console.log(`📦 Status: ${data.status}`);
        console.log(`📦 Full response:`, JSON.stringify(data, null, 2));
      } catch (e) {
        console.log("⚠️ Could not parse response as JSON");
      }
    } else {
      console.log("❌ FAILED! Astria API rejected the request");
      console.log(`🔍 Status code: ${res.statusCode}`);
      try {
        const errorData = JSON.parse(responseBody);
        console.log("🔍 Error details:", JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log("🔍 Raw error:", responseBody);
      }
    }
  });
});

req.on('error', (error) => {
  console.error("❌ Request error:", error.message);
  console.error(error);
});

req.write(postData);
req.end();
