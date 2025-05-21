
import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
import FeatureCard from "@/components/FeatureCard";
import CTAButton from "@/components/CTAButton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";
import { Code, Settings, Users, Zap, Shield, Cpu, Network, Database, LayoutList, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

// Service type definition
interface Service {
  id: string;
  title: string;
  name: string;
  description: string;
  slug: string;
  icon: React.ReactNode;
}

// Get icon component based on icon name string
const getIconComponent = (iconName: string, size: number = 48, className: string = "text-xtech-purple") => {
  switch (iconName?.toLowerCase()) {
    case 'cpu':
      return <Cpu size={size} className={className} />;
    case 'settings':
      return <Settings size={size} className={className} />;
    case 'zap':
      return <Zap size={size} className={className} />;
    case 'network':
    case 'cloud':
      return <Network size={size} className={className} />;
    case 'shield':
      return <Shield size={size} className={className} />;
    case 'layoutlist':
      return <LayoutList size={size} className={className} />;
    case 'users':
      return <Users size={size} className={className} />;
    case 'code':
      return <Code size={size} className={className} />;
    case 'database':
      return <Database size={size} className={className} />;
    default:
      return <Zap size={size} className={className} />;
  }
};

const Services = () => {
  // Fetch services from Supabase
  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, name, description, slug, icon')
          .order('name', { ascending: true });
          
        if (error || !data) {
          console.error("Error fetching services:", error);
          return [];
        }
        
        // Map database services to UI format with icons
        return data.map(service => ({
          id: service.id,
          title: service.name,
          name: service.name,
          description: service.description,
          slug: service.slug,
          icon: getIconComponent(service.icon || '', 48, service.icon ? 
            (service.icon.toLowerCase().includes('purple') ? "text-xtech-purple" : "text-xtech-blue") : 
            "text-xtech-purple")
        }));
      } catch (err) {
        console.error("Error in services query:", err);
        return [];
      }
    }
  });

  // Default services to display if database fetch fails
  const defaultServices = [
    {
      id: '1',
      title: "AI Implementation",
      description: "Integrate AI/ML solutions to improve decision-making and efficiency across your organization.",
      icon: <Cpu size={48} className="text-xtech-purple" />,
      slug: "ai-implementation"
    },
    {
      id: '2',
      title: "Project Optimization",
      description: "Analyze and streamline processes to deliver projects faster and on budget with less resource waste.",
      icon: <Settings size={48} className="text-xtech-blue" />,
      slug: "project-optimization"
    },
    {
      id: '3',
      title: "Digital Transformation",
      description: "Comprehensive strategies to modernize your business operations and drive innovation.",
      icon: <Zap size={48} className="text-xtech-purple" />,
      slug: "digital-transformation"
    },
    {
      id: '4',
      title: "Cloud Solutions",
      description: "Secure and scalable cloud infrastructure tailored to your business requirements.",
      icon: <Network size={48} className="text-xtech-blue" />,
      slug: "cloud-solutions"
    },
    {
      id: '5',
      title: "Cyber Security",
      description: "Advanced threat protection and security policy implementation to keep your data safe.",
      icon: <Shield size={48} className="text-xtech-purple" />,
      slug: "cyber-security"
    },
    {
      id: '6',
      title: "IT Management",
      description: "End-to-end management of your IT infrastructure and projects with dedicated resources.",
      icon: <LayoutList size={48} className="text-xtech-blue" />,
      slug: "it-management"
    },
  ];

  // Use database services if available, otherwise use defaults
  const displayServices = services && services.length > 0 ? services : defaultServices;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-xtech-purple/20 blur-[180px] opacity-40"></div>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <SectionTitle 
              title="Our Services" 
              subtitle="Comprehensive service portfolio to address all your IT needs with cutting-edge solutions."
              align="center"
            />
          </div>
        </div>
      </section>
      
      {/* Main Services Grid */}
      <section className="py-12 relative">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 gradient-text">Our Core Services</h2>
          
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-xtech-dark-purple/60 border border-white/5 rounded-lg p-6 h-full">
                  <Skeleton className="h-12 w-12 rounded-md mb-4" />
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-6" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayServices.map((service) => (
                <Link 
                  key={service.id} 
                  to={`/services/${service.slug}`}
                  className="group"
                >
                  <div className="bg-xtech-dark-purple/60 border border-white/5 rounded-lg p-6 h-full flex flex-col hover:border-xtech-purple/40 hover:shadow-lg hover:shadow-xtech-purple/10 transition-all duration-300 hover:-translate-y-1">
                    <div className="mb-4">
                      {service.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                    <p className="text-xtech-light-gray mb-6 flex-grow">{service.description}</p>
                    <div className="flex items-center text-xtech-blue font-medium group-hover:text-xtech-purple transition-colors">
                      Learn More <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* High-Value Consultancy */}
      <section className="py-8 relative">
        <div className="absolute -z-10 top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-xtech-blue/20 blur-[150px] opacity-30"></div>
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 gradient-text">High-Value Consultancy</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              title="AI Implementation"
              description="Integrate AI/ML solutions to improve decision-making and efficiency across your organization."
              icon={<Cpu size={48} className="text-xtech-purple" />}
              className="hover-scale"
            />
            
            <FeatureCard
              title="Project Optimization"
              description="Analyze and streamline processes to deliver projects faster and on budget with less resource waste."
              icon={<Settings size={48} className="text-xtech-blue" />}
              className="hover-scale"
            />
            
            <FeatureCard
              title="Digital Transformation"
              description="Comprehensive strategies to modernize your business operations and drive innovation."
              icon={<Zap size={48} className="text-xtech-purple" />}
              className="hover-scale"
            />
          </div>
        </div>
      </section>
      
      {/* Sustaining Support */}
      <section className="py-8 relative">
        <div className="absolute -z-10 top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-xtech-blue/20 blur-[150px] opacity-30"></div>
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 gradient-text">Sustaining Support</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              title="24/7 System Monitoring"
              description="Continuous monitoring to prevent downtime and ensure reliability of your critical systems."
              icon={<Shield size={48} className="text-xtech-blue" />}
              className="hover-scale"
            />
            
            <FeatureCard
              title="Network Support"
              description="Comprehensive network maintenance and troubleshooting services for optimal performance."
              icon={<Network size={48} className="text-xtech-purple" />}
              className="hover-scale"
            />
            
            <FeatureCard
              title="Security Management"
              description="Advanced threat protection and security policy implementation to keep your data safe."
              icon={<Shield size={48} className="text-xtech-blue" />}
              className="hover-scale"
            />
          </div>
        </div>
      </section>
      
      {/* IT Resource Outsourcing */}
      <section className="py-8 relative">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 gradient-text">IT Resource Outsourcing</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              title="Staffing Solutions"
              description="Provide skilled IT professionals to augment your team on demand and meet project deadlines."
              icon={<Users size={48} className="text-xtech-purple" />}
              className="hover-scale"
            />
            
            <FeatureCard
              title="Full IT Management"
              description="End-to-end management of your IT infrastructure and projects with dedicated resources."
              icon={<LayoutList size={48} className="text-xtech-blue" />}
              className="hover-scale"
            />
            
            <FeatureCard
              title="Specialized Teams"
              description="Access to specialized development and operations teams with deep domain expertise."
              icon={<Users size={48} className="text-xtech-purple" />}
              className="hover-scale"
            />
          </div>
        </div>
      </section>
      
      {/* Integrated Solutions Table with Card UI */}
      <section className="py-16 relative">
        <div className="absolute -z-10 top-1/2 right-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-xtech-purple/20 blur-[150px] opacity-30"></div>
        <div className="container mx-auto px-4">
          <SectionTitle 
            title="Integrated Solutions Approach" 
            subtitle="Our comprehensive approach combines expertise across multiple domains"
            align="center"
          />
          
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-xtech-dark-purple/80 to-xtech-dark-purple border border-white/5 shadow-lg hover:shadow-xl hover:shadow-xtech-purple/10 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Zap size={24} className="text-xtech-purple" />
                  <h3 className="text-xl font-bold">Digital Transformation</h3>
                </div>
                <ul className="space-y-2 text-xtech-light-gray">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-xtech-purple"></span>
                    AI & Business Intelligence
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-xtech-purple"></span>
                    Workflow Automation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-xtech-purple"></span>
                    IoT & Data Analytics
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xtech-light">Tailored tech solutions that revolutionize operations</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-xtech-dark-purple/80 to-xtech-dark-purple border border-white/5 shadow-lg hover:shadow-xl hover:shadow-xtech-blue/10 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Shield size={24} className="text-xtech-blue" />
                  <h3 className="text-xl font-bold">System Maintenance</h3>
                </div>
                <ul className="space-y-2 text-xtech-light-gray">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-xtech-blue"></span>
                    Security Monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-xtech-blue"></span>
                    Cloud Management
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-xtech-blue"></span>
                    Backup & Recovery
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xtech-light">Proactive support keeping systems secure and available</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-xtech-dark-purple/80 to-xtech-dark-purple border border-white/5 shadow-lg hover:shadow-xl hover:shadow-xtech-purple/10 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Users size={24} className="text-xtech-purple" />
                  <h3 className="text-xl font-bold">IT Outsourcing</h3>
                </div>
                <ul className="space-y-2 text-xtech-light-gray">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-xtech-purple"></span>
                    Project Management Tools
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-xtech-purple"></span>
                    Dedicated Teams
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-xtech-purple"></span>
                    Resource Augmentation
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xtech-light">Skilled, purpose-built teams delivering results at scale</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Case Studies Section */}
      <section className="py-16 bg-xtech-dark-purple">
        <div className="container mx-auto px-4">
          <SectionTitle 
            title="Client Success Stories" 
            subtitle="See how our services have transformed businesses"
            align="center"
          />
          
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div className="bg-white/5 p-6 rounded-lg hover:bg-white/10 transition-all duration-300">
              <AspectRatio ratio={16/9} className="mb-4 overflow-hidden rounded-md">
                <img 
                  src="https://images.unsplash.com/photo-1460574283810-2aab119d8511" 
                  alt="Modern Building" 
                  className="object-cover w-full h-full"
                />
              </AspectRatio>
              <h3 className="text-xl font-bold mb-2">Finance Sector Transformation</h3>
              <p className="text-xtech-light-gray mb-4">Implemented AI-driven analytics platform for a major financial institution, resulting in 40% faster decision making.</p>
              <p className="text-xtech-blue font-medium">Read Case Study →</p>
            </div>
            
            <div className="bg-white/5 p-6 rounded-lg hover:bg-white/10 transition-all duration-300">
              <AspectRatio ratio={16/9} className="mb-4 overflow-hidden rounded-md">
                <img 
                  src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d" 
                  alt="Person using laptop" 
                  className="object-cover w-full h-full"
                />
              </AspectRatio>
              <h3 className="text-xl font-bold mb-2">Healthcare System Security</h3>
              <p className="text-xtech-light-gray mb-4">Secured critical patient data systems for a healthcare network while improving system response times by 35%.</p>
              <p className="text-xtech-blue font-medium">Read Case Study →</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-xtech-dark-purple to-xtech-dark">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready for IT Solutions That Drive Growth?</h2>
          <p className="text-xtech-light-gray max-w-xl mx-auto mb-8">
            Our experts are ready to discuss your needs and develop a solution tailored to your business requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton to="/contact?tab=booking" className="mx-auto">Schedule a Consultation</CTAButton>
            <CTAButton to="/contact" variant="secondary" className="mx-auto">Contact Us</CTAButton>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Services;
