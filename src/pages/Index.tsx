import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import Footer from "@/components/Footer";
import { supabaseService } from "@/services/supabase";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated and redirect to overview
    const checkUser = async () => {
      const user = await supabaseService.getCurrentUser();
      if (user) {
        navigate('/overview');
      }
    };
    
    checkUser();
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Camera className="h-5 w-5 text-primary" />
            <span>Headshots AI</span>
          </div>
          <Button onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </header>
      
      <main className="flex-1">
        <section className="container flex flex-col items-center justify-center px-4 py-24 md:px-6 md:py-32">
          <div className="max-w-3xl text-center space-y-8">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Professional AI Headshots
            </h1>
            <p className="text-xl text-muted-foreground">
              Create stunning, professional headshots using AI. Upload your photos and let our AI generate high-quality headshots perfect for LinkedIn, resumes, and professional profiles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/login')}
                className="text-lg px-8"
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/overview')}
                className="text-lg px-8"
              >
                View Dashboard
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
