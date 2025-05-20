
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
import FeatureCard from "@/components/FeatureCard";
import CTAButton from "@/components/CTAButton";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, ArrowRight } from "lucide-react";

// Service data structure
interface Service {
  id: string;
  name: string;
  description: string;
  slug: string;
  features: string[];
  benefits: string[];
  faqs: Array<{question: string; answer: string}>;
  icon: string;
  cta: string;
}

// Default service data in case Supabase fetch fails
const defaultServices: Record<string, Service> = {
  'cloud-solutions': {
    id: '1',
    name: 'Cloud Solutions',
    description: 'Enterprise-grade cloud infrastructure and migration services to transform your business operations.',
    slug: 'cloud-solutions',
    features: [
      'Secure cloud infrastructure setup',
      'Migration planning and execution',
      'Multi-cloud architecture design',
      'Cloud security implementation',
      '24/7 cloud monitoring'
    ],
    benefits: [
      'Reduce operational costs',
      'Enhance scalability',
      'Improve reliability',
      'Enable remote work capabilities',
      'Future-proof your IT infrastructure'
    ],
    faqs: [
      {
        question: 'How long does cloud migration typically take?',
        answer: 'Migration timelines vary based on complexity, but most projects are completed within 2-8 weeks.'
      },
      {
        question: 'Is my data secure in the cloud?',
        answer: 'Yes, we implement industry-leading security protocols and compliance measures to ensure your data remains protected.'
      },
      {
        question: 'Can we use multiple cloud providers?',
        answer: 'Absolutely! We specialize in multi-cloud environments that leverage the best features of different providers.'
      }
    ],
    icon: 'cloud',
    cta: 'Transform Your Infrastructure'
  },
  'cyber-security': {
    id: '2',
    name: 'Cyber Security',
    description: 'Comprehensive security solutions to protect your business from evolving digital threats.',
    slug: 'cyber-security',
    features: [
      'Vulnerability assessment',
      'Penetration testing',
      'Security monitoring',
      'Incident response planning',
      'Security awareness training'
    ],
    benefits: [
      'Protect sensitive data',
      'Prevent costly breaches',
      'Meet compliance requirements',
      'Build customer trust',
      'Secure remote work environments'
    ],
    faqs: [
      {
        question: 'How often should we conduct security assessments?',
        answer: 'We recommend quarterly assessments with continuous monitoring in between.'
      },
      {
        question: 'What compliance standards do you support?',
        answer: 'We support all major compliance frameworks including GDPR, HIPAA, ISO 27001, and PCI DSS.'
      },
      {
        question: 'Do you offer emergency breach response?',
        answer: 'Yes, we provide 24/7 emergency incident response services for active security breaches.'
      }
    ],
    icon: 'shield',
    cta: 'Secure Your Business'
  },
  'ai-implementation': {
    id: '3',
    name: 'AI Implementation',
    description: 'Cutting-edge artificial intelligence solutions tailored to your business needs.',
    slug: 'ai-implementation',
    features: [
      'Custom AI model development',
      'Data preparation and training',
      'AI solution integration',
      'Automated workflow creation',
      'AI performance monitoring'
    ],
    benefits: [
      'Automate repetitive tasks',
      'Gain actionable business insights',
      'Enhance decision making',
      'Improve customer experiences',
      'Drive innovation'
    ],
    faqs: [
      {
        question: 'Does our business need AI?',
        answer: 'Most modern businesses can benefit from AI in some capacity. We offer a free assessment to identify specific opportunities for your organization.'
      },
      {
        question: 'How much data do we need to implement AI?',
        answer: 'The data requirements vary by project, but we can work with existing datasets or help you build data collection strategies.'
      },
      {
        question: 'How long until we see ROI on AI investments?',
        answer: 'While some AI implementations show immediate results, most enterprise AI solutions demonstrate significant ROI within 6-12 months.'
      }
    ],
    icon: 'cpu',
    cta: 'Transform with AI'
  }
};

const ServicePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  
  // Fetch service data from Supabase
  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', slug],
    queryFn: async () => {
      try {
        // First try to fetch from Supabase
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('slug', slug)
          .single();
          
        if (error || !data) {
          // If there's an error or no data, use default data
          console.log("Using default service data for:", slug);
          return defaultServices[slug as string] || null;
        }
        
        return data;
      } catch (err) {
        console.error("Error fetching service:", err);
        return defaultServices[slug as string] || null;
      }
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-full mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <Skeleton className="h-64 w-full mb-4" />
            </div>
            <div>
              <Skeleton className="h-8 w-2/3 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-6" />
              <Skeleton className="h-10 w-1/2" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Service Not Found</h1>
          <p className="mb-8">We couldn't find the service you're looking for.</p>
          <CTAButton to="/services" variant="primary">
            View All Services
          </CTAButton>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16 relative">
        <div className="absolute -z-10 inset-0 bg-gradient-to-br from-xtech-dark-purple/30 to-xtech-dark"></div>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <SectionTitle 
              title={service.name} 
              subtitle={service.description}
              align="center"
            />
          </div>
        </div>
      </section>
      
      {/* Key Features Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {service.features.map((feature, index) => (
              <div key={index} className="bg-white/5 p-6 rounded-lg flex items-start gap-4 hover:bg-white/10 transition-all duration-300">
                <div className="bg-xtech-purple/20 p-2 rounded-full text-xtech-purple">
                  <Check size={20} />
                </div>
                <div>
                  <p className="text-white font-medium">{feature}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-12 bg-xtech-dark-purple/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Benefits</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {service.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-xtech-purple"></div>
                <p className="text-white">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {service.faqs.map((faq, index) => (
              <div key={index} className="bg-white/5 p-6 rounded-lg hover:bg-white/10 transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2 text-xtech-blue">{faq.question}</h3>
                <p className="text-white/80">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-xtech-dark-purple/50 to-xtech-dark">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">{service.cta}</h2>
          <p className="text-xtech-light-gray max-w-2xl mx-auto mb-8">
            Ready to take your business to the next level with our {service.name.toLowerCase()}? 
            Contact us today to schedule a consultation with our experts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton to="/contact" className="animated-button">
              Schedule Consultation
            </CTAButton>
            <CTAButton to="/services" variant="secondary">
              Explore Other Services
            </CTAButton>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default ServicePage;
