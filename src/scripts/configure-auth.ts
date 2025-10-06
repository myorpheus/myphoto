/**
 * Configuration script to disable email verification in Supabase
 * 
 * This script needs to be run manually to configure Supabase authentication settings.
 * 
 * IMPORTANT: Run this SQL in your Supabase dashboard at:
 * https://supabase.com/dashboard/project/imzlzufdujhcbebibgpj/auth/settings
 * 
 * OR via SQL Editor at:
 * https://supabase.com/dashboard/project/imzlzufdujhcbebibgpj/sql/new
 */

// SQL commands to disable email verification
const authConfigSQL = `
-- Disable email confirmation requirement
-- This allows users to sign up and immediately login without email verification

-- Note: This should be configured in Supabase Dashboard Auth Settings:
-- 1. Go to Authentication > Settings
-- 2. Under "Email Confirmation" set to DISABLED
-- 3. This allows immediate login after signup

-- Alternative: Run this in SQL Editor if auth.config table exists
UPDATE auth.config 
SET 
  enable_signup = true,
  enable_confirmations = false
WHERE true;

-- Ensure existing unconfirmed users can login
UPDATE auth.users 
SET 
  email_confirmed_at = now(),
  confirmed_at = now()
WHERE 
  email_confirmed_at IS NULL 
  AND confirmed_at IS NULL;
`;

export const disableEmailVerification = async () => {
  console.log('=== SUPABASE AUTH CONFIGURATION NEEDED ===');
  console.log('');
  console.log('To fix login issues, disable email verification:');
  console.log('');
  console.log('METHOD 1 - Dashboard (Recommended):');
  console.log('1. Go to: https://supabase.com/dashboard/project/imzlzufdujhcbebibgpj/auth/settings');
  console.log('2. Find "Email Confirmation" setting');
  console.log('3. Set to "DISABLED"');
  console.log('4. Save changes');
  console.log('');
  console.log('METHOD 2 - SQL (If dashboard option not available):');
  console.log('Run this SQL in SQL Editor:');
  console.log('https://supabase.com/dashboard/project/imzlzufdujhcbebibgpj/sql/new');
  console.log('');
  console.log(authConfigSQL);
  console.log('');
  console.log('=== END CONFIGURATION ===');
};

// Export SQL for direct use
export { authConfigSQL };