
import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

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

const predefinedResponses: Record<string, string> = {
  "hello": "Hello! How can I assist you with XTech's services today?",
  "services": "XTech offers AI implementation, cloud solutions, and digital transformation services. Would you like to learn more about any specific service?",
  "pricing": "Our pricing varies based on project scope and requirements. Would you like to schedule a consultation to discuss your specific needs?",
  "contact": "You can reach our team through the contact form on our website, or call us directly at +1-234-567-8900.",
  "ai": "XTech specializes in cutting-edge AI solutions that help businesses streamline operations and enhance decision-making capabilities.",
  "cloud": "Our cloud solutions offer secure, scalable infrastructure tailored to your specific business requirements.",
};

const SmartAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
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
    
    for (const [keyword, response] of Object.entries(predefinedResponses)) {
      if (lowercaseQuery.includes(keyword)) {
        return response;
      }
    }
    
    return "I don't have specific information about that. Would you like to speak with one of our experts?";
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
      <button
        onClick={toggleAssistant}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-xtech-purple text-white shadow-lg hover:shadow-xl hover:shadow-xtech-purple/30 transition-all z-50 animate-pulse"
        aria-label="Open chat assistant"
      >
        <Bot size={24} />
      </button>
      
      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 md:w-96 h-[500px] max-h-[70vh] bg-xtech-dark-purple border border-xtech-purple/30 rounded-lg shadow-2xl shadow-xtech-purple/20 z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-xtech-purple/20 bg-gradient-to-r from-xtech-purple/20 to-xtech-blue/20">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-xtech-purple" />
              <h3 className="font-medium">XTech Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAssistant}
              className="hover:bg-xtech-purple/10 rounded-full"
            >
              <X size={18} />
            </Button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.isBot ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.isBot
                      ? "bg-xtech-purple/20 text-white"
                      : "bg-xtech-blue/20 text-white"
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
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input area */}
          <div className="p-4 border-t border-xtech-purple/20 bg-xtech-dark/80">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your question..."
                className="flex-1 bg-xtech-dark-purple/50 border border-xtech-purple/30 rounded-full px-4 py-2 focus:outline-none focus:border-xtech-purple/80 text-white"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-xtech-purple hover:bg-xtech-purple/90 rounded-full p-2"
                disabled={!input.trim()}
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SmartAssistant;
