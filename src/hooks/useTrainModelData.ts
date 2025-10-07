// src/hooks/useTrainModelData.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { trainModelService } from '@/services/trainModelService';

export const useTrainModelData = () => {
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

  const loadUserModels = async () => {
    try {
      const userModels = await trainModelService.loadUserModels();
      setModels(userModels);
    } catch (error) {
      console.error('❌ Error loading models:', error);
      if ((error as Error).message === 'User not authenticated') {
        navigate('/login');
        return;
      }
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
      const models = await trainModelService.loadAstriaModels();
      setAstriaModels(models);

      const defaultModel = trainModelService.findDefaultModel(models);
      if (defaultModel) {
        setSelectedExistingModel(defaultModel);
        setUseExistingModel(true);
      }
    } catch (error) {
      console.error('❌ Complete error loading Astria models:', error);
      console.error('❌ Error stack:', (error as Error).stack);

      const errorMessage = (error as Error).message || 'Unknown error occurred';
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

    const filesArray = Array.from(files);

    if (filesArray.length < 4) {
      toast({
        title: 'Insufficient Photos',
        description: 'Please select at least 4 photos for optimal training',
        variant: 'destructive',
      });
      return;
    }

    if (filesArray.length > 20) {
      toast({
        title: 'Too Many Photos',
        description: 'Maximum 20 photos allowed for training',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFiles(filesArray);
    toast({
      title: 'Photos Selected',
      description: `${filesArray.length} photos ready for training`,
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

      setTrainingProgress(20);

      const result = await trainModelService.trainModel({
        useExistingModel,
        modelName,
        selectedFiles,
        selectedExistingModel
      });

      if (useExistingModel) {
        setTrainingProgress(50);
        setTrainingProgress(100);
        setUseExistingModel(false);
        setSelectedExistingModel(null);
      } else {
        setTrainingProgress(60);
        setTrainingProgress(80);
        setTrainingProgress(100);
        setModelName('');
        setSelectedFiles([]);
      }

      toast({
        title: useExistingModel ? 'Model Added!' : 'Training Started!',
        description: result.message,
      });

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

  useEffect(() => {
    loadUserModels();
    loadAstriaModels();
  }, []);

  return {
    // State
    models,
    astriaModels,
    selectedExistingModel,
    useExistingModel,
    isLoading,
    isLoadingAstriaModels,
    isTraining,
    selectedFiles,
    modelName,
    trainingProgress,

    // Setters
    setSelectedExistingModel,
    setUseExistingModel,
    setModelName,
    setSelectedFiles,

    // Methods
    handleFileSelect,
    handleTrainModel,
    loadUserModels,
    loadAstriaModels,
  };
};
