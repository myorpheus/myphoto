import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff } from 'lucide-react';
import {
  collectDiagnostics,
  logSignupAttempt
} from '@/utils/auth-diagnostics';

interface SignupFormProps {
  setActiveTab: (tab: string) => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ setActiveTab }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are identical',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔄 Starting signup process...', { email, timestamp: new Date().toISOString() });

      // Collect diagnostic information
      const diagnostics = collectDiagnostics();
      console.log('📊 Environment diagnostics:', diagnostics);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            appsource: 'PRu'  // Required metadata per project requirements
          }
        }
      });

      if (error) {
        let userFriendlyMessage = error.message;
        if (error.message?.includes('User already registered')) {
          userFriendlyMessage = 'An account with this email already exists. Please try signing in instead.';
        } else if (error.message?.includes('Invalid email')) {
          userFriendlyMessage = 'Please enter a valid email address.';
        } else if (error.message?.includes('Password')) {
          userFriendlyMessage = 'Password must be at least 6 characters long.';
        }

        throw new Error(userFriendlyMessage);
      }

      if (data.user) {
        // Log successful signup attempt
        logSignupAttempt({
          email,
          timestamp: new Date().toISOString(),
          success: true,
          userReturned: true,
          sessionCreated: !!data.session,
          emailConfirmed: !!(data.user.confirmed_at || data.user.email_confirmed_at),
          metadata: { appsource: 'PRu' }
        });

        if (!data.user.confirmed_at && !data.user.email_confirmed_at) {
          toast({
            title: 'Account created successfully!',
            description: 'Please check your email to verify your account before signing in.',
          });
          setActiveTab('login');
        } else {
          toast({
            title: 'Account created successfully!',
            description: 'Welcome to Headshots AI. You can now start creating professional headshots.',
          });
          navigate('/overview', { replace: true });
        }
      } else {
        logSignupAttempt({
          email,
          timestamp: new Date().toISOString(),
          success: false,
          userReturned: false,
          sessionCreated: !!data.session,
          emailConfirmed: false,
          metadata: { appsource: 'PRu' },
          error: 'No user returned from Supabase'
        });

        throw new Error('Account creation failed - no user returned from Supabase');
      }
    } catch (error: any) {
      logSignupAttempt({
        email,
        timestamp: new Date().toISOString(),
        success: false,
        userReturned: false,
        sessionCreated: false,
        emailConfirmed: false,
        metadata: { appsource: 'PRu' },
        error: error.message
      });

      toast({
        title: 'Sign up failed',
        description: error.message || 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11"
        />
      </div>

      <div className="space-y-2 relative">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="Create a password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="h-11 pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-11 px-3"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      <div className="space-y-2 relative">
        <Input
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="h-11 pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-11 px-3"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
        disabled={isLoading}
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
};

export default SignupForm;
