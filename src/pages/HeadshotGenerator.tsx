import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PhotoUpload } from '@/components/PhotoUpload';
import { HeadshotGallery } from '@/components/HeadshotGallery';
import { GenerationProgress } from '@/components/GenerationProgress';
import { useToast } from '@/hooks/use-toast';
import { completeSupabaseService } from '@/services/supabase-complete';
import { astriaService } from '@/services/astria';
import { ArrowLeft, Crown, Coins } from 'lucide-react';

type GenerationStep = 'upload' | 'training' | 'generating' | 'completed';

const HeadshotGenerator = () => {
  const [currentStep, setCurrentStep] = useState<GenerationStep>('upload');
  const [userCredits, setUserCredits] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentModel, setCurrentModel] = useState<any>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await completeSupabaseService.getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const credits = await completeSupabaseService.getUserCredits(user.id);
      setUserCredits(credits);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your account information',
        variant: 'destructive',
      });
    }
  };

  const handlePhotosSelected = async (files: File[]) => {
    if (userCredits < 1) {
      toast({
        title: 'Insufficient Credits',
        description: 'You need at least 1 credit to generate headshots. Purchase more credits to continue.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFiles(files);
    setCurrentStep('training');
    setIsProcessing(true);

    try {
      const user = await completeSupabaseService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Create model name
      const modelName = `headshots-${Date.now()}`;

      // Train model with Astria
      const astriaModel = await astriaService.trainModel({
        name: modelName,
        images: files,
        steps: 500,
        face_crop: true
      });

      // Save model to database
      const dbModel = await completeSupabaseService.createModel({
        user_id: user.id,
        astria_model_id: astriaModel.id,
        name: modelName,
        status: astriaModel.status
      });

      setCurrentModel(dbModel);

      // Save uploaded samples to database
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await completeSupabaseService.createSample({
          user_id: user.id,
          model_id: dbModel.id,
          file_name: file.name,
          file_path: `samples/${user.id}/${dbModel.id}/${file.name}`,
          file_size: file.size
        });
      }

      // Poll for training completion
      await pollModelTraining(astriaModel.id, dbModel.id);

    } catch (error) {
      console.error('Error training model:', error);
      toast({
        title: 'Training Failed',
        description: 'Failed to train your model. Please try again.',
        variant: 'destructive',
      });
      setCurrentStep('upload');
      setIsProcessing(false);
    }
  };

  const pollModelTraining = async (astriaModelId: number, dbModelId: number) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const checkStatus = async (): Promise<void> => {
      try {
        const astriaModel = await astriaService.getModel(astriaModelId);
        
        // Update database model status
        await completeSupabaseService.updateModel(dbModelId, {
          status: astriaModel.status
        });

        if (astriaModel.status === 'trained') {
          // Model is ready, start generating images
          await generateHeadshots(astriaModelId, dbModelId);
        } else if (astriaModel.status === 'failed') {
          throw new Error('Model training failed');
        } else if (attempts < maxAttempts) {
          // Continue polling
          attempts++;
          setTimeout(checkStatus, 5000);
        } else {
          throw new Error('Training timeout - model took too long to train');
        }
      } catch (error) {
        console.error('Error checking model status:', error);
        throw error;
      }
    };

    await checkStatus();
  };

  const generateHeadshots = async (astriaModelId: number, dbModelId: number) => {
    setCurrentStep('generating');

    try {
      const user = await completeSupabaseService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Generate images with various professional prompts
      const prompts = [
        'professional headshot, business attire, office background, high quality, studio lighting',
        'executive portrait, suit and tie, corporate headshot, professional lighting',
        'linkedin profile photo, business casual, clean background, sharp focus',
        'professional headshot, confident expression, neutral background, high resolution'
      ];

      const generatedImages: string[] = [];

      for (const prompt of prompts) {
        try {
          const astriaImages = await astriaService.generateImages({
            modelId: astriaModelId,
            prompt,
            num_images: 1,
            steps: 50,
            cfg_scale: 7
          });

          // Save generated images to database
          for (const astriaImage of astriaImages) {
            const dbImage = await completeSupabaseService.createImage({
              model_id: dbModelId,
              user_id: user.id,
              astria_image_id: astriaImage.id,
              url: astriaImage.url,
              prompt,
              status: 'completed'
            });

            generatedImages.push(astriaImage.url);
          }
        } catch (error) {
          console.error('Error generating image with prompt:', prompt, error);
        }
      }

      // Deduct credit for successful generation
      await completeSupabaseService.decrementUserCredits(user.id, 1);
      setUserCredits(prev => prev - 1);

      setGeneratedImages(generatedImages);
      setCurrentStep('completed');
      setIsProcessing(false);

      toast({
        title: 'Success!',
        description: `Generated ${generatedImages.length} professional headshots`,
      });

    } catch (error) {
      console.error('Error generating headshots:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate headshots. Please try again.',
        variant: 'destructive',
      });
      setCurrentStep('upload');
      setIsProcessing(false);
    }
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `headshot-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleStartNew = () => {
    setCurrentStep('upload');
    setSelectedFiles([]);
    setCurrentModel(null);
    setGeneratedImages([]);
    setIsProcessing(false);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'upload':
        return <PhotoUpload onPhotosSelected={handlePhotosSelected} />;
      
      case 'training':
        return (
          <GenerationProgress 
            status="Training your AI model..."
            description="This usually takes 5-10 minutes. We're learning your unique features."
          />
        );
      
      case 'generating':
        return (
          <GenerationProgress 
            status="Generating professional headshots..."
            description="Creating high-quality headshots with different styles and backgrounds."
          />
        );
      
      case 'completed':
        return (
          <HeadshotGallery 
            images={generatedImages}
            onDownload={handleDownload}
            onStartNew={handleStartNew}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/overview')}
              disabled={isProcessing}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">AI Headshot Generator</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">{userCredits} credits</span>
              </div>
            </Card>
            
            {userCredits < 5 && (
              <Button variant="outline" onClick={() => navigate('/credits')}>
                <Crown className="w-4 h-4 mr-2" />
                Get More Credits
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-8">
        {currentStep === 'upload' && (
          <div className="max-w-4xl mx-auto mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Professional AI Headshots</CardTitle>
                <CardDescription>
                  Upload 4-10 photos of yourself to train a personalized AI model. 
                  Our AI will generate professional headshots perfect for LinkedIn, resumes, and business profiles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">1 Credit</Badge>
                    <span className="text-sm">Per generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">4 Headshots</Badge>
                    <span className="text-sm">Different styles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">High Quality</Badge>
                    <span className="text-sm">Professional results</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {renderCurrentStep()}
      </main>
    </div>
  );
};

export default HeadshotGenerator;