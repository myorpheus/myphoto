#!/bin/bash
# Get tune_id for "new Ru man" model from Astria API

echo "🔍 Fetching existing Astria models..."
echo ""

# Get ASTRIA_API_KEY from Supabase secrets
ASTRIA_API_KEY=$(supabase secrets list | grep ASTRIA_API_KEY | awk '{print $3}')

if [ -z "$ASTRIA_API_KEY" ]; then
  echo "❌ ERROR: Could not get ASTRIA_API_KEY from Supabase secrets"
  echo "Run manually: supabase secrets list"
  exit 1
fi

echo "✅ API Key found (length: ${#ASTRIA_API_KEY})"
echo ""

# Call Astria API to list models
echo "📡 Calling: GET https://api.astria.ai/tunes"
echo ""

RESPONSE=$(curl -s -H "Authorization: Bearer ${ASTRIA_API_KEY}" https://api.astria.ai/tunes)

echo "📊 Raw response:"
echo "$RESPONSE" | jq '.'
echo ""

# Search for "new Ru man" model
echo "🔍 Searching for 'new Ru man' model..."
echo ""

TUNE_ID=$(echo "$RESPONSE" | jq -r '.[] | select(.title == "new Ru man" or .name | contains("new Ru man")) | .id' | head -1)

if [ -z "$TUNE_ID" ]; then
  echo "❌ Model 'new Ru man' not found!"
  echo ""
  echo "Available models:"
  echo "$RESPONSE" | jq -r '.[] | "  ID: \(.id) | Title: \(.title) | Name: \(.name) | Status: \(.status)"'
  exit 1
fi

echo "✅ Found 'new Ru man' model!"
echo ""
echo "📦 Model Details:"
echo "$RESPONSE" | jq --arg id "$TUNE_ID" '.[] | select(.id == ($id | tonumber))'
echo ""
echo "🎯 TUNE_ID: $TUNE_ID"
echo ""
echo "✅ You can now use this tune_id to generate images:"
echo ""
echo "curl -X POST \"https://api.astria.ai/tunes/${TUNE_ID}/prompts\" \\"
echo "  -H \"Authorization: Bearer \${ASTRIA_API_KEY}\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"prompt\": {"
echo "      \"text\": \"ohwx man in business suit\","
echo "      \"negative_prompt\": \"blurry, low quality\","
echo "      \"num_images\": 4"
echo "    }"
echo "  }'"
