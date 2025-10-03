import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabaseService } from '@/services/supabase';
import { useNavigate } from 'react-router-dom';
import { Database } from '@/integrations/supabase/types';
import { Plus, Image, Clock, CheckCircle, XCircle } from 'lucide-react';

type Model = Database['public']['Tables']['models']['Row'];

const Overview = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState(0);
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

      const [userModels, userCredits] = await Promise.all([
        supabaseService.getUserModels(user.id),
        supabaseService.getUserCredits(user.id)
      ]);

      setModels(userModels);
      setCredits(userCredits);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finished':
        return <Badge className=\"bg-green-500\"><CheckCircle className=\"w-3 h-3 mr-1\" />Ready</Badge>;
      case 'training':
        return <Badge variant=\"secondary\"><Clock className=\"w-3 h-3 mr-1\" />Training</Badge>;
      case 'failed':
        return <Badge variant=\"destructive\"><XCircle className=\"w-3 h-3 mr-1\" />Failed</Badge>;
      default:
        return <Badge variant=\"outline\">{status}</Badge>;
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
      <div className=\"min-h-screen flex items-center justify-center\">
        <div className=\"animate-spin rounded-full h-32 w-32 border-b-2 border-primary\"></div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-background\">
      <header className=\"border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60\">
        <div className=\"container flex h-16 items-center justify-between\">
          <h1 className=\"text-2xl font-bold\">My Headshots</h1>
          <div className=\"flex items-center gap-4\">
            <Badge variant=\"outline\" className=\"text-sm\">
              {credits} credits
            </Badge>
            <Button onClick={handleSignOut} variant=\"outline\">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className=\"container py-8\">
        <div className=\"mb-8\">
          <div className=\"flex items-center justify-between mb-4\">
            <h2 className=\"text-xl font-semibold\">Your Models</h2>
            <Button onClick={() => navigate('/train')}>
              <Plus className=\"w-4 h-4 mr-2\" />
              Train New Model
            </Button>
          </div>

          {models.length === 0 ? (
            <Card>
              <CardContent className=\"flex flex-col items-center justify-center py-12\">
                <Image className=\"w-12 h-12 text-muted-foreground mb-4\" />
                <h3 className=\"text-lg font-medium mb-2\">No models yet</h3>
                <p className=\"text-muted-foreground text-center mb-4\">
                  Train your first AI model to start generating professional headshots
                </p>
                <Button onClick={() => navigate('/train')}>
                  <Plus className=\"w-4 h-4 mr-2\" />
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className=\"grid gap-6 md:grid-cols-2 lg:grid-cols-3\">
              {models.map((model) => (
                <Card key={model.id} className=\"cursor-pointer hover:shadow-lg transition-shadow\"
                      onClick={() => navigate(`/models/${model.id}`)}>
                  <CardHeader>
                    <div className=\"flex items-center justify-between\">
                      <CardTitle className=\"text-lg\">{model.name}</CardTitle>
                      {getStatusBadge(model.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className=\"space-y-2 text-sm text-muted-foreground\">
                      <p>Created: {new Date(model.created_at).toLocaleDateString()}</p>
                      {model.modelId && (
                        <p>Model ID: {model.modelId}</p>
                      )}
                      {model.status === 'finished' && (
                        <Button className=\"w-full mt-4\" size=\"sm\">
                          Generate Photos
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {credits < 3 && (
          <Card className=\"border-orange-200 bg-orange-50\">
            <CardContent className=\"pt-6\">
              <div className=\"flex items-center justify-between\">
                <div>
                  <h3 className=\"font-medium text-orange-900\">Low on credits</h3>
                  <p className=\"text-sm text-orange-700\">
                    You have {credits} credits remaining. Get more to continue training models.
                  </p>
                </div>
                <Button onClick={() => navigate('/credits')} className=\"bg-orange-600 hover:bg-orange-700\">
                  Get Credits
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Overview;