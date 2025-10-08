import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoUpload } from '@/components/PhotoUpload';
import PhotoStyleSelector from '@/components/PhotoStyleSelector';
import GenerationOptions from '@/components/GenerationOptions';
import { HeadshotGallery } from '@/components/HeadshotGallery';
import { GenerationProgress } from '@/components/GenerationProgress';
import { PendingImageGrid } from '@/components/PendingImageGrid';
import { useToast } from '@/hooks/use-toast';
import { useHeadshotGenerator } from '@/hooks/useHeadshotGenerator';
import { testConfiguration } from '@/utils/headshotDebug';
import { ArrowLeft, Crown, Coins, Images } from 'lucide-react';

const HeadshotGenerator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    currentStep,
    userCredits,
    isProcessing,
    selectedStyle,
    selectedGender,
    generatedImages,
    allGeneratedImages,
    setSelectedStyle,
    setSelectedGender,
    handlePhotosSelected,
    handleDownload,
    handleStartNew,
  } = useHeadshotGenerator();

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
          <div className="space-y-6">
            <GenerationProgress
              status="Generating professional headshots..."
              description="Watch your images appear as they're generated!"
            />
            {allGeneratedImages.length > 0 && (
              <PendingImageGrid images={allGeneratedImages} expectedCount={4} />
            )}
          </div>
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
              onClick={() => testConfiguration(toast, navigate)}
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
                <PhotoStyleSelector
                  selectedStyle={selectedStyle}
                  setSelectedStyle={setSelectedStyle}
                  selectedGender={selectedGender}
                  setSelectedGender={setSelectedGender}
                />

                {/* Generation Info */}
                <GenerationOptions />
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