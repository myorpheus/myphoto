import { useState } from "react";
import { Hero } from "@/components/Hero";
import { PhotoUpload } from "@/components/PhotoUpload";
import { GenerationProgress } from "@/components/GenerationProgress";
import { HeadshotGallery } from "@/components/HeadshotGallery";
import { useToast } from "@/hooks/use-toast";

type AppStep = "hero" | "upload" | "processing" | "results";

const Index = () => {
  const [step, setStep] = useState<AppStep>("hero");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"training" | "generating" | "completed">("training");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const { toast } = useToast();

  const handleGetStarted = () => {
    setStep("upload");
  };

  const handlePhotosSelected = (files: File[]) => {
    setStep("processing");
    simulateGeneration();
  };

  const simulateGeneration = () => {
    // Simulate training phase
    setStatus("training");
    let currentProgress = 0;
    
    const trainingInterval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      
      if (currentProgress >= 50) {
        clearInterval(trainingInterval);
        setStatus("generating");
        
        // Simulate generation phase
        const generatingInterval = setInterval(() => {
          currentProgress += 10;
          setProgress(currentProgress);
          
          if (currentProgress >= 100) {
            clearInterval(generatingInterval);
            setStatus("completed");
            
            // Set placeholder images
            setTimeout(() => {
              setGeneratedImages([
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
                "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400",
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
                "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400",
              ]);
              setStep("results");
            }, 1000);
          }
        }, 500);
      }
    }, 500);
  };

  const handleDownload = (imageUrl: string) => {
    toast({
      title: "Download started",
      description: "Your headshot is being downloaded",
    });
    // In production, this would trigger actual download
    window.open(imageUrl, "_blank");
  };

  const handleStartNew = () => {
    setStep("upload");
    setProgress(0);
    setStatus("training");
    setGeneratedImages([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {step === "hero" && <Hero onGetStarted={handleGetStarted} />}
      {step === "upload" && <PhotoUpload onPhotosSelected={handlePhotosSelected} />}
      {step === "processing" && <GenerationProgress status={status} progress={progress} />}
      {step === "results" && (
        <HeadshotGallery
          images={generatedImages}
          onDownload={handleDownload}
          onStartNew={handleStartNew}
        />
      )}
    </div>
  );
};

export default Index;
