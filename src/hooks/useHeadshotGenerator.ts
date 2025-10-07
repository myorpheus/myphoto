import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { completeSupabaseService } from '@/services/supabase-complete';
import { supabase } from '@/integrations/supabase/client';
import { filesToBase64 } from '@/utils/file-utils';

type GenerationStep = 'upload' | 'training' | 'generating' | 'completed';

interface UseHeadshotGeneratorReturn {
  currentStep: GenerationStep;
  userCredits: number;
  selectedFiles: File[];
  currentModel: any;
  generatedImages: string[];
  isProcessing: boolean;
  selectedStyle: string;
  selectedGender: string;
  setSelectedStyle: (style: string) => void;
  setSelectedGender: (gender: string) => void;
  handlePhotosSelected: (files: File[]) => Promise<void>;
  handleDownload: (imageUrl: string) => Promise<void>;
  handleStartNew: () => void;
}

export const useHeadshotGenerator = (): UseHeadshotGeneratorReturn => {
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

      const modelName = `headshots-${Date.now()}`;
      console.log('📝 Model name created:', modelName);

      console.log('🎫 Getting user session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      if (!session) {
        console.error('❌ No session found');
        toast({
          title: 'Authentication Required',
          description: 'Please log in again to generate headshots.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }
      console.log('✅ Session obtained, token length:', session.access_token?.length || 0);

      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        console.error('❌ Session expired');
        toast({
          title: 'Session Expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }

      console.log('🔄 Converting images to base64...');
      const imageBase64 = await filesToBase64(files);
      console.log('✅ Images converted, count:', imageBase64.length);

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

        let userMessage = 'Failed to start training';
        if (response.status === 401) {
          userMessage = 'Authentication failed. Please log in again.';
          navigate('/login');
        } else if (response.status === 402) {
          userMessage = 'Insufficient credits. Please purchase more credits.';
        } else if (response.status === 500 && errorData.error?.includes('ASTRIA_API_KEY')) {
          userMessage = 'Service configuration error. Please contact support.';
        } else if (response.status === 400) {
          userMessage = errorData.error || 'Invalid request parameters.';
        } else {
          userMessage = errorData.error || `Server error (${response.status}). Please try again.`;
        }

        toast({
          title: 'Training Failed',
          description: userMessage,
          variant: 'destructive',
        });

        throw new Error(errorData.error || `HTTP ${response.status}: Failed to start training`);
      }

      console.log('✅ Edge function succeeded, parsing response...');
      const astriaModel = await response.json();
      console.log('📊 Astria model response:', astriaModel);

      console.log('💾 Saving model to database...');
      const dbModel = await completeSupabaseService.createModel({
        user_id: user.id,
        astria_model_id: astriaModel.id,
        name: modelName,
        status: astriaModel.status
      });

      setCurrentModel(dbModel);

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
    const maxAttempts = 60;
    let attempts = 0;

    const checkStatus = async (): Promise<void> => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('User not authenticated');

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

        await completeSupabaseService.updateModel(dbModelId, {
          status: astriaModel.status
        });

        if (astriaModel.status === 'trained') {
          await generateHeadshots(dbModelId);
        } else if (astriaModel.status === 'failed') {
          throw new Error('Model training failed');
        } else if (attempts < maxAttempts) {
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
    const maxAttempts = 60;
    let attempts = 0;

    const checkImages = async (): Promise<string[]> => {
      try {
        const images = await completeSupabaseService.getModelImages(dbModelId);

        const completedImages = images.filter(img => img.url && img.status === 'completed');
        const generatingImages = images.filter(img => img.status === 'generating');
        const failedImages = images.filter(img => img.status === 'failed');

        console.log(`Image status check: ${completedImages.length} completed, ${generatingImages.length} generating, ${failedImages.length} failed`);

        if (completedImages.length >= 3) {
          return completedImages.map(img => img.url).filter(Boolean);
        } else if (generatingImages.length === 0 && completedImages.length === 0) {
          throw new Error('All image generation failed');
        } else if (attempts < maxAttempts) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 10000));
          return checkImages();
        } else {
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

      const prompt = 'professional headshot, business attire, clean background, high quality, studio lighting, corporate portrait';

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('User not authenticated');

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

      await response.json();
      console.log('Generation started, polling for completion...');

      const generatedImages = await pollImageCompletion(dbModelId);

      setGeneratedImages(generatedImages);
      setCurrentStep('completed');
      setIsProcessing(false);

      toast({
        title: '🎉 Headshots Generated!',
        description: `Successfully generated ${generatedImages.length} professional headshots. They are now displayed below.`,
        variant: 'default',
      });

      console.log('✅ Headshots generation completed successfully:', generatedImages.length);

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

  return {
    currentStep,
    userCredits,
    selectedFiles,
    currentModel,
    generatedImages,
    isProcessing,
    selectedStyle,
    selectedGender,
    setSelectedStyle,
    setSelectedGender,
    handlePhotosSelected,
    handleDownload,
    handleStartNew,
  };
};
