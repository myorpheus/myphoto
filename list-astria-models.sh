#!/bin/bash
# Simple script to list Astria models

echo "Getting ASTRIA_API_KEY..."
ASTRIA_API_KEY=$(supabase secrets list | grep ASTRIA_API_KEY | awk '{print $3}')

echo "API Key length: ${#ASTRIA_API_KEY}"
echo ""
echo "Fetching models from Astria API..."
echo ""

curl -H "Authorization: Bearer ${ASTRIA_API_KEY}" https://api.astria.ai/tunes
