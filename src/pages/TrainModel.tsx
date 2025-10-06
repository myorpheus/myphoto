import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Upload, Zap, Clock, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { completeSupabaseService } from '@/services/supabase-complete';
import { astriaService } from '@/services/astria';

const TrainModel = () => {
  const [models, setModels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [modelName, setModelName] = useState('');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserModels();
  }, []);

  const loadUserModels = async () => {
    try {
      const user = await completeSupabaseService.getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      console.log('🔄 Loading user models...');
      const userModels = await completeSupabaseService.getUserModels(user.id);
      console.log('📊 Loaded models:', userModels);
      setModels(userModels);
    } catch (error) {
      console.error('❌ Error loading models:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your models',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files);
    
    if (selectedFiles.length < 4) {
      toast({
        title: 'Insufficient Photos',
        description: 'Please select at least 4 photos for optimal training',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFiles.length > 20) {
      toast({
        title: 'Too Many Photos',
        description: 'Maximum 20 photos allowed for training',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFiles(selectedFiles);
    toast({
      title: 'Photos Selected',
      description: `${selectedFiles.length} photos ready for training`,
    });
  };

  const handleTrainModel = async () => {
    if (!modelName.trim()) {
      toast({
        title: 'Model Name Required',
        description: 'Please enter a name for your model',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFiles.length < 4) {
      toast({
        title: 'Insufficient Photos',
        description: 'Please select at least 4 photos',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsTraining(true);
      setTrainingProgress(10);

      const user = await completeSupabaseService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      console.log('🚀 Starting model training:', modelName);
      
      // Start Astria model training
      setTrainingProgress(20);
      const astriaModel = await astriaService.trainModel({
        name: modelName,
        images: selectedFiles,
        steps: 500,
        face_crop: true
      });

      console.log('✅ Astria model created:', astriaModel);
      setTrainingProgress(40);

      // Save model to database
      const dbModel = await completeSupabaseService.createModel({
        user_id: user.id,
        astria_model_id: astriaModel.id,
        name: modelName,
        status: astriaModel.status
      });

      console.log('✅ Database model saved:', dbModel);
      setTrainingProgress(60);

      // Save uploaded samples
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        await completeSupabaseService.createSample({
          user_id: user.id,
          model_id: dbModel.id,
          file_name: file.name,
          file_path: `samples/${user.id}/${dbModel.id}/${file.name}`,
          file_size: file.size
        });
      }

      setTrainingProgress(100);
      
      toast({
        title: 'Training Started!',
        description: `Model "${modelName}" is now training. This may take 10-15 minutes.`,
      });

      // Reset form
      setModelName('');
      setSelectedFiles([]);
      
      // Reload models
      await loadUserModels();

    } catch (error) {
      console.error('❌ Training failed:', error);
      toast({
        title: 'Training Failed',
        description: 'Failed to start model training. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTraining(false);
      setTrainingProgress(0);
    }
  };

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
        <div className="container flex h-16 items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
          <h1 className="text-2xl font-bold">Train New Model</h1>
          <Badge variant="secondary" className="ml-3">Admin Only</Badge>
        </div>
      </header>

      <main className="container max-w-4xl py-8">
        <Tabs defaultValue="new" className="space-y-6">
          <TabsList>
            <TabsTrigger value="new">Train New Model</TabsTrigger>
            <TabsTrigger value="existing">Existing Models ({models.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Train New AI Model</CardTitle>
                <CardDescription>
                  Upload photos to create a personalized AI model for generating headshots. 
                  This is an admin-only feature for training models that can be used by all users.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Model Name */}
                <div className="space-y-2">
                  <label htmlFor="modelName" className="text-sm font-medium">
                    Model Name
                  </label>
                  <input
                    id="modelName"
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="Enter model name (e.g., Professional Headshots v2)"
                    className="w-full px-3 py-2 border border-input rounded-md"
                    disabled={isTraining}
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Training Photos (4-20 images)
                  </label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <div className="text-center space-y-4">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-lg font-medium">Upload Training Photos</p>
                        <p className="text-sm text-muted-foreground">
                          Select 4-20 high-quality photos for optimal results
                        </p>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="photo-upload"
                        disabled={isTraining}
                      />
                      <Button 
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        disabled={isTraining}
                      >
                        Choose Photos
                      </Button>
                    </div>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Selected {selectedFiles.length} photos:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedFiles.map((file, index) => (
                          <Badge key={index} variant="outline">
                            {file.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Training Progress */}
                {isTraining && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Training Progress</span>
                      <span>{trainingProgress}%</span>
                    </div>
                    <Progress value={trainingProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      Training your model... This may take several minutes.
                    </p>
                  </div>
                )}

                {/* Action Button */}
                <Button 
                  onClick={handleTrainModel}
                  disabled={isTraining || !modelName.trim() || selectedFiles.length < 4}
                  className="w-full"
                  size="lg"
                >
                  {isTraining ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Training Model...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Start Training
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="existing" className="space-y-6">
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
                            {model.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Created: {new Date(model.created_at).toLocaleDateString()}</span>
                        <span>Updated: {new Date(model.updated_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TrainModel;