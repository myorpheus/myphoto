#!/bin/bash
# Test script to get tune_id via Supabase edge function

echo "Testing Astria API via edge function..."
echo ""

# This will use the ASTRIA_API_KEY stored in Supabase
supabase functions invoke generate-headshot \
  --project-ref imzlzufdujhcbebibgpj \
  --body '{"action":"list_models"}' \
  --header "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
