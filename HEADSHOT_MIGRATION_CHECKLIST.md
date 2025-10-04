# Headshot Generator Migration Checklist

## Database Setup - **MUST RUN FIRST**
- [ ] Run the SQL migration in Supabase SQL Editor to create tables:
  - [ ] `models` table (BIGSERIAL id, user_id, astria_model_id, name, status)
  - [ ] `images` table (BIGSERIAL id, model_id, user_id, astria_image_id, url, prompt, status)
  - [ ] `credits` table (UUID id, user_id, credits, created_at, updated_at)
  - [ ] `samples` table (UUID id, user_id, model_id, file_name, file_path, file_size)
- [ ] Verify RLS policies are created for all tables
- [ ] Verify admin policies using has_role() function
- [ ] Verify trigger `on_auth_user_created` is created
- [ ] Verify function `handle_new_user()` is created
- [ ] Initialize credits for existing users (5 credits per user)

## Type Generation
- [ ] After migration, regenerate Supabase types
- [ ] Verify types match the new schema (models, images, credits, samples)

## Code Updates - **AFTER MIGRATION**
- [ ] Update `supabase-complete.ts` to use real database queries (currently disabled)
- [ ] Remove placeholder error messages from service methods
- [ ] Verify HeadshotGenerator.tsx type fixes
- [ ] Test model creation flow
- [ ] Test image generation flow
- [ ] Test credits deduction
- [ ] Test sample upload

## Integration Testing
- [ ] Test complete headshot generation workflow
- [ ] Verify credits are properly tracked
- [ ] Verify RLS policies work correctly
- [ ] Test admin access to all records
- [ ] Test error handling

## SQL Migration Location
The complete SQL migration is in the user's message. Run it at:
https://supabase.com/dashboard/project/imzlzufdujhcbebibgpj/sql/new

## Key Schema Notes
- `models.id` and `images.id` use BIGSERIAL (not UUID)
- `astria_model_id` and `astria_image_id` are INTEGER
- `samples` table has file metadata (file_name, file_path, file_size)
- All tables have proper foreign keys to auth.users
- All tables have RLS enabled with user-specific and admin policies
