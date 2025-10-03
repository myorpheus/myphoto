import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeroSection from "@/components/homepage/HeroSection";
import BrandsSection from "@/components/homepage/BrandsSection";
import ProcessSection from "@/components/homepage/ProcessSection";
import FeaturesSection from "@/components/homepage/FeaturesSection";
import ExamplesSection from "@/components/homepage/ExamplesSection";
import TestimonialsSection from "@/components/homepage/TestimonialsSection";
import PricingSection from "@/components/homepage/PricingSection";
import FAQSection from "@/components/homepage/FAQSection";
import CTASection from "@/components/homepage/CTASection";
import Navbar from "@/components/Navbar";
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
      <Navbar />
      <div className="flex-1">
        <HeroSection />
        <BrandsSection />
        <ProcessSection />
        <FeaturesSection />
        <ExamplesSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
