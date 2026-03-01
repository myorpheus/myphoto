import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabaseService } from '@/services/supabase';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Settings as SettingsIcon, Camera, ArrowRight } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from '@/contexts/LanguageContext';
import Analytics from '@/components/Analytics';
import UserManagement from '@/components/UserManagement';
import Settings from '@/components/Settings';

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => { checkAuthorization(); }, []);

  const checkAuthorization = async () => {
    try {
      const user = await supabaseService.getCurrentUser();
      if (!user) { navigate('/login'); return; }
      const roles = await supabaseService.getUserRoles(user.id);
      setUserRoles(roles);
      const hasAdminAccess = roles.includes('admin') || roles.includes('super_admin');
      setIsAuthorized(hasAdminAccess);
      if (!hasAdminAccess) {
        toast({ title: 'Access Denied', description: 'You do not have permission to access the admin dashboard', variant: 'destructive' });
        navigate('/home');
      }
    } catch (error) {
      console.error('Authorization error:', error);
      toast({ title: t('common.error'), description: 'Failed to verify permissions', variant: 'destructive' });
      navigate('/home');
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

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/home')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.back")}
            </Button>
            <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
            {userRoles.includes('super_admin') || userRoles.includes('admin') && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                {t("admin.superAdmin")}
              </span>
            )}
          </div>
          <LanguageSelector />
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">{t("admin.tools")}</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group cursor-pointer hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-border hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">{t("admin.trainModel")}</CardTitle>
                <CardDescription>{t("admin.trainModelDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between group/btn hover:bg-primary/10" onClick={() => navigate('/admin/train')}>
                  {t("admin.accessTool")}
                  <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-border hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <SettingsIcon className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">OG Image Settings</CardTitle>
                <CardDescription>Manage Open Graph image generation settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between group/btn hover:bg-primary/10" onClick={() => navigate('/admin-og')}>
                  {t("admin.accessTool")}
                  <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            <Card className="opacity-50 border-dashed">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4">
                  <SettingsIcon className="h-7 w-7 text-muted-foreground" />
                </div>
                <CardTitle className="text-muted-foreground">{t("admin.moreTools")}</CardTitle>
                <CardDescription>{t("admin.moreToolsDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" disabled className="w-full">{t("common.comingSoon")}</Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{t("admin.overview")}</TabsTrigger>
            <TabsTrigger value="users">{t("admin.users")}</TabsTrigger>
            {userRoles.includes('super_admin') || userRoles.includes('admin') && (
              <TabsTrigger value="settings">
                <SettingsIcon className="w-4 h-4 mr-2" />
                {t("admin.settings")}
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <Analytics userRoles={userRoles} />
          </TabsContent>
          <TabsContent value="users" className="space-y-4">
            <UserManagement userRoles={userRoles} />
          </TabsContent>
          {userRoles.includes('super_admin') || userRoles.includes('admin') && (
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
