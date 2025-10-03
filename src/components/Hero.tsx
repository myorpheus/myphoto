import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export const Hero = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-[image:var(--gradient-hero)]" />
      
      {/* Animated circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-700" />
      
      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Powered by AI</span>
        </div>
        
        <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent animate-fade-in">
          Professional Headshots
          <br />
          In Minutes
        </h1>
        
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in delay-150">
          Transform your photos into stunning professional headshots with AI. 
          Perfect for resumes, LinkedIn, and corporate profiles.
        </p>
        
        <Button 
          size="lg" 
          onClick={onGetStarted}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-glow)] hover:scale-105 transition-all animate-fade-in delay-300"
        >
          Get Started
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-in delay-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">2 min</div>
            <div className="text-sm text-muted-foreground">Average Generation Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">AI-Powered</div>
            <div className="text-sm text-muted-foreground">Advanced Technology</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">HD Quality</div>
            <div className="text-sm text-muted-foreground">Professional Results</div>
          </div>
        </div>
      </div>
    </div>
  );
};
