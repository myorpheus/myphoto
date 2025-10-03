import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabaseService } from '@/services/supabase';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';

const Overview = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await supabaseService.getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Check if user is admin
      const adminStatus = await supabaseService.isAdmin(user.id);
      setIsAdmin(adminStatus);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load your data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabaseService.signOut();
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-2xl font-bold">Overview</h1>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button onClick={() => navigate('/admin')} variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            )}
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Welcome to Your Profile</h2>
            <p className="text-muted-foreground mb-4">
              This is your overview page. More features coming soon!
            </p>
            {isAdmin && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="font-medium">Admin Access</p>
                <p className="text-sm text-muted-foreground">
                  You have administrative privileges. Click the Admin Dashboard button above to access admin features.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Overview;