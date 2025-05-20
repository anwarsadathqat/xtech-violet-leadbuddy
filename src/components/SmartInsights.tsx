
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lightning, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const SmartInsights: React.FC = () => {
  const [showInsight, setShowInsight] = useState(true);
  const [response, setResponse] = useState<string | null>(null);
  const { toast } = useToast();

  const handleResponse = (value: string) => {
    setResponse(value);
    setShowInsight(false);
    
    toast({
      title: "Thank you for your feedback!",
      description: "We'll use this to improve our recommendations for you.",
      duration: 3000,
    });
    
    // In a real application, this would be sent to an analytics service
    console.log("User insight recorded:", value);
    
    // After some time, show another insight question
    setTimeout(() => {
      setResponse(null);
      setShowInsight(true);
    }, 120000); // 2 minutes
  };

  if (!showInsight) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-6 left-6 max-w-xs bg-gradient-to-r from-xtech-dark-purple to-xtech-dark bg-opacity-95 border border-xtech-purple/30 rounded-lg shadow-lg shadow-xtech-purple/20 p-4 z-40"
    >
      <div className="flex items-start mb-3">
        <div className="p-2 rounded-full bg-xtech-purple/20 mr-3">
          <Lightning size={16} className="text-xtech-purple" />
        </div>
        <div>
          <h4 className="text-sm font-medium mb-1">Quick Question</h4>
          <p className="text-xs text-xtech-light">Which service are you most interested in?</p>
        </div>
        <button 
          className="text-white/50 hover:text-white ml-2 -mt-1" 
          onClick={() => setShowInsight(false)}
        >
          &times;
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button 
          onClick={() => handleResponse("AI Implementation")}
          className="text-xs py-1.5 px-3 bg-xtech-purple/20 hover:bg-xtech-purple/40 rounded transition-colors text-white"
        >
          AI Implementation
        </button>
        <button 
          onClick={() => handleResponse("Cloud Solutions")}
          className="text-xs py-1.5 px-3 bg-xtech-blue/20 hover:bg-xtech-blue/40 rounded transition-colors text-white"
        >
          Cloud Solutions
        </button>
        <button 
          onClick={() => handleResponse("Digital Transformation")}
          className="text-xs py-1.5 px-3 bg-xtech-purple/20 hover:bg-xtech-purple/40 rounded transition-colors text-white"
        >
          Digital Transformation
        </button>
        <button 
          onClick={() => handleResponse("Other")}
          className="text-xs py-1.5 px-3 bg-xtech-blue/20 hover:bg-xtech-blue/40 rounded transition-colors text-white"
        >
          Other
        </button>
      </div>
    </motion.div>
  );
};

export default SmartInsights;
