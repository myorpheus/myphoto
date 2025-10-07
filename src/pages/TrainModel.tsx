import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { completeSupabaseService } from '@/services/supabase-complete';
import { supabase } from '@/integrations/supabase/client';
import { filesToBase64 } from '@/utils/file-utils';
import TrainModelForm from '@/components/TrainModelForm';
import TrainingResults from '@/components/TrainingResults';

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

  // Debug: Monitor button disabled state
  useEffect(() => {
    const buttonDisabled = isTraining || 
      (useExistingModel 
        ? !selectedExistingModel || (selectedExistingModel?.status && selectedExistingModel.status !== 'trained' && selectedExistingModel.status !== 'finished')
        : !modelName.trim() || selectedFiles.length < 4
      );
    
    console.log('🔍 Button disabled state changed:', buttonDisabled);
    console.log('  - isTraining:', isTraining);
    console.log('  - useExistingModel:', useExistingModel);
    console.log('  - modelName:', modelName);
    console.log('  - selectedFiles.length:', selectedFiles.length);
    console.log('  - selectedExistingModel:', selectedExistingModel?.name || 'none');
  }, [isTraining, useExistingModel, modelName, selectedFiles.length, selectedExistingModel]);

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
      
      console.log('🔄 Starting Astria models loading process...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!session) {
        console.warn('⚠️ No session available for loading Astria models');
        toast({
          title: 'Authentication Required',
          description: 'Please log in to load existing models.',
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ Session valid, user ID:', session.user?.id);
      console.log('🔍 Session expires at:', new Date(session.expires_at * 1000));
      console.log('🔄 Calling edge function for model list...');
      
      const apiUrl = `https://imzlzufdujhcbebibgpj.supabase.co/functions/v1/generate-headshot`;
      console.log('🌐 API URL:', apiUrl);
      
      const requestPayload = { action: 'list_models' };
      console.log('📤 Request payload:', requestPayload);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const textResponse = await response.text();
            console.error('❌ Non-JSON error response:', textResponse);
            errorData = { error: textResponse, rawResponse: textResponse };
          }
        } catch (parseError) {
          console.error('❌ Error parsing response:', parseError);
          errorData = { error: 'Failed to parse error response', parseError: parseError.message };
        }
        
        console.error('❌ Detailed API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: apiUrl
        });
        
        const errorMessage = `API Error ${response.status}: ${errorData?.error || response.statusText}${
          errorData?.apiKeyConfigured === false ? ' (API Key not configured)' : ''
        }${errorData?.details ? ` - ${errorData.details}` : ''}`;
        
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await response.json();
        console.log('✅ Raw API response:', result);
      } catch (parseError) {
        console.error('❌ Failed to parse successful response:', parseError);
        throw new Error('Invalid response format from API');
      }
      
      if (!result.success) {
        console.error('❌ API returned failure:', result);
        throw new Error(result.error || 'API returned unsuccessful response');
      }
      
      if (!result.models) {
        console.warn('⚠️ No models property in response:', result);
        setAstriaModels([]);
        return;
      }
      
      if (!Array.isArray(result.models)) {
        console.warn('⚠️ Models is not an array:', typeof result.models, result.models);
        setAstriaModels([]);
        return;
      }
      
      console.log('📊 Model count:', result.models.length);
      console.log('📋 Model details:', result.models.map((m, i) => ({
        index: i,
        id: m.id,
        name: m.name || m.title,
        status: m.status,
        created_at: m.created_at
      })));
      
      setAstriaModels(result.models);
      
      // Enhanced model search with multiple fallback strategies
      console.log('🔍 Searching for default model...');
      
      // Strategy 1: Look for specific name patterns
      let defaultModel = result.models.find((model: any) => {
        const name = (model.name || model.title || '').toLowerCase();
        const matches = name.includes('newheadhotman') || name.includes('newheadshot');
        if (matches) {
          console.log('🎯 Found model by name pattern:', model);
        }
        return matches;
      });
      
      // Strategy 2: Look for any headshot-related models if specific not found
      if (!defaultModel) {
        defaultModel = result.models.find((model: any) => {
          const name = (model.name || model.title || '').toLowerCase();
          const matches = name.includes('headshot') || name.includes('head');
          if (matches) {
            console.log('🎯 Found model by headshot pattern:', model);
          }
          return matches;
        });
      }
      
      // Strategy 3: Use first trained model as fallback (handle undefined status)
      if (!defaultModel) {
        defaultModel = result.models.find((model: any) => {
          const isTrained = model.status === 'trained' || model.status === 'finished' || !model.status; // undefined status is OK
          if (isTrained) {
            console.log('🎯 Found trained/available model as fallback:', model);
          }
          return isTrained;
        });
      }
      
      // Strategy 4: Use any available model
      if (!defaultModel && result.models.length > 0) {
        defaultModel = result.models[0];
        console.log('🎯 Using first available model:', defaultModel);
      }
      
      if (defaultModel) {
        console.log('✅ Selected default model:', {
          id: defaultModel.id,
          name: defaultModel.name || defaultModel.title,
          status: defaultModel.status
        });
        setSelectedExistingModel(defaultModel);
        setUseExistingModel(true);
      } else {
        console.log('⚠️ No suitable default model found');
      }
      
    } catch (error) {
      console.error('❌ Complete error loading Astria models:', error);
      console.error('❌ Error stack:', error.stack);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Unknown error occurred';
      toast({
        title: 'Failed to Load Models',
        description: `Could not load existing Astria models: ${errorMessage}. You can still create new models.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAstriaModels(false);
      console.log('🏁 Finished loading Astria models');
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
    console.log('🚀 handleTrainModel called');
    console.log('🔍 useExistingModel:', useExistingModel);
    console.log('🔍 modelName:', modelName);
    console.log('🔍 selectedFiles:', selectedFiles.length);
    console.log('🔍 selectedExistingModel:', selectedExistingModel);

    // Validation for new model creation
    if (!useExistingModel) {
      if (!modelName.trim()) {
        console.log('❌ Validation failed: Model name required');
        toast({
          title: 'Model Name Required',
          description: 'Please enter a name for your model',
          variant: 'destructive',
        });
        return;
      }

      if (selectedFiles.length < 4) {
        console.log('❌ Validation failed: Insufficient photos');
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

      // Handle undefined status from Astria API - treat as available
      // Allow models with undefined status (common in Astria API) or trained/finished status
      const isModelReady = !selectedExistingModel.status || 
                          selectedExistingModel.status === 'trained' || 
                          selectedExistingModel.status === 'finished';
                          
      if (!isModelReady) {
        toast({
          title: 'Model Not Ready',
          description: `Selected model status is "${selectedExistingModel.status}". Please select a trained model.`,
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
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        useExistingModel,
        modelName,
        selectedFilesCount: selectedFiles.length,
        selectedExistingModel: selectedExistingModel?.name || 'none'
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Training Failed',
        description: `Failed to start model training: ${errorMessage}. Check console for details.`,
        variant: 'destructive',
      });
    } finally {
      setIsTraining(false);
      setTrainingProgress(0);
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
                <TrainModelForm
                  astriaModels={astriaModels}
                  selectedExistingModel={selectedExistingModel}
                  setSelectedExistingModel={setSelectedExistingModel}
                  useExistingModel={useExistingModel}
                  setUseExistingModel={setUseExistingModel}
                  modelName={modelName}
                  setModelName={setModelName}
                  selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles}
                  isTraining={isTraining}
                  trainingProgress={trainingProgress}
                  handleFileSelect={handleFileSelect}
                  handleTrainModel={handleTrainModel}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="existing" className="space-y-6">
            <TrainingResults
              models={models}
              isLoading={isLoading}
              isLoadingAstriaModels={isLoadingAstriaModels}
              loadUserModels={loadUserModels}
              loadAstriaModels={loadAstriaModels}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TrainModel;