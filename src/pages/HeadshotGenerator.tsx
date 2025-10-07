import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { PhotoUpload } from '@/components/PhotoUpload';
import { HeadshotGallery } from '@/components/HeadshotGallery';
import { GenerationProgress } from '@/components/GenerationProgress';
import { useToast } from '@/hooks/use-toast';
import { completeSupabaseService } from '@/services/supabase-complete';
import { supabase } from '@/integrations/supabase/client';
import { filesToBase64 } from '@/utils/file-utils';
import { ArrowLeft, Crown, Coins, Images } from 'lucide-react';

type GenerationStep = 'upload' | 'training' | 'generating' | 'completed';

const HeadshotGenerator = () => {
  const [currentStep, setCurrentStep] = useState<GenerationStep>('upload');
  const [userCredits, setUserCredits] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentModel, setCurrentModel] = useState<any>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('professional');
  const [selectedGender, setSelectedGender] = useState<string>('man');
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
    console.log('🚀 Generate headshots button clicked - Starting debug');
    console.log('📊 User credits:', userCredits);
    console.log('📸 Files selected:', files.length);
    
    if (userCredits < 1) {
      console.error('❌ Insufficient credits:', userCredits);
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
      console.log('🔐 Getting user authentication...');
      const user = await completeSupabaseService.getCurrentUser();
      if (!user) {
        console.error('❌ User not authenticated');
        throw new Error('User not authenticated');
      }
      console.log('✅ User authenticated:', user.id);

      // Create model name
      const modelName = `headshots-${Date.now()}`;
      console.log('📝 Model name created:', modelName);

      // Get user session for authentication
      console.log('🎫 Getting user session...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No session found');
        throw new Error('User not authenticated');
      }
      console.log('✅ Session obtained, token length:', session.access_token?.length || 0);

      // Convert images to base64 for secure transmission
      console.log('🔄 Converting images to base64...');
      const imageBase64 = await filesToBase64(files);
      console.log('✅ Images converted, count:', imageBase64.length);

      // Train model with secure edge function
      console.log('📡 Calling generate-headshot edge function...');
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

      console.log('📡 Edge function response status:', response.status);
      console.log('📡 Edge function response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('❌ Edge function failed with status:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to start training`);
      }

      console.log('✅ Edge function succeeded, parsing response...');
      const astriaModel = await response.json();
      console.log('📊 Astria model response:', astriaModel);

      // Save model to database
      console.log('💾 Saving model to database...');
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
      console.error('❌ COMPLETE ERROR DETAILS:');
      console.error('Error object:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      toast({
        title: 'Training Failed', 
        description: `Failed to train your model: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`,
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
        // Get user session for authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('User not authenticated');

        // Check model status via edge function
        const response = await fetch(`https://imzlzufdujhcbebibgpj.supabase.co/functions/v1/generate-headshot`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'check_status',
            tune_id: astriaModelId
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check model status');
        }

        const statusResponse = await response.json();
        const astriaModel = statusResponse.status;
        
        // Update database model status
        await completeSupabaseService.updateModel(dbModelId, {
          status: astriaModel.status
        });

        if (astriaModel.status === 'trained') {
          // Model is ready, start generating images
          await generateHeadshots(dbModelId);
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

  const pollImageCompletion = async (dbModelId: number): Promise<string[]> => {
    const maxAttempts = 60; // 10 minutes with 10-second intervals
    let attempts = 0;

    const checkImages = async (): Promise<string[]> => {
      try {
        // Get images from database
        const images = await completeSupabaseService.getModelImages(dbModelId);
        
        // Check if all images have URLs (completed)
        const completedImages = images.filter(img => img.url && img.status === 'completed');
        const generatingImages = images.filter(img => img.status === 'generating');
        const failedImages = images.filter(img => img.status === 'failed');

        console.log(`Image status check: ${completedImages.length} completed, ${generatingImages.length} generating, ${failedImages.length} failed`);

        if (completedImages.length >= 3) {
          // At least 3 images completed successfully
          return completedImages.map(img => img.url).filter(Boolean);
        } else if (generatingImages.length === 0 && completedImages.length === 0) {
          // All failed
          throw new Error('All image generation failed');
        } else if (attempts < maxAttempts) {
          // Continue polling
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
          return checkImages();
        } else {
          // Timeout - return whatever we have
          if (completedImages.length > 0) {
            return completedImages.map(img => img.url).filter(Boolean);
          }
          throw new Error('Image generation timeout - images took too long to complete');
        }
      } catch (error) {
        console.error('Error checking image completion:', error);
        throw error;
      }
    };

    return await checkImages();
  };

  const generateHeadshots = async (dbModelId: number) => {
    setCurrentStep('generating');

    try {
      const user = await completeSupabaseService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Generate 4 professional headshots with one API call
      const prompt = 'professional headshot, business attire, clean background, high quality, studio lighting, corporate portrait';
      
      // Get user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('User not authenticated');

      // Generate images via secure edge function
      const response = await fetch(`https://imzlzufdujhcbebibgpj.supabase.co/functions/v1/generate-headshot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_image',
          model_id: dbModelId,
          prompt: prompt,
          style: selectedStyle,
          gender: selectedGender,
          num_images: 4,
          steps: 50,
          cfg_scale: 7
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate images');
      }

      await response.json(); // Start generation
      console.log('Generation started, polling for completion...');

      // Poll the database for completed images (webhook updates them)
      const generatedImages = await pollImageCompletion(dbModelId);

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

  // Debug function to test edge function configuration
  const testConfiguration = async () => {
    console.log('🧪 Testing edge function configuration...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No session for config test');
        return;
      }
      
      const response = await fetch(`https://imzlzufdujhcbebibgpj.supabase.co/functions/v1/generate-headshot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'list_models' // This action exists in the edge function for debugging
        }),
      });

      console.log('🧪 Config test response status:', response.status);
      const responseText = await response.text();
      console.log('🧪 Config test response:', responseText);
      
      toast({
        title: 'Configuration Test',
        description: `Edge function responded with status ${response.status}. Check console for details.`,
      });
      
    } catch (error) {
      console.error('❌ Configuration test failed:', error);
      toast({
        title: 'Configuration Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
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
            <Button
              variant="outline"
              onClick={() => navigate('/gallery')}
              disabled={isProcessing}
            >
              <Images className="w-4 h-4 mr-2" />
              Gallery
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={testConfiguration}
              disabled={isProcessing}
              className="text-xs"
            >
              🧪 Test Config
            </Button>
            
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
              <CardContent className="space-y-6">
                {/* Photo Style Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Choose Your Photo Style</h3>
                  <RadioGroup 
                    value={selectedStyle} 
                    onValueChange={setSelectedStyle}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="professional" id="professional" />
                      <Label htmlFor="professional" className="cursor-pointer flex-1">
                        <div>
                          <div className="font-medium">Professional/Corporate</div>
                          <div className="text-sm text-muted-foreground">Full face frontal headshot, perfect for LinkedIn and business</div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="doctor" id="doctor" />
                      <Label htmlFor="doctor" className="cursor-pointer flex-1">
                        <div>
                          <div className="font-medium">Doctor/Medical</div>
                          <div className="text-sm text-muted-foreground">Professional medical headshot, ideal for healthcare professionals</div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="boudoir" id="boudoir" />
                      <Label htmlFor="boudoir" className="cursor-pointer flex-1">
                        <div>
                          <div className="font-medium">Boudoir/Artistic</div>
                          <div className="text-sm text-muted-foreground">Mid-body artistic shot with tasteful styling</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {/* Gender Selection for Boudoir */}
                  {selectedStyle === 'boudoir' && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Select Gender for Styling</h4>
                      <RadioGroup 
                        value={selectedGender} 
                        onValueChange={setSelectedGender}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="man" id="man" />
                          <Label htmlFor="man">Man (shirtless styling)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="woman" id="woman" />
                          <Label htmlFor="woman">Woman (elegant lingerie)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </div>

                {/* Generation Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">1 Credit</Badge>
                    <span className="text-sm">Per generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">4 Headshots</Badge>
                    <span className="text-sm">Different angles</span>
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