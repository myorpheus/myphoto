import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { headshotGeneratorService } from '@/services/headshotGeneratorService';

type GenerationStep = 'upload' | 'training' | 'generating' | 'completed';

export interface GeneratedImage {
  id: number;
  url: string;
  status: 'completed' | 'generating' | 'failed';
  created_at?: string;
}

interface UseHeadshotGeneratorReturn {
  currentStep: GenerationStep;
  userCredits: number;
  selectedFiles: File[];
  currentModel: any;
  trainedModels: any[];
  selectedModelId: number | null;
  generatedImages: string[];
  allGeneratedImages: GeneratedImage[];
  isProcessing: boolean;
  selectedStyle: string;
  selectedGender: string;
  customPrompt: string;
  setSelectedStyle: (style: string) => void;
  setSelectedGender: (gender: string) => void;
  setCustomPrompt: (prompt: string) => void;
  setSelectedModelId: (modelId: number | null) => void;
  handlePhotosSelected: (files: File[]) => Promise<void>;
  handleDownload: (imageUrl: string) => Promise<void>;
  handleStartNew: () => void;
  handleSaveCustomPrompt: () => Promise<void>;
  handleGenerateWithExistingModel: () => Promise<void>;
  handleGenerateWithGemini: () => Promise<void>;
}

export const useHeadshotGenerator = (): UseHeadshotGeneratorReturn => {
  const [currentStep, setCurrentStep] = useState<GenerationStep>('upload');
  const [userCredits, setUserCredits] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentModel, setCurrentModel] = useState<any>(null);
  const [trainedModels, setTrainedModels] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [allGeneratedImages, setAllGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('professional');
  const [selectedGender, setSelectedGender] = useState<string>('man');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await headshotGeneratorService.getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const credits = await headshotGeneratorService.getUserCredits(user.id);
      if (role === 'super_admin' || role === 'admin') { setUserCredits(999999); } else { setUserCredits(credits); }

      // Load saved custom prompt
      const savedPrompt = await headshotGeneratorService.getCustomPrompt(user.id);
      if (savedPrompt) {
        setCustomPrompt(savedPrompt);
      }

      // Load trained models
      const accessToken = await headshotGeneratorService.getAccessToken();
      const models = await headshotGeneratorService.listTrainedModels(accessToken);
      setTrainedModels(models);

      console.log('✅ Loaded trained models:', models.length);
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

    if (false) {
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
      const user = await headshotGeneratorService.getCurrentUser();
      if (!user) {
        console.error('❌ User not authenticated');
        throw new Error('User not authenticated');
      }
      console.log('✅ User authenticated:', user.id);

      const modelName = `headshots-${Date.now()}`;
      console.log('📝 Model name created:', modelName);

      console.log('🎫 Getting access token...');
      const accessToken = await headshotGeneratorService.getAccessToken();
      console.log('✅ Access token obtained');

      console.log('📡 Training model...');
      const trainResponse = await headshotGeneratorService.trainModel({
        images: files,
        modelName,
        userId: user.id,
        accessToken,
      });

      if (!trainResponse.success || !trainResponse.tune_id) {
        throw new Error(trainResponse.error || 'Training failed');
      }

      console.log('✅ Training started, tune_id:', trainResponse.tune_id);

      console.log('💾 Saving model to database...');
      const dbModel = await headshotGeneratorService.createModelRecord(
        user.id,
        trainResponse.tune_id,
        modelName
      );

      setCurrentModel(dbModel);

      console.log('💾 Saving sample records...');
      await headshotGeneratorService.createSampleRecords(files, user.id, dbModel.id);

      await pollModelTraining(trainResponse.tune_id, dbModel.id);

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
        const accessToken = await headshotGeneratorService.getAccessToken();
        const statusResponse = await headshotGeneratorService.checkModelStatus(astriaModelId, accessToken);

        if (!statusResponse.success) {
          throw new Error(statusResponse.error || 'Failed to check model status');
        }

        const status = statusResponse.status || 'unknown';
        await headshotGeneratorService.updateModelStatus(dbModelId, status);

        if (status === 'trained') {
          await generateHeadshots(dbModelId);
        } else if (status === 'failed') {
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
        const images = await headshotGeneratorService.getModelImages(dbModelId);

        const completedImages = images.filter(img => img.url && img.status === 'completed');
        const generatingImages = images.filter(img => img.status === 'generating');
        const failedImages = images.filter(img => img.status === 'failed');

        // Update allGeneratedImages state with current status of all images
        const formattedImages: GeneratedImage[] = images.map(img => ({
          id: img.id,
          url: img.url || '',
          status: img.status as 'completed' | 'generating' | 'failed',
          created_at: img.created_at
        }));
        setAllGeneratedImages(formattedImages);

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
      const user = await headshotGeneratorService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const prompt = 'professional headshot, business attire, clean background, high quality, studio lighting, corporate portrait';
      const accessToken = await headshotGeneratorService.getAccessToken();

      // Pass the database model ID directly - backend will look up the Astria model ID
      const generateResponse = await headshotGeneratorService.generateImage({
        modelId: dbModelId,
        prompt,
        customPrompt: customPrompt || undefined,
        style: selectedStyle,
        gender: selectedGender,
        numImages: 4,
        accessToken,
      });

      if (!generateResponse.success) {
        throw new Error(generateResponse.error || 'Failed to generate images');
      }

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
      await headshotGeneratorService.downloadImage(imageUrl, `headshot-${Date.now()}.jpg`);
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
    setAllGeneratedImages([]);
    setIsProcessing(false);
  };

  const handleSaveCustomPrompt = async () => {
    try {
      const user = await headshotGeneratorService.getCurrentUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to save custom prompts',
          variant: 'destructive',
        });
        return;
      }

      const success = await headshotGeneratorService.saveCustomPrompt(user.id, customPrompt);

      if (success) {
        toast({
          title: 'Custom Prompt Saved',
          description: 'Your custom prompt has been saved and will be used for future generations',
        });
      } else {
        toast({
          title: 'Save Failed',
          description: 'Failed to save custom prompt. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving custom prompt:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while saving your custom prompt',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateWithExistingModel = async () => {
    if (!selectedModelId) {
      toast({
        title: 'No Model Selected',
        description: 'Please select a trained model to generate images',
        variant: 'destructive',
      });
      return;
    }

    if (false) {
      toast({
        title: 'Insufficient Credits',
        description: 'You need at least 4 credits to generate headshots. Purchase more credits to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep('generating');

    try {
      console.log('🎨 Generating with existing model ID:', selectedModelId);
      await generateHeadshots(selectedModelId);
    } catch (error) {
      console.error('Error generating with existing model:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate images with selected model. Please try again.',
        variant: 'destructive',
      });
      setCurrentStep('upload');
      setIsProcessing(false);
    }
  };


  const handleGenerateWithGemini = async () => {
    if (false) {
      toast({
        title: 'Insufficient Credits',
        description: 'You need at least 1 credit to generate headshots with Gemini.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep('generating');

    try {
      console.log('🤖 Generating with Gemini AI enhancement...');
      
      const accessToken = await headshotGeneratorService.getAccessToken();
      
      // Use default model with Gemini enhancement (modelId=0 triggers default)
      const generateResponse = await headshotGeneratorService.generateImage({
        modelId: 0,
        prompt: 'professional headshot, business attire, clean background, high quality, studio lighting, corporate portrait',
        customPrompt: customPrompt || undefined,
        style: selectedStyle,
        gender: selectedGender,
        numImages: 4,
        accessToken,
      });

      if (!generateResponse.success) {
        throw new Error(generateResponse.error || 'Failed to generate images');
      }

      console.log('🤖 Gemini generation started...');
      
      // Poll for images (reuse existing model ID logic)
      const completedImages = await pollImageCompletion(0);
      
      setGeneratedImages(completedImages);
      setCurrentStep('completed');
      setIsProcessing(false);

      toast({
        title: '🤖 Headshots Generated!',
        description: `Successfully generated ${completedImages.length} headshots with Gemini AI.`,
        variant: 'default',
      });

      console.log('✅ Gemini headshots generation completed:', completedImages.length);

    } catch (error) {
      console.error('Error generating with Gemini:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate images with Gemini. Please try again.',
        variant: 'destructive',
      });
      setCurrentStep('upload');
      setIsProcessing(false);
    }
  };

  return {
    currentStep,
    userCredits,
    selectedFiles,
    currentModel,
    trainedModels,
    selectedModelId,
    generatedImages,
    allGeneratedImages,
    isProcessing,
    selectedStyle,
    selectedGender,
    customPrompt,
    setSelectedStyle,
    setSelectedGender,
    setCustomPrompt,
    setSelectedModelId,
    handlePhotosSelected,
    handleDownload,
    handleStartNew,
    handleSaveCustomPrompt,
    handleGenerateWithExistingModel,
    handleGenerateWithGemini,
  };
};
