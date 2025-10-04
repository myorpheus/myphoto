import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabaseService } from '@/services/supabase';
import { completeSupabaseService } from '@/services/supabase-complete';
import { useNavigate } from 'react-router-dom';
import { Settings, Camera, Coins } from 'lucide-react';

const Overview = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [recentImages, setRecentImages] = useState<any[]>([]);
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

      // Load user credits
      const credits = await completeSupabaseService.getUserCredits(user.id);
      setUserCredits(credits);

      // Load recent images
      const images = await completeSupabaseService.getUserImages(user.id);
      setRecentImages(images.slice(0, 6)); // Show last 6 images
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

      <main className="container py-8 space-y-8">
        {/* Credits and Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Available Credits</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-2xl font-bold">{userCredits}</span>
                    <span className="text-muted-foreground">credits</span>
                  </div>
                </div>
                <Button 
                  size="lg"
                  onClick={() => navigate('/generate')}
                  disabled={userCredits < 1}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Generate Headshots
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/generate')}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Create New Headshots
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/train')}
                >
                  Train Custom Model
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Images */}
        {recentImages.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Recent Headshots</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {recentImages.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={`Headshot ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-border"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button size="sm" variant="secondary">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Welcome Card */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Welcome to AI Headshots</h2>
            <p className="text-muted-foreground mb-4">
              Generate professional headshots using AI. Upload your photos to train a personalized model and create stunning professional portraits.
            </p>
            
            {userCredits === 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <p className="font-medium text-yellow-900">No Credits Available</p>
                <p className="text-sm text-yellow-700 mt-1">
                  You need credits to generate headshots. Contact support to get started.
                </p>
              </div>
            )}

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