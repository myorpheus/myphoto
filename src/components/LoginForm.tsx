import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  setActiveTab: (tab: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ setActiveTab }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: 'Missing information',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast({
          title: 'Welcome back!',
          description: 'Successfully signed in to your account',
        });
        navigate('/home', { replace: true });
      }
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message || 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="text-center mb-4">
        <CardTitle className="text-xl">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your account to continue creating professional headshots
        </CardDescription>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;
