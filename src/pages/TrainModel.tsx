import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Zap, Clock, CheckCircle, AlertCircle, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { completeSupabaseService } from '@/services/supabase-complete';
import { supabase } from '@/integrations/supabase/client';
import { filesToBase64 } from '@/utils/file-utils';

const TrainModel = () => {
  const [models, setModels] = useState<any[]>([]);
  const [astriaModels, setAstriaModels] = useState<any[]>([]);
  const [selectedExistingModel, setSelectedExistingModel] = useState<any>(null);
  const [useExistingModel, setUseExistingModel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAstriaModels, setIsLoadingAstriaModels] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [modelName, setModelName] = useState('');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserModels();
    loadAstriaModels();
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

  const loadAstriaModels = async () => {
    try {
      setIsLoadingAstriaModels(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session available for loading Astria models');
        return;
      }

      console.log('🔄 Loading existing Astria models...');
      
      const response = await fetch(`https://imzlzufdujhcbebibgpj.supabase.co/functions/v1/generate-headshot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'list_models'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load Astria models');
      }

      const result = await response.json();
      console.log('✅ Loaded Astria models:', result);
      
      if (result.models && Array.isArray(result.models)) {
        setAstriaModels(result.models);
        
        // Find and set newheadhotMAN as default if it exists
        const defaultModel = result.models.find((model: any) => 
          model.name && model.name.toLowerCase().includes('newheadhotman')
        );
        
        if (defaultModel) {
          console.log('🎯 Found default model newheadhotMAN:', defaultModel);
          setSelectedExistingModel(defaultModel);
          setUseExistingModel(true);
        }
      }
    } catch (error) {
      console.error('❌ Error loading Astria models:', error);
      toast({
        title: 'Info',
        description: 'Could not load existing Astria models. You can still create new models.',
        variant: 'default',
      });
    } finally {
      setIsLoadingAstriaModels(false);
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
    // Validation for new model creation
    if (!useExistingModel) {
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
    }

    // Validation for existing model usage
    if (useExistingModel) {
      if (!selectedExistingModel) {
        toast({
          title: 'Model Selection Required',
          description: 'Please select an existing model to use',
          variant: 'destructive',
        });
        return;
      }

      if (selectedExistingModel.status !== 'trained') {
        toast({
          title: 'Model Not Ready',
          description: 'Selected model is not trained yet. Please select a trained model.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setIsTraining(true);
      setTrainingProgress(10);

      const user = await completeSupabaseService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      setTrainingProgress(20);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('User not authenticated');

      if (useExistingModel && selectedExistingModel) {
        // Use existing Astria model - save to database for user access
        console.log('💾 Saving existing model for user access:', selectedExistingModel.name);
        
        setTrainingProgress(50);
        
        // Create database record for the existing model
        const newModel = await completeSupabaseService.createModel({
          user_id: user.id,
          astria_model_id: selectedExistingModel.id,
          name: selectedExistingModel.name || `Existing Model ${selectedExistingModel.id}`,
          status: 'trained' // Existing model is already trained
        });

        console.log('✅ Existing model saved to database:', newModel);
        setTrainingProgress(100);
        
        toast({
          title: 'Model Added!',
          description: `Existing model "${selectedExistingModel.name}" is now available for use.`,
        });

        // Reset form
        setUseExistingModel(false);
        setSelectedExistingModel(null);
        
      } else {
        // Create new model with training
        console.log('🚀 Starting model training:', modelName);
        
        // Convert images to base64 for secure transmission
        const imageBase64 = await filesToBase64(selectedFiles);

        // Start Astria model training via secure edge function
        const response = await fetch(`https://imzlzufdujhcbebibgpj.supabase.co/functions/v1/generate-headshot`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'train_model',
            name: modelName,
            images: imageBase64,
            steps: 500,
            face_crop: true
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to start training');
        }

        const astriaModel = await response.json();

        console.log('✅ Astria model created via edge function:', astriaModel);
        setTrainingProgress(60);

        // The edge function already handles database model creation and sample saving
        const dbModel = astriaModel.model;
        
        console.log('✅ Database model saved via edge function:', dbModel);
        setTrainingProgress(80);

        setTrainingProgress(100);
        
        toast({
          title: 'Training Started!',
          description: `Model "${modelName}" is now training. This may take 10-15 minutes.`,
        });

        // Reset form
        setModelName('');
        setSelectedFiles([]);
      }
      
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
                {/* Model Selection Options */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Model Options</Label>
                  <div className="flex gap-4">
                    <Button 
                      variant={!useExistingModel ? "default" : "outline"}
                      onClick={() => setUseExistingModel(false)}
                      disabled={isTraining}
                    >
                      Create New Model
                    </Button>
                    <Button 
                      variant={useExistingModel ? "default" : "outline"}
                      onClick={() => setUseExistingModel(true)}
                      disabled={isTraining || astriaModels.length === 0}
                    >
                      Use Existing Model ({astriaModels.length})
                    </Button>
                  </div>
                </div>

                {/* Existing Model Selection */}
                {useExistingModel && astriaModels.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="existingModel" className="text-sm font-medium">
                      Select Existing Model
                    </Label>
                    <Select 
                      value={selectedExistingModel?.id?.toString() || ""} 
                      onValueChange={(value) => {
                        const model = astriaModels.find(m => m.id?.toString() === value);
                        setSelectedExistingModel(model);
                      }}
                      disabled={isTraining}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an existing model..." />
                      </SelectTrigger>
                      <SelectContent>
                        {astriaModels.map((model) => (
                          <SelectItem key={model.id} value={model.id?.toString() || ""}>
                            <div className="flex items-center gap-2">
                              <span>{model.name || `Model ${model.id}`}</span>
                              {model.name && model.name.toLowerCase().includes('newheadhotman') && (
                                <Badge variant="secondary">Default</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedExistingModel && (
                      <div className="text-xs text-muted-foreground">
                        Status: {selectedExistingModel.status} • Created: {selectedExistingModel.created_at ? new Date(selectedExistingModel.created_at).toLocaleDateString() : 'Unknown'}
                      </div>
                    )}
                  </div>
                )}

                {/* Model Name - only show when creating new model */}
                {!useExistingModel && (
                  <div className="space-y-2">
                    <label htmlFor="modelName" className="text-sm font-medium">
                      Model Name
                    </label>
                    <Input
                      id="modelName"
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="Enter model name (e.g., Professional Headshots v2)"
                      disabled={isTraining}
                    />
                  </div>
                )}

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
                  disabled={
                    isTraining || 
                    (useExistingModel 
                      ? !selectedExistingModel || selectedExistingModel.status !== 'trained'
                      : !modelName.trim() || selectedFiles.length < 4
                    )
                  }
                  className="w-full"
                  size="lg"
                >
                  {isTraining ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      {useExistingModel ? 'Adding Model...' : 'Training Model...'}
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      {useExistingModel ? 'Add Existing Model' : 'Start Training'}
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