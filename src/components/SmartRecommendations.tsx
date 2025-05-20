
import React, { useState, useEffect } from "react";
import { ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface Recommendation {
  id: number;
  title: string;
  description: string;
  path: string;
  tag: string;
  priority: number;
}

const allRecommendations: Recommendation[] = [
  {
    id: 1,
    title: "AI Implementation Services",
    description: "Transform your business with our cutting-edge AI solutions",
    path: "/services",
    tag: "AI",
    priority: 10
  },
  {
    id: 2,
    title: "Cloud Migration Solutions",
    description: "Seamlessly move your operations to the cloud",
    path: "/services",
    tag: "CLOUD",
    priority: 8
  },
  {
    id: 3,
    title: "Digital Transformation",
    description: "Complete digital overhaul for modern businesses",
    path: "/services",
    tag: "TRANSFORMATION",
    priority: 9
  },
  {
    id: 4,
    title: "Custom Pricing Options",
    description: "Flexible pricing plans tailored to your needs",
    path: "/pricing",
    tag: "PRICING",
    priority: 7
  },
  {
    id: 5,
    title: "About Our Expertise",
    description: "Learn about our team of industry experts",
    path: "/about",
    tag: "ABOUT",
    priority: 5
  }
];

const SmartRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [currentPage, setCurrentPage] = useState<string>(window.location.pathname);

  // Function to determine user interests based on page views and behavior
  const determineUserInterests = () => {
    // In a real implementation, this would use analytics data, cookies, or session data
    // For this demo, we'll simulate interest based on current page and random factors
    
    let interests: Record<string, number> = {
      "AI": 1,
      "CLOUD": 1,
      "TRANSFORMATION": 1,
      "PRICING": 1,
      "ABOUT": 1
    };
    
    // Increase interest score based on current page
    if (currentPage === "/") {
      interests["AI"] += 2;
    } else if (currentPage === "/services") {
      interests["CLOUD"] += 2;
      interests["TRANSFORMATION"] += 1;
    } else if (currentPage === "/pricing") {
      interests["PRICING"] += 3;
    } else if (currentPage === "/about") {
      interests["ABOUT"] += 3;
    }
    
    return interests;
  };
  
  // Generate personalized recommendations
  const generateRecommendations = () => {
    const interests = determineUserInterests();
    
    // Score each recommendation based on user interests
    const scoredRecommendations = allRecommendations.map(rec => {
      const interestScore = interests[rec.tag] || 0;
      return {
        ...rec,
        score: interestScore * rec.priority
      };
    });
    
    // Sort by score and take top 3
    const topRecommendations = scoredRecommendations
      .sort((a, b) => (b.score as number) - (a.score as number))
      .slice(0, 3);
      
    setRecommendations(topRecommendations);
  };
  
  useEffect(() => {
    generateRecommendations();
    
    // In a real implementation, we would listen to user behavior events
    const interval = setInterval(() => {
      generateRecommendations();
    }, 60000); // Refresh recommendations every minute
    
    return () => clearInterval(interval);
  }, [currentPage]);
  
  return (
    <div className="py-12 bg-xtech-dark-purple/30 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <h3 className="text-2xl font-bold mb-8 gradient-text">
          Recommended For You
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          {recommendations.map((item) => (
            <div 
              key={item.id}
              className="bg-gradient-to-br from-xtech-dark-purple/80 to-xtech-dark-purple border border-white/5 rounded-lg p-6 transform hover:-translate-y-2 transition-all duration-300 hover:shadow-lg hover:shadow-xtech-purple/20"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-medium text-xtech-blue bg-xtech-blue/10 px-3 py-1 rounded-full">
                  {item.tag}
                </span>
                <Star className="text-xtech-purple/60" size={16} />
              </div>
              
              <h4 className="text-xl font-semibold mb-2">{item.title}</h4>
              <p className="text-xtech-light mb-4">{item.description}</p>
              
              <Link
                to={item.path}
                className="inline-flex items-center text-sm text-xtech-blue hover:text-xtech-purple transition-colors group"
              >
                Learn more
                <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SmartRecommendations;
