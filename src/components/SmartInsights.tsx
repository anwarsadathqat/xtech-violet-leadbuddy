
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Zap, X } from "lucide-react";
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
      className="fixed bottom-6 left-6 max-w-xs bg-gradient-to-br from-[#1A1F2C] to-[#232838] bg-opacity-95 border border-purple-500/20 rounded-2xl shadow-lg shadow-purple-500/20 p-5 z-40"
    >
      <button 
        className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors" 
        onClick={() => setShowInsight(false)}
      >
        <X size={18} />
      </button>
      
      <div className="flex items-center mb-4">
        <div className="p-2 rounded-full bg-purple-600/20 mr-3">
          <Zap size={20} className="text-purple-500" />
        </div>
        <div>
          <h4 className="text-lg font-medium text-white mb-1">Quick Question</h4>
          <p className="text-sm text-gray-300">Which service are you most interested in?</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button 
          onClick={() => handleResponse("AI Implementation")}
          className="text-white py-3 px-4 bg-purple-900/40 hover:bg-purple-800/60 rounded-xl transition-colors text-sm font-medium"
        >
          AI Implementation
        </button>
        <button 
          onClick={() => handleResponse("Cloud Solutions")}
          className="text-white py-3 px-4 bg-blue-900/40 hover:bg-blue-800/60 rounded-xl transition-colors text-sm font-medium"
        >
          Cloud Solutions
        </button>
        <button 
          onClick={() => handleResponse("Digital Transformation")}
          className="text-white py-3 px-4 bg-purple-900/40 hover:bg-purple-800/60 rounded-xl transition-colors text-sm font-medium"
        >
          Digital Transformation
        </button>
        <button 
          onClick={() => handleResponse("Other")}
          className="text-white py-3 px-4 bg-blue-900/40 hover:bg-blue-800/60 rounded-xl transition-colors text-sm font-medium"
        >
          Other
        </button>
      </div>
    </motion.div>
  );
};

export default SmartInsights;
