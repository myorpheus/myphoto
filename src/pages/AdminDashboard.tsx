import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabaseService } from '@/services/supabase';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Settings as SettingsIcon, Camera, ArrowRight } from 'lucide-react';
import Analytics from '@/components/Analytics';
import UserManagement from '@/components/UserManagement';
import Settings from '@/components/Settings';

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const user = await supabaseService.getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const roles = await supabaseService.getUserRoles(user.id);
      setUserRoles(roles);

      const hasAdminAccess = roles.includes('admin') || roles.includes('super_admin');
      setIsAuthorized(hasAdminAccess);

      if (!hasAdminAccess) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access the admin dashboard',
          variant: 'destructive',
        });
        navigate('/overview');
        return;
      }
    } catch (error) {
      console.error('Authorization error:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify permissions',
        variant: 'destructive',
      });
      navigate('/overview');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/overview')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            {userRoles.includes('super_admin') && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                Super Admin
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Admin Tools */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Admin Tools</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group cursor-pointer hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-border hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  Train Model
                </CardTitle>
                <CardDescription>
                  Train new AI models for headshot generation (Admin Only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  className="w-full justify-between group/btn hover:bg-primary/10"
                  onClick={() => navigate('/admin/train')}
                >
                  Access Tool
                  <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            {/* Placeholder for future admin tools */}
            <Card className="opacity-50 border-dashed">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4">
                  <SettingsIcon className="h-7 w-7 text-muted-foreground" />
                </div>
                <CardTitle className="text-muted-foreground">
                  More Tools Coming Soon
                </CardTitle>
                <CardDescription>
                  Additional admin functionality will be added here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" disabled className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            {userRoles.includes('super_admin') && (
              <TabsTrigger value="settings">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Analytics userRoles={userRoles} />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement userRoles={userRoles} />
          </TabsContent>

          {userRoles.includes('super_admin') && (
            <TabsContent value="settings" className="space-y-4">
              <Settings userRoles={userRoles} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
