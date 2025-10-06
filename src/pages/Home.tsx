import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabaseService } from "@/services/supabase";
import { completeSupabaseService } from "@/services/supabase-complete";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Camera, 
  Sparkles, 
  Image, 
  Crown, 
  LogOut, 
  ArrowRight,
  Coins,
  User,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

const Home = () => {
  const [user, setUser] = useState<any>(null);
  const [userCredits, setUserCredits] = useState(0);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await supabaseService.getCurrentUser();
      
      if (!currentUser) {
        navigate('/login');
        return;
      }

      setUser(currentUser);
      
      // Load credits
      const credits = await completeSupabaseService.getUserCredits(currentUser.id);
      setUserCredits(credits);
      
      // Load roles
      const roles = await completeSupabaseService.getUserRoles(currentUser.id);
      setUserRoles(roles);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your account information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabaseService.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  const quickActions = [
    {
      title: "Generate Headshots",
      description: "Create professional AI headshots",
      icon: Sparkles,
      action: () => navigate('/generate'),
      gradient: "from-primary to-accent",
      available: true
    },
    {
      title: "View Gallery",
      description: "Browse your generated images",
      icon: Image,
      action: () => navigate('/overview'),
      gradient: "from-primary/80 to-accent/80",
      available: true
    }
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container flex h-20 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3 font-bold text-2xl">
            <div className="relative">
              <Camera className="h-7 w-7 text-primary animate-glow" />
              <div className="absolute inset-0 h-7 w-7 bg-primary/20 blur-xl animate-glow" />
            </div>
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Headshots AI
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">{userCredits} Credits</span>
            </div>
            
            <ThemeToggle />
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSignOut}
              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container px-4 py-12 md:px-6">
        {/* Welcome Section */}
        <div className="mb-12 animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">
                Welcome back!
              </h1>
              <p className="text-muted-foreground text-lg">
                {user?.email}
              </p>
            </div>
          </div>
          
          {userRoles.length > 0 && (
            <div className="flex gap-2 mt-4">
              {userRoles.map((role) => (
                <Badge key={role} variant="secondary" className="capitalize">
                  {role === 'super_admin' && <Crown className="h-3 w-3 mr-1" />}
                  {role.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <Card 
                key={action.title}
                className="group cursor-pointer hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 border-border hover:border-primary/50 animate-fade-in overflow-hidden relative"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={action.action}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <action.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {action.title}
                  </CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between group/btn hover:bg-primary/10"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <Card className="animate-fade-in border-border">
            <CardHeader>
              <CardTitle>Your Credits</CardTitle>
              <CardDescription>Available credits for headshot generation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-primary">{userCredits}</span>
                <span className="text-muted-foreground">credits remaining</span>
              </div>
              <Button 
                className="mt-6 w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/50 transition-all"
                onClick={() => toast({
                  title: "Coming Soon",
                  description: "Credit purchase will be available soon!",
                })}
              >
                <Coins className="mr-2 h-4 w-4" />
                Get More Credits
              </Button>
            </CardContent>
          </Card>

          <Card className="animate-fade-in border-border" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/overview')}
              >
                <Settings className="mr-2 h-4 w-4" />
                View Dashboard
              </Button>
              
              {(userRoles.includes('admin') || userRoles.includes('super_admin')) && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/admin')}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
