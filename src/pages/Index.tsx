
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
import BookingCalendar from "@/components/BookingCalendar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

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

  // Quick links to core services
  const quickServiceLinks = [
    {
      title: "Cloud Solutions",
      description: "Secure and scalable cloud infrastructure tailored to your business requirements.",
      link: "/services/cloud-solutions",
    },
    {
      title: "Cyber Security",
      description: "Advanced threat protection and security policy implementation to keep your data safe.",
      link: "/services/cyber-security",
    },
    {
      title: "AI Implementation",
      description: "Cutting-edge artificial intelligence solutions tailored to your business needs.",
      link: "/services/ai-implementation",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Modern Hero Section */}
      <HeroSection />
      
      {/* Client Logos */}
      <ClientLogos />
      
      <TransformBusinessSection />
      
      <StatsSection />
      
      {/* Quick Service Links */}
      <section className="py-16 relative fade-in-section opacity-0">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Our Core IT Services</h2>
            <p className="text-xtech-light-gray max-w-2xl mx-auto">
              Explore our specialized services designed to help businesses in Qatar thrive in the digital age.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {quickServiceLinks.map((service, index) => (
              <Card key={index} className="bg-xtech-dark-purple/60 border border-white/5 hover:border-xtech-purple/20 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg hover:shadow-xtech-purple/10">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                  <p className="text-xtech-light-gray mb-4">{service.description}</p>
                  <Link to={service.link} className="inline-flex items-center text-xtech-blue group-hover:text-xtech-purple transition-colors">
                    Learn More <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button asChild className="bg-xtech-purple hover:bg-xtech-purple/90 text-white">
              <Link to="/services">View All Services</Link>
            </Button>
          </div>
        </div>
      </section>
      
      <WhyChooseUsSection />
      
      {/* Booking Section */}
      <section className="py-16 bg-xtech-dark-purple/30 relative fade-in-section opacity-0">
        <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-xtech-blue/10 blur-[200px] opacity-30"></div>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Schedule a Free Consultation</h2>
              <p className="text-xtech-light-gray mb-6">
                Our IT experts are ready to discuss your business challenges and help you find the right technology solutions. 
                Book a free 30-minute consultation to get started.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-xtech-purple/20 flex items-center justify-center text-xtech-purple mt-0.5">✓</span>
                  <span>No obligation consultation with IT experts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-xtech-purple/20 flex items-center justify-center text-xtech-purple mt-0.5">✓</span>
                  <span>Custom solutions tailored to your business</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-xtech-purple/20 flex items-center justify-center text-xtech-purple mt-0.5">✓</span>
                  <span>Follow-up action plan and proposal</span>
                </li>
              </ul>
            </div>
            <div>
              <BookingCalendar />
            </div>
          </div>
        </div>
      </section>
      
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
