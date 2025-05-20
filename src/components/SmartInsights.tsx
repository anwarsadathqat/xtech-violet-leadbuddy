
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Store user preferences to personalize content
interface UserPreferences {
  interests: string[];
  lastInteractionDate: Date | null;
}

const SmartInsights: React.FC = () => {
  const [showInsight, setShowInsight] = useState(true);
  const [response, setResponse] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    interests: [],
    lastInteractionDate: null
  });
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [showThankYou, setShowThankYou] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Different questions to ask the user over time
  const questions = [
    {
      question: "Which service are you most interested in?",
      options: ["AI Implementation", "Cloud Solutions", "Digital Transformation", "Other"]
    },
    {
      question: "What's your primary business challenge?",
      options: ["Cost Optimization", "Speed to Market", "Legacy Systems", "Security"]
    },
    {
      question: "What industry are you in?",
      options: ["Healthcare", "Finance", "Retail", "Technology", "Other"]
    }
  ];

  // Check for stored preferences on component mount
  useEffect(() => {
    const storedPrefs = localStorage.getItem('xtech_user_preferences');
    if (storedPrefs) {
      try {
        const parsedPrefs = JSON.parse(storedPrefs);
        setUserPreferences(parsedPrefs);
        
        // If user has interacted recently, wait longer before showing insights
        const lastInteraction = parsedPrefs.lastInteractionDate ? new Date(parsedPrefs.lastInteractionDate) : null;
        const now = new Date();
        
        if (lastInteraction && (now.getTime() - new Date(lastInteraction).getTime() < 3600000)) {
          setShowInsight(false);
          
          // Schedule to show again later
          setTimeout(() => {
            setShowInsight(true);
            // Rotate to next question when re-displayed
            setCurrentQuestion((prevQuestion) => 
              (prevQuestion + 1) % questions.length
            );
          }, 120000); // Show again in 2 minutes
        }
      } catch (e) {
        console.error("Error parsing stored preferences:", e);
      }
    }
  }, []);

  const handleResponse = (value: string) => {
    setResponse(value);
    setShowThankYou(true);
    
    // Update user preferences with the new choice
    const updatedPreferences = {
      ...userPreferences,
      interests: [...(userPreferences.interests || []), value],
      lastInteractionDate: new Date()
    };
    
    setUserPreferences(updatedPreferences);
    
    // Store preferences for future use
    try {
      localStorage.setItem('xtech_user_preferences', JSON.stringify(updatedPreferences));
    } catch (e) {
      console.error("Error storing preferences:", e);
    }
    
    // Log for analytics (would send to analytics service in production)
    console.log("User insight recorded:", value);
    
    // Show thank you message briefly
    setTimeout(() => {
      setShowThankYou(false);
      setShowInsight(false);
      
      // Update content on page based on preference
      updatePageContentBasedOnPreference(value);
      
      // After some time, show another insight question
      setTimeout(() => {
        setResponse(null);
        // Rotate to next question when re-displayed
        setCurrentQuestion((prevQuestion) => 
          (prevQuestion + 1) % questions.length
        );
        setShowInsight(true);
      }, 240000); // 4 minutes
    }, 3000); // Show thank you for 3 seconds
  };

  const updatePageContentBasedOnPreference = (preference: string) => {
    // In a real application, this would trigger a content update
    // For now we'll just show a toast notification
    let recommendationMessage = "";
    
    switch(preference) {
      case "AI Implementation":
        recommendationMessage = "We've highlighted AI implementation content that might interest you";
        break;
      case "Cloud Solutions":
        recommendationMessage = "Check out our latest cloud solutions case studies below";
        break;
      case "Digital Transformation":
        recommendationMessage = "We've customized the page with digital transformation insights";
        break;
      case "Cost Optimization":
        recommendationMessage = "See how our solutions can reduce your operational costs";
        break;
      case "Security":
        recommendationMessage = "Explore our enterprise-grade security solutions";
        break;
      default:
        recommendationMessage = "We'll customize your experience based on your interests";
    }
    
    toast({
      title: "Content personalized",
      description: recommendationMessage,
      duration: 4000,
    });
  };

  if (!showInsight) return null;
  
  const currentQuestionData = questions[currentQuestion];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-6 left-6 max-w-xs bg-gradient-to-br from-[#1A1F2C] to-[#232838] bg-opacity-95 border border-purple-500/20 rounded-2xl shadow-lg shadow-purple-500/20 p-5 z-40"
    >
      <button 
        className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors" 
        onClick={() => setShowInsight(false)}
      >
        <X size={18} />
      </button>
      
      {showThankYou ? (
        <div className="flex flex-col items-center py-2">
          <div className="p-2 rounded-full bg-green-600/20 mb-3">
            <Check size={20} className="text-green-500" />
          </div>
          <h4 className="text-lg font-medium text-white mb-1">Thank you!</h4>
          <p className="text-sm text-gray-300 text-center">
            We'll use your feedback to personalize your experience
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-full bg-purple-600/20 mr-3">
              <Zap size={20} className="text-purple-500" />
            </div>
            <div>
              <h4 className="text-lg font-medium text-white mb-1">Quick Question</h4>
              <p className="text-sm text-gray-300">{currentQuestionData.question}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            {currentQuestionData.options.slice(0, 2).map((option) => (
              <button 
                key={option}
                onClick={() => handleResponse(option)}
                className="text-white py-3 px-4 bg-purple-900/40 hover:bg-purple-800/60 rounded-xl transition-colors text-sm font-medium"
              >
                {option}
              </button>
            ))}
            {currentQuestionData.options.slice(2, 4).map((option) => (
              <button 
                key={option}
                onClick={() => handleResponse(option)}
                className="text-white py-3 px-4 bg-blue-900/40 hover:bg-blue-800/60 rounded-xl transition-colors text-sm font-medium"
              >
                {option}
              </button>
            ))}
            {currentQuestionData.options.length > 4 && (
              <button 
                key={currentQuestionData.options[4]}
                onClick={() => handleResponse(currentQuestionData.options[4])}
                className="text-white py-3 px-4 col-span-2 bg-indigo-900/40 hover:bg-indigo-800/60 rounded-xl transition-colors text-sm font-medium"
              >
                {currentQuestionData.options[4]}
              </button>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default SmartInsights;
