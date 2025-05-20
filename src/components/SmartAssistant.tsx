
import React, { useState } from "react";
import { Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import MessageList from "./assistant/MessageList";
import InputArea from "./assistant/InputArea";
import { findResponse } from "@/utils/assistantUtils";
import { initialMessages } from "@/data/assistantResponses";
import { Message } from "@/types/assistant";

const SmartAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [expertRequested, setExpertRequested] = useState(false);
  const { toast } = useToast();

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      toast({
        title: "XTech Assistant is ready to help",
        description: "Ask me anything about our services and solutions.",
        duration: 3000,
      });
    }
  };

  const handleSendMessage = (text: string) => {
    // Add user message
    const userMessage: Message = {
      text,
      isBot: false,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    // Simulate AI processing with a slight delay
    setTimeout(() => {
      const responseText = findResponse(text, expertRequested);
      
      // Check if we're using the default response that asks about experts
      if (responseText.includes("Would you like to speak with one of our experts")) {
        setExpertRequested(true);
      }
      
      // When user says yes, mark that expert was requested
      if (text.toLowerCase() === "yes" || text.toLowerCase() === "y") {
        setExpertRequested(true);
      }
      
      const botResponse: Message = {
        text: responseText,
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botResponse]);
    }, 600);
  };

  return (
    <>
      {/* Chat toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleAssistant}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-indigo-600 text-white shadow-lg hover:shadow-indigo-500/40 transition-all z-50"
        aria-label="Open chat assistant"
      >
        <Bot size={24} />
      </motion.button>
      
      {/* Chat window */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 right-6 w-80 md:w-96 h-[500px] max-h-[70vh] bg-[#1A1F2C] border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-500/20 z-50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/30 to-indigo-900/30">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-purple-400" />
              <h3 className="font-medium text-white">XTech Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAssistant}
              className="hover:bg-purple-500/10 rounded-full text-white/70 hover:text-white"
            >
              <X size={18} />
            </Button>
          </div>
          
          <MessageList messages={messages} />
          <InputArea onSendMessage={handleSendMessage} />
        </motion.div>
      )}
    </>
  );
};

export default SmartAssistant;
