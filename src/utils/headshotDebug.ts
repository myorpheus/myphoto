import { supabase } from '@/integrations/supabase/client';
import { completeSupabaseService } from '@/services/supabase-complete';

export const testConfiguration = async (
  toast: any,
  navigate: (path: string) => void
) => {
  console.log('🧪 Testing edge function configuration...');
  console.log('🧪 Current URL:', window.location.href);
  console.log('🧪 Supabase client configured');

  try {
    console.log('🧪 Getting current user and session...');
    const user = await completeSupabaseService.getCurrentUser();
    const { data: { session } } = await supabase.auth.getSession();

    console.log('🧪 User:', user?.id || 'No user');
    console.log('🧪 Session exists:', !!session);
    console.log('🧪 Token length:', session?.access_token?.length || 0);

    if (!session) {
      console.error('❌ No session for config test');
      toast({
        title: 'Configuration Test Failed',
        description: 'No user session found. Please login.',
        variant: 'destructive',
      });
      return;
    }

    // Test 1: Check if edge function is accessible
    console.log('🧪 Test 1: Basic edge function connectivity...');
    const response = await fetch(`https://imzlzufdujhcbebibgpj.supabase.co/functions/v1/generate-headshot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'list_models'
      }),
    });

    console.log('🧪 Config test response status:', response.status);
    console.log('🧪 Config test response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('🧪 Config test response body:', responseText);

    let configTestResult = 'Unknown';
    let configDetails = '';

    if (response.status === 200) {
      configTestResult = '✅ Edge function accessible';
      try {
        const data = JSON.parse(responseText);
        configDetails = `Models found: ${data.models?.length || 0}`;
      } catch (e) {
        configDetails = 'Response parsed successfully';
      }
    } else if (response.status === 401) {
      configTestResult = '❌ Authentication failed';
      configDetails = 'JWT token invalid or expired';
      navigate('/login');
    } else if (response.status === 500) {
      configTestResult = '❌ Server configuration error';
      if (responseText.includes('ASTRIA_API_KEY')) {
        configDetails = 'ASTRIA_API_KEY not configured in Supabase';
      } else if (responseText.includes('Database configuration')) {
        configDetails = 'Database configuration missing';
      } else {
        configDetails = 'Internal server error - check logs';
      }
    } else {
      configTestResult = `❌ HTTP ${response.status}`;
      configDetails = responseText.substring(0, 100);
    }

    // Test 2: Check user credits
    console.log('🧪 Test 2: Checking user credits...');
    const credits = await completeSupabaseService.getUserCredits(user!.id);
    console.log('🧪 User credits:', credits);

    // Test 3: Try a simple database operation
    console.log('🧪 Test 3: Testing database connectivity...');
    try {
      const models = await completeSupabaseService.getUserModels(user!.id);
      console.log('🧪 User models count:', models.length);
    } catch (dbError) {
      console.error('🧪 Database test failed:', dbError);
    }

    toast({
      title: 'Configuration Test Complete',
      description: `${configTestResult}. ${configDetails}. Check console for full details.`,
      variant: response.status === 200 ? 'default' : 'destructive',
    });

  } catch (error) {
    console.error('❌ Configuration test failed:', error);
    toast({
      title: 'Configuration Test Failed',
      description: error instanceof Error ? error.message : 'Unknown error',
      variant: 'destructive',
    });
  }
};
