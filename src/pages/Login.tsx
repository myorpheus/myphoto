import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabaseService } from '@/services/supabase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await supabaseService.signInWithEmail(email);
      setIsEmailSent(true);
      toast({
        title: 'Magic link sent!',
        description: 'Check your email for a login link',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send login link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className=\"min-h-screen flex items-center justify-center bg-background p-4\">
        <Card className=\"w-full max-w-md\">
          <CardHeader className=\"text-center\">
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We've sent you a magic link to sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent className=\"text-center\">
            <p className=\"text-sm text-muted-foreground mb-4\">
              Click the link in the email we sent to {email} to complete your sign in
            </p>
            <Button 
              variant=\"outline\" 
              onClick={() => setIsEmailSent(false)}
            >
              Try different email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen flex items-center justify-center bg-background p-4\">
      <Card className=\"w-full max-w-md\">
        <CardHeader className=\"text-center\">
          <CardTitle>Sign in to your account</CardTitle>
          <CardDescription>
            Enter your email to receive a magic link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className=\"space-y-4\">
            <div>
              <Input
                type=\"email\"
                placeholder=\"Enter your email\"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button 
              type=\"submit\" 
              className=\"w-full\"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Magic Link'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;