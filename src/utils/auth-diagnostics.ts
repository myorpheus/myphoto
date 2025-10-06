/**
 * Authentication Diagnostics Utility
 * 
 * This utility helps diagnose account creation and authentication issues
 * by providing comprehensive logging and testing functions.
 */

import { supabase } from '@/integrations/supabase/client';

export interface AuthDiagnostics {
  timestamp: string;
  userAgent: string;
  url: string;
  supabaseUrl: string;
  hasValidApiKey: boolean;
  networkStatus: 'online' | 'offline';
}

export interface SignupAttemptLog {
  email: string;
  timestamp: string;
  success: boolean;
  error?: string;
  userReturned: boolean;
  sessionCreated: boolean;
  emailConfirmed: boolean;
  metadata: Record<string, any>;
}

/**
 * Collect diagnostic information about the current environment
 */
export function collectDiagnostics(): AuthDiagnostics {
  return {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    supabaseUrl: (supabase as any).supabaseUrl || 'unknown',
    hasValidApiKey: !!(supabase as any).supabaseKey,
    networkStatus: navigator.onLine ? 'online' : 'offline'
  };
}

/**
 * Test Supabase connection and authentication service
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  authServiceAvailable: boolean;
  error?: string;
}> {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Supabase auth service error:', error);
      return {
        connected: false,
        authServiceAvailable: false,
        error: error.message
      };
    }

    console.log('✅ Supabase auth service is available');
    return {
      connected: true,
      authServiceAvailable: true
    };
  } catch (error: any) {
    console.error('❌ Failed to connect to Supabase:', error);
    return {
      connected: false,
      authServiceAvailable: false,
      error: error.message
    };
  }
}

/**
 * Test account creation with a dummy email (for debugging)
 * NOTE: Only use for debugging - will create real accounts
 */
export async function testAccountCreation(email: string, password: string): Promise<SignupAttemptLog> {
  const log: SignupAttemptLog = {
    email,
    timestamp: new Date().toISOString(),
    success: false,
    userReturned: false,
    sessionCreated: false,
    emailConfirmed: false,
    metadata: { appsource: 'PRu' }
  };

  try {
    console.log('🧪 Testing account creation for:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          appsource: 'PRu'
        }
      }
    });

    if (error) {
      log.error = error.message;
      console.error('❌ Test signup failed:', error);
      return log;
    }

    log.userReturned = !!data.user;
    log.sessionCreated = !!data.session;
    log.emailConfirmed = !!(data.user?.confirmed_at || data.user?.email_confirmed_at);
    log.success = !!data.user;

    console.log('✅ Test signup results:', log);
    return log;

  } catch (error: any) {
    log.error = error.message;
    console.error('💥 Test signup exception:', error);
    return log;
  }
}

/**
 * Check current authentication status
 */
export async function checkAuthStatus(): Promise<{
  authenticated: boolean;
  user?: any;
  session?: any;
  error?: string;
}> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (userError || sessionError) {
      return {
        authenticated: false,
        error: userError?.message || sessionError?.message
      };
    }

    return {
      authenticated: !!user && !!session,
      user: user ? {
        id: user.id,
        email: user.email,
        confirmed_at: user.confirmed_at,
        user_metadata: user.user_metadata
      } : null,
      session: session ? {
        access_token: session.access_token ? 'present' : 'missing',
        expires_at: session.expires_at
      } : null
    };
  } catch (error: any) {
    return {
      authenticated: false,
      error: error.message
    };
  }
}

/**
 * Comprehensive authentication diagnostic report
 */
export async function generateAuthDiagnosticReport(): Promise<string> {
  const diagnostics = collectDiagnostics();
  const connection = await testSupabaseConnection();
  const authStatus = await checkAuthStatus();

  const report = `
🔧 AUTHENTICATION DIAGNOSTIC REPORT
Generated: ${diagnostics.timestamp}

📊 ENVIRONMENT
- URL: ${diagnostics.url}
- User Agent: ${diagnostics.userAgent}
- Network Status: ${diagnostics.networkStatus}
- Supabase URL: ${diagnostics.supabaseUrl}
- Valid API Key: ${diagnostics.hasValidApiKey}

🌐 CONNECTION STATUS
- Connected: ${connection.connected}
- Auth Service Available: ${connection.authServiceAvailable}
- Error: ${connection.error || 'None'}

👤 AUTHENTICATION STATUS
- Authenticated: ${authStatus.authenticated}
- User Present: ${!!authStatus.user}
- Session Present: ${!!authStatus.session}
- Error: ${authStatus.error || 'None'}

📋 USER DETAILS
${authStatus.user ? `
- ID: ${authStatus.user.id}
- Email: ${authStatus.user.email}
- Confirmed: ${authStatus.user.confirmed_at ? 'Yes' : 'No'}
- Metadata: ${JSON.stringify(authStatus.user.user_metadata, null, 2)}
` : 'No user data available'}

📋 SESSION DETAILS
${authStatus.session ? `
- Access Token: ${authStatus.session.access_token}
- Expires At: ${authStatus.session.expires_at}
` : 'No session data available'}

🚨 RECOMMENDED ACTIONS
${!connection.connected ? '- Fix Supabase connection issues' : ''}
${!connection.authServiceAvailable ? '- Check Supabase auth service configuration' : ''}
${authStatus.error ? '- Resolve authentication errors' : ''}
${authStatus.user && !authStatus.user.confirmed_at ? '- Check email confirmation settings' : ''}
`;

  console.log(report);
  return report;
}

/**
 * Log signup attempt for debugging
 */
export function logSignupAttempt(log: SignupAttemptLog): void {
  console.log('📝 SIGNUP ATTEMPT LOG:', JSON.stringify(log, null, 2));
  
  // Store in localStorage for debugging (optional)
  try {
    const existingLogs = JSON.parse(localStorage.getItem('auth_debug_logs') || '[]');
    existingLogs.push(log);
    // Keep only last 10 logs
    const recentLogs = existingLogs.slice(-10);
    localStorage.setItem('auth_debug_logs', JSON.stringify(recentLogs));
  } catch (error) {
    console.warn('Failed to store debug log:', error);
  }
}

/**
 * Get stored debug logs
 */
export function getDebugLogs(): SignupAttemptLog[] {
  try {
    return JSON.parse(localStorage.getItem('auth_debug_logs') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear debug logs
 */
export function clearDebugLogs(): void {
  localStorage.removeItem('auth_debug_logs');
  console.log('🧹 Debug logs cleared');
}