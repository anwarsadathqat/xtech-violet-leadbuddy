
import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Message {
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    text: "Hi there! I'm XTech Assistant. How can I help you today?",
    isBot: true,
    timestamp: new Date(),
  },
];

const predefinedResponses: Record<string, string[]> = {
  "hello": ["Hello! How can I assist you with XTech's services today?", "Hi there! I'm XTech Assistant. What can I help you with?"],
  "services": [
    "XTech offers three main services: AI Implementation, Cloud Solutions, and Digital Transformation. Would you like more details about any specific service?",
    "Our core services include AI Implementation, Cloud Solutions, and Digital Transformation. Each is customized to your business needs. Which interests you most?"
  ],
  "pricing": [
    "Our pricing is customized based on your specific requirements. Would you like to schedule a consultation to receive a personalized quote?",
    "XTech pricing varies depending on project scope, timeline, and complexity. Our team would be happy to provide a detailed proposal after understanding your needs."
  ],
  "contact": [
    "You can reach our team through the contact form on our website, schedule a consultation call, or email us directly at contact@xtech.com.",
    "The best way to contact us is through our online form, or call us at +1-234-567-8900 for immediate assistance."
  ],
  "ai": [
    "Our AI implementation team specializes in custom solutions that transform business operations. We design, build, and deploy AI systems tailored to your specific industry challenges.",
    "XTech's AI services include predictive analytics, machine learning integration, automated decision systems, and intelligent process automation."
  ],
  "cloud": [
    "Our cloud solutions offer secure, scalable infrastructure tailored to your business. We handle migration, optimization, and ongoing management of cloud resources.",
    "XTech provides end-to-end cloud services including multi-cloud strategies, infrastructure-as-code, containerization, and cloud-native application development."
  ],
  "digital": [
    "Our digital transformation services help organizations evolve into data-driven, agile businesses. We modernize legacy systems, optimize processes, and build new digital capabilities.",
    "XTech approaches digital transformation holistically - addressing technology, people, and process changes required for true organizational evolution."
  ],
  "consultation": [
    "We'd be happy to schedule a free consultation with one of our experts. Please provide your contact information and preferred time, and we'll reach out to you.",
    "Our consultations are personalized to understand your specific challenges. Would you like to speak with a specialist in AI, cloud, or digital transformation?"
  ],
  "yes": [
    "Great! What specific topic or service would you like our expert to help you with? We have specialists in AI implementation, cloud solutions, and digital transformation.",
    "Excellent! Please let me know which area you need assistance with, and I'll connect you with the right specialist. You can also provide your contact details for a follow-up."
  ],
  "no": [
    "No problem! If you have any other questions I can help with, please feel free to ask.",
    "That's fine. Is there anything else I can assist you with today?"
  ]
};

const SmartAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [expertRequested, setExpertRequested] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const findResponse = (query: string): string => {
    const lowercaseQuery = query.toLowerCase();
    
    // Handle the case when a user responds "yes" after being asked about an expert
    if (expertRequested && (lowercaseQuery === "yes" || lowercaseQuery === "y")) {
      return "Great! To connect you with the right expert, could you please let me know which specific service you're interested in (AI Implementation, Cloud Solutions, or Digital Transformation)? Or you can provide your email for a follow-up.";
    }
    
    // Check each keyword for a match
    for (const [keyword, responses] of Object.entries(predefinedResponses)) {
      if (lowercaseQuery.includes(keyword)) {
        // For default response, mark that we've asked about connecting to an expert
        if (lowercaseQuery === "yes" || lowercaseQuery === "y") {
          setExpertRequested(true);
        }
        // Randomly select one of the available responses for variety
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    // If no specific match is found, check for general topic matches
    if (lowercaseQuery.includes("help") || lowercaseQuery.includes("support")) {
      return "I'd be happy to help! Could you please specify what kind of assistance you're looking for? We offer help with AI implementation, cloud solutions, and digital transformation.";
    }
    
    if (lowercaseQuery.includes("cost") || lowercaseQuery.includes("fee")) {
      return "Our pricing is tailored to each client's specific needs. Would you like to discuss your project requirements so we can provide a customized quote?";
    }
    
    if (lowercaseQuery.includes("time") || lowercaseQuery.includes("long") || lowercaseQuery.includes("duration")) {
      return "Project timelines vary based on scope and complexity. Typically, our implementations range from 2-12 weeks. Would you like to discuss your specific project needs?";
    }
    
    // Default response with an offer to connect with an expert
    setExpertRequested(true); // Set flag when we use this default response
    return "I don't have specific information about that. Would you like to speak with one of our experts who can provide more detailed assistance?";
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      text: input,
      isBot: false,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    
    // Simulate AI processing with a slight delay
    setTimeout(() => {
      const botResponse: Message = {
        text: findResponse(input),
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botResponse]);
    }, 600);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#1A1F2C]">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.1 }}
                className={`flex ${
                  message.isBot ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.isBot
                      ? "bg-purple-900/20 text-white"
                      : "bg-indigo-600/30 text-white"
                  }`}
                >
                  <p>{message.text}</p>
                  <p className="text-xs opacity-50 mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input area */}
          <div className="p-4 border-t border-purple-500/20 bg-[#1A1F2C]">
            <div className="flex items-center gap-2 bg-[#232838] rounded-full p-1 pl-4 border border-purple-500/20">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your question..."
                className="flex-1 bg-transparent border-none focus:outline-none text-white text-sm"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-full p-2 h-9 w-9"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default SmartAssistant;
