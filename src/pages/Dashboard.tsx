import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeSupabaseService } from '@/services/supabase-complete';
import { Camera, Image, Shield, LogOut, Sparkles, Crown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface NavCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  accent: string;
}

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await completeSupabaseService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setUserEmail(user.email || '');
    const roles = await completeSupabaseService.getUserRoles(user.id);
    setUserRoles(roles);
    const admin = roles.includes('admin') || roles.includes('super_admin');
    setIsAdmin(admin);
    setIsLoading(false);
  };

  const primaryRole = userRoles.includes('super_admin')
    ? 'Super Admin'
    : userRoles.includes('admin')
    ? 'Admin'
    : userRoles[0] || 'User';

  const handleSignOut = async () => {
    await completeSupabaseService.signOut();
    navigate('/');
  };

  const navCards: NavCard[] = [
    {
      title: 'Generate',
      description: 'Create stunning AI headshots with one click',
      icon: <Sparkles className="h-7 w-7" />,
      path: '/generate',
      accent: 'from-primary to-accent',
    },
    {
      title: 'Gallery',
      description: 'Browse and manage your generated photos',
      icon: <Image className="h-7 w-7" />,
      path: '/gallery',
      accent: 'from-accent to-primary',
    },
  ];

  if (isAdmin) {
    navCards.push({
      title: 'Admin Panel',
      description: 'Manage users, models, and server photos',
      icon: <Shield className="h-7 w-7" />,
      path: '/admin',
      accent: 'from-destructive to-primary',
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Cinematic ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              MyPhoto
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 hidden sm:flex">
              <span className="text-sm text-muted-foreground">
                {userEmail}
              </span>
              <Badge variant={isAdmin ? 'default' : 'secondary'} className="flex items-center gap-1 text-xs">
                {isAdmin ? <Crown className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {primaryRole}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Welcome section */}
        <div className="mb-14">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-3">
            Welcome back
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Your AI-powered photo studio. Generate, curate, and manage.
          </p>
        </div>

        {/* Navigation cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {navCards.map((card) => (
            <Card
              key={card.title}
              onClick={() => navigate(card.path)}
              className="group relative cursor-pointer border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 overflow-hidden p-6"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300" 
                   style={{ backgroundImage: `var(--gradient-primary)` }} />
              
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${card.accent} text-primary-foreground mb-5`}>
                {card.icon}
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {card.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {card.description}
              </p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
