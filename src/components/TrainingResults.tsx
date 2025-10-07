import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  astria_model_id: string;
  status: string;
  updated_at: string;
}

interface TrainingResultsProps {
  models: Model[];
  isLoading: boolean;
  isLoadingAstriaModels: boolean;
  loadUserModels: () => Promise<void>;
  loadAstriaModels: () => Promise<void>;
}

const TrainingResults: React.FC<TrainingResultsProps> = ({
  models,
  isLoading,
  isLoadingAstriaModels,
  loadUserModels,
  loadAstriaModels,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trained': return 'bg-green-500';
      case 'training': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'trained': return <CheckCircle className="w-4 h-4" />;
      case 'training': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleSyncModels = async () => {
    await Promise.all([loadUserModels(), loadAstriaModels()]);
  };

  return (
    <div className="space-y-4">
      {/* Refresh Models Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Your Trained Models</h3>
          <p className="text-sm text-muted-foreground">Models available for generating headshots</p>
        </div>
        <Button
          onClick={handleSyncModels}
          disabled={isLoadingAstriaModels || isLoading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${(isLoadingAstriaModels || isLoading) ? 'animate-spin' : ''}`} />
          {(isLoadingAstriaModels || isLoading) ? 'Syncing...' : 'Sync Models'}
        </Button>
      </div>

      {/* Models Grid */}
      <div className="grid gap-4">
        {models.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No Models Yet</h3>
                <p className="text-muted-foreground">
                  Train your first AI model using the "Train New Model" tab.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          models.map((model) => (
            <Card key={model.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <CardDescription>
                      Model ID: {model.id} • Astria ID: {model.astria_model_id}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(model.status)} text-white border-0`}
                    >
                      {getStatusIcon(model.status)}
                      <span className="ml-1">{model.status}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Last Updated: {new Date(model.updated_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TrainingResults;
