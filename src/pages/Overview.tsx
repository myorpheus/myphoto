import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabaseService } from '@/services/supabase';
import { completeSupabaseService } from '@/services/supabase-complete';
import { useNavigate } from 'react-router-dom';
import { Settings, Camera, Coins } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from '@/contexts/LanguageContext';

const Overview = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [recentImages, setRecentImages] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => { loadUserData(); }, []);

  const loadUserData = async () => {
    try {
      const user = await supabaseService.getCurrentUser();
      if (!user) { navigate('/login'); return; }
      const adminStatus = await supabaseService.isAdmin(user.id);
      setIsAdmin(adminStatus);
      const credits = await completeSupabaseService.getUserCredits(user.id);
      setUserCredits(credits);
      const images = await completeSupabaseService.getUserImages(user.id);
      setRecentImages(images);
    } catch (error) {
      toast({ title: t('common.error'), description: 'Failed to load your data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabaseService.signOut();
      navigate('/');
    } catch (error) {
      toast({ title: t('common.error'), description: 'Failed to sign out', variant: 'destructive' });
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
          <h1 className="text-2xl font-bold">{t("overview.title")}</h1>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            {isAdmin && (
              <Button onClick={() => navigate('/admin')} variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                {t("home.adminDashboard")}
              </Button>
            )}
            <Button onClick={handleSignOut} variant="outline">{t("common.signOut")}</Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{t("overview.availableCredits")}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-2xl font-bold">{userCredits}</span>
                    <span className="text-muted-foreground">{t("common.credits").toLowerCase()}</span>
                  </div>
                </div>
                <Button size="lg" onClick={() => navigate('/generate')} disabled={userCredits < 1} className="bg-primary hover:bg-primary/90">
                  <Camera className="w-4 h-4 mr-2" />
                  {t("home.generateHeadshots")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">{t("overview.quickActions")}</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/generate')}>
                  <Camera className="w-4 h-4 mr-2" />
                  {t("overview.createNew")}
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/train')}>
                  {t("overview.trainModel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {recentImages.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{t("overview.yourHeadshots")} ({recentImages.length})</h3>
                <Button variant="outline" size="sm" onClick={() => navigate('/gallery')}>
                  {t("overview.viewAll")}
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {recentImages.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img src={image.url} alt={`Headshot ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-border" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button size="sm" variant="secondary">{t("common.view")}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">{t("overview.welcome")}</h2>
            <p className="text-muted-foreground mb-4">{t("overview.welcomeDesc")}</p>
            {userCredits === 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <p className="font-medium text-yellow-900">{t("overview.noCredits")}</p>
                <p className="text-sm text-yellow-700 mt-1">{t("overview.noCreditsDesc")}</p>
              </div>
            )}
            {isAdmin && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="font-medium">{t("overview.adminAccess")}</p>
                <p className="text-sm text-muted-foreground">{t("overview.adminAccessDesc")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Overview;
