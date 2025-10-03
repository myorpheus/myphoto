import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2 } from "lucide-react";

interface GenerationProgressProps {
  status: "training" | "generating" | "completed";
  progress: number;
}

export const GenerationProgress = ({ status, progress }: GenerationProgressProps) => {
  const statusTexts = {
    training: "Training AI model with your photos...",
    generating: "Generating professional headshots...",
    completed: "Your headshots are ready!",
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Card className="p-8 bg-card border-border shadow-[var(--shadow-card)]">
        <div className="text-center">
          {status === "completed" ? (
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-primary animate-scale-in" />
          ) : (
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
          )}
          
          <h2 className="text-2xl font-bold mb-2">{statusTexts[status]}</h2>
          <p className="text-muted-foreground mb-8">
            {status === "completed" 
              ? "Processing complete! View your results below." 
              : "This may take a few minutes. Please don't close this page."}
          </p>
          
          <Progress value={progress} className="h-2 mb-4" />
          <p className="text-sm text-muted-foreground">{progress}% complete</p>
        </div>
      </Card>
    </div>
  );
};
