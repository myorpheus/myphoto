import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { headshotGeneratorService } from '@/services/headshotGeneratorService';

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
      const user = await headshotGeneratorService.getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const credits = await headshotGeneratorService.getUserCredits(user.id);
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

      const model = await headshotGeneratorService.getModelImages(dbModelId);
      const tuneId = model[0]?.model_id || 0;

      const generateResponse = await headshotGeneratorService.generateImage({
        tuneId,
        prompt,
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
