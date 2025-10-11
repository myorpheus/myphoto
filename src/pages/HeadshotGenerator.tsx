import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PhotoUpload } from '@/components/PhotoUpload';
import PhotoStyleSelector from '@/components/PhotoStyleSelector';
import GenerationOptions from '@/components/GenerationOptions';
import { HeadshotGallery } from '@/components/HeadshotGallery';
import { GenerationProgress } from '@/components/GenerationProgress';
import { PendingImageGrid } from '@/components/PendingImageGrid';
import { useToast } from '@/hooks/use-toast';
import { useHeadshotGenerator } from '@/hooks/useHeadshotGenerator';
import { testConfiguration } from '@/utils/headshotDebug';
import { ArrowLeft, Crown, Coins, Images, Save, Sparkles } from 'lucide-react';

const HeadshotGenerator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    currentStep,
    userCredits,
    isProcessing,
    selectedStyle,
    selectedGender,
    customPrompt,
    generatedImages,
    allGeneratedImages,
    trainedModels,
    setSelectedStyle,
    setSelectedGender,
    setCustomPrompt,
    handlePhotosSelected,
    handleDownload,
    handleStartNew,
    handleSaveCustomPrompt,
    handleGenerateWithExistingModel,
  } = useHeadshotGenerator();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'upload':
        // Only show PhotoUpload if NO trained models exist
        if (trainedModels.length === 0) {
          return <PhotoUpload onPhotosSelected={handlePhotosSelected} />;
        }
        return null; // Model selection is shown in the main card above

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
                {/* Generate Button - Using Default Model */}
                <div className="space-y-4 p-6 border-2 border-primary rounded-lg bg-primary/5 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles className="h-8 w-8 text-primary" />
                    <h3 className="text-lg font-semibold">Generate Professional Headshots</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Using your pre-trained model "new Ru man" to generate high-quality professional headshots instantly.
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateWithExistingModel}
                    disabled={isProcessing}
                    size="lg"
                    className="gap-2 px-12 py-6 text-lg"
                  >
                    <Images className="h-6 w-6" />
                    Generate Headshots Now
                  </Button>
                </div>

                {/* Photo Style Selection */}
                <PhotoStyleSelector
                  selectedStyle={selectedStyle}
                  setSelectedStyle={setSelectedStyle}
                  selectedGender={selectedGender}
                  setSelectedGender={setSelectedGender}
                />

                {/* Custom Prompt Input */}
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="customPrompt" className="text-base font-semibold">
                      Custom Prompt (Optional)
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveCustomPrompt}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save as Default
                    </Button>
                  </div>
                  <Textarea
                    id="customPrompt"
                    placeholder="e.g., cinematic lighting, wearing a black turtleneck, golden hour, only gemini nano banana"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    Add custom details to enhance your headshot generation.
                    This text will be added to your selected style prompt.
                  </p>
                </div>

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