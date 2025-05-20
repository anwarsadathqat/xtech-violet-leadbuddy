
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserPreferences } from "@/types/smartInsights";
import { insightQuestions } from "@/data/insightQuestions";
import { 
  saveUserPreferences, 
  loadUserPreferences,
  hasRecentInteraction 
} from "@/utils/insightsUtils";
import InsightQuestion from "@/components/insights/InsightQuestion";
import ThankYouMessage from "@/components/insights/ThankYouMessage";
import { getRecommendationMessage } from "@/utils/contentRecommendations";

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

  // Check for stored preferences on component mount
  useEffect(() => {
    const storedPrefs = loadUserPreferences();
    if (storedPrefs) {
      setUserPreferences(storedPrefs);
      
      // If user has interacted recently, wait longer before showing insights
      if (hasRecentInteraction(storedPrefs)) {
        setShowInsight(false);
        
        // Schedule to show again later
        setTimeout(() => {
          setShowInsight(true);
          // Rotate to next question when re-displayed
          setCurrentQuestion((prevQuestion) => 
            (prevQuestion + 1) % insightQuestions.length
          );
        }, 120000); // Show again in 2 minutes
      }
    }
  }, []);

  const updatePageContentBasedOnPreference = (preference: string) => {
    // Get the recommendation message
    const recommendationMessage = getRecommendationMessage(preference);
    
    // Show toast notification
    toast({
      title: "Content personalized",
      description: recommendationMessage,
      duration: 4000,
    });
  };

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
    saveUserPreferences(updatedPreferences);
    
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
          (prevQuestion + 1) % insightQuestions.length
        );
        setShowInsight(true);
      }, 240000); // 4 minutes
    }, 3000); // Show thank you for 3 seconds
  };

  if (!showInsight) return null;
  
  const currentQuestionData = insightQuestions[currentQuestion];

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
        <ThankYouMessage />
      ) : (
        <InsightQuestion 
          questionData={currentQuestionData} 
          onResponse={handleResponse} 
        />
      )}
    </motion.div>
  );
};

export default SmartInsights;
