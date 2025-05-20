
import React, { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClientLogos from "@/components/ClientLogos";
import TransformBusinessSection from "@/components/sections/TransformBusinessSection";
import StatsSection from "@/components/sections/StatsSection";
import WhyChooseUsSection from "@/components/sections/WhyChooseUsSection";
import ServicesSection from "@/components/sections/ServicesSection";
import SolutionsSection from "@/components/sections/SolutionsSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import CTASection from "@/components/sections/CTASection";
import HeroSection from "@/components/sections/HeroSection";
import SmartAssistant from "@/components/SmartAssistant";
import SmartRecommendations from "@/components/SmartRecommendations";
import SmartInsights from "@/components/SmartInsights";

const Index = () => {
  useEffect(() => {
    // Add intersection observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    // Observe all sections with fade-in-section class
    document.querySelectorAll('.fade-in-section').forEach(section => {
      observer.observe(section);
    });

    // Log page visit for analytics purposes
    console.log("Home page viewed", {
      timestamp: new Date().toISOString(),
      path: window.location.pathname
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Modern Hero Section */}
      <HeroSection />
      
      {/* Client Logos */}
      <ClientLogos />
      
      <TransformBusinessSection />
      
      <StatsSection />
      
      <WhyChooseUsSection />
      
      {/* Smart Recommendations Section */}
      <SmartRecommendations />
      
      <ServicesSection />
      
      <SolutionsSection />
      
      <TestimonialsSection />
      
      <CTASection />
      
      <Footer />
      
      {/* Smart Website Components */}
      <SmartAssistant />
      <SmartInsights />
    </div>
  );
};

export default Index;
