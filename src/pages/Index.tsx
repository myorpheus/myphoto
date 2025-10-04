import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles, Zap, Shield, ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import { supabaseService } from "@/services/supabase";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated and redirect to home
    const checkUser = async () => {
      const user = await supabaseService.getCurrentUser();
      if (user) {
        navigate('/home');
      }
    };
    
    checkUser();
  }, [navigate]);

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Quality",
      description: "Advanced AI technology creates studio-quality headshots that look professionally photographed"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get your professional headshots in minutes, not days. No scheduling, no waiting"
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your photos are processed securely and never shared. Complete data privacy guaranteed"
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container flex h-20 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3 font-bold text-2xl">
            <div className="relative">
              <Camera className="h-7 w-7 text-primary animate-glow" />
              <div className="absolute inset-0 h-7 w-7 bg-primary/20 blur-xl animate-glow" />
            </div>
            <span className="font-cinzel bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Headshots AI
            </span>
          </div>
          <Button 
            onClick={() => navigate('/login')}
            variant="outline"
            className="group hover:border-primary transition-all duration-300"
          >
            Sign In
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container px-4 pt-20 pb-32 md:px-6 md:pt-32 md:pb-40 relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-in-up">
            <div className="inline-block mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                AI-Powered Professional Photography
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold font-cinzel tracking-tight">
              <span className="block mb-2 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                Your Perfect
              </span>
              <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                Professional Headshot
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform your photos into stunning, professional headshots using cutting-edge AI technology. 
              Perfect for LinkedIn, resumes, and professional profiles.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button 
                size="lg" 
                onClick={() => navigate('/login')}
                className="text-lg px-8 py-6 h-auto group relative overflow-hidden bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/50 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Free
                  <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                </span>
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-lg px-8 py-6 h-auto border-2 hover:bg-muted transition-all duration-300"
              >
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container px-4 py-20 md:px-6 md:py-32">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4 animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-bold font-cinzel">
                Why Choose <span className="text-primary">Headshots AI</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Professional results without the professional price tag or time commitment
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={feature.title}
                  className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="mb-4 relative">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="absolute inset-0 w-14 h-14 bg-primary/5 blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3 font-cinzel group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container px-4 py-20 md:px-6 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8 p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 border border-primary/20 backdrop-blur-sm animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold font-cinzel">
              Ready to Get Your Perfect Headshot?
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of professionals who have transformed their online presence with AI-generated headshots
            </p>
            
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="text-lg px-10 py-6 h-auto bg-gradient-to-r from-primary to-accent hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 group"
            >
              <span className="flex items-center gap-2">
                Start Creating Now
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
