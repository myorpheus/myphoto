import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabaseService } from '@/services/supabase';
import { Camera, Sparkles, Bug } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateAuthDiagnosticReport } from '@/utils/auth-diagnostics';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from '@/contexts/LanguageContext';
import LoginForm from '@/components/LoginForm';
import SignupForm from '@/components/SignupForm';

const Login = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const runDiagnostics = async () => {
    console.log('🔬 Running authentication diagnostics...');
    const report = await generateAuthDiagnosticReport();
    setShowDiagnostics(true);
    toast({ title: 'Diagnostic Report Generated', description: 'Check the browser console for detailed information.' });
  };

  useEffect(() => {
    const checkUser = async () => {
      const user = await supabaseService.getCurrentUser();
      if (user) navigate('/home', { replace: true });
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) navigate('/home', { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Language selector floating top-right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-card/95 border border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="relative">
              <Camera className="h-8 w-8 text-primary animate-glow" />
              <div className="absolute inset-0 h-8 w-8 bg-primary/20 blur-xl animate-glow" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              {t("app.name")}
            </span>
          </div>
          <div className="inline-block">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              {t("app.tagline")}
            </span>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t("common.signIn")}</TabsTrigger>
              <TabsTrigger value="signup">{t("login.createAccount")}</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm setActiveTab={setActiveTab} />
            </TabsContent>
            <TabsContent value="signup">
              <SignupForm setActiveTab={setActiveTab} />
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center space-y-2">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
              {t("login.backToHome")}
            </Button>
            {import.meta.env.DEV && (
              <div>
                <Button variant="outline" size="sm" onClick={runDiagnostics} className="text-xs opacity-70 hover:opacity-100">
                  <Bug className="h-3 w-3 mr-1" />
                  {t("login.diagnostics")}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
