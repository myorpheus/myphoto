import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabaseService } from '@/services/supabase';
import { astriaService } from '@/services/astria';
import { useDropzone } from 'react-dropzone';
import { Upload, X, ArrowLeft } from 'lucide-react';

const TrainModel = () => {
  const [modelName, setModelName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 20,
    onDrop: (acceptedFiles) => {
      setSelectedFiles(prev => [...prev, ...acceptedFiles]);
    },
    onDropRejected: (fileRejections) => {
      toast({
        title: 'Invalid files',
        description: 'Please only upload JPEG, JPG, or PNG images',
        variant: 'destructive',
      });
    }
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleTrain = async () => {
    if (!modelName.trim()) {
      toast({
        title: 'Model name required',
        description: 'Please enter a name for your model',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFiles.length < 4) {
      toast({
        title: 'More photos needed',
        description: 'Please upload at least 4 photos for training',
        variant: 'destructive',
      });
      return;
    }

    setIsTraining(true);

    try {
      const user = await supabaseService.getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Check if user has enough credits
      const credits = await supabaseService.getUserCredits(user.id);
      if (credits < 1) {
        toast({
          title: 'Insufficient credits',
          description: 'You need at least 1 credit to train a model',
          variant: 'destructive',
        });
        navigate('/credits');
        return;
      }

      // Create model record in Supabase first
      const modelRecord = await supabaseService.createModel({
        name: modelName,
        status: 'training',
        user_id: user.id,
        type: 'headshot',
      });

      // Start training with Astria
      const astriaModel = await astriaService.trainModel({
        name: modelName,
        images: selectedFiles,
        steps: 500,
        face_crop: true,
      });

      // Update the model record with Astria model ID
      await supabaseService.updateModel(modelRecord.id, {
        modelId: astriaModel.id.toString(),
        status: 'training',
      });

      // Deduct credit
      await supabaseService.decrementUserCredits(user.id, 1);

      toast({
        title: 'Training started!',
        description: 'Your model is now training. This usually takes 10-20 minutes.',
      });

      navigate('/overview');
    } catch (error) {
      console.error('Training error:', error);
      toast({
        title: 'Training failed',
        description: 'Failed to start model training. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/overview')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Train New Model</h1>
        </div>
      </header>

      <main className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Your AI Model</CardTitle>
            <CardDescription>
              Upload 4-20 photos of yourself to train your personalized AI model.
              Best results come from clear, well-lit photos showing your face from different angles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Model Name</label>
              <Input
                placeholder="e.g., My Professional Headshots"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Upload Photos ({selectedFiles.length}/20)
              </label>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive
                    ? 'Drop your photos here...'
                    : 'Drag & drop photos here, or click to select files'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  JPEG, JPG, PNG supported • 4-20 photos recommended
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <div className="grid grid-cols-3 gap-4">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Tips for best results:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use clear, high-quality photos</li>
                <li>• Include variety: different angles, expressions, lighting</li>
                <li>• Avoid sunglasses, hats, or face obstructions</li>
                <li>• Only include photos of yourself (one person per photo)</li>
              </ul>
            </div>

            <Button 
              onClick={handleTrain} 
              className="w-full"
              disabled={isTraining || selectedFiles.length < 4 || !modelName.trim()}
            >
              {isTraining ? 'Starting Training...' : 'Start Training (1 Credit)'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TrainModel;