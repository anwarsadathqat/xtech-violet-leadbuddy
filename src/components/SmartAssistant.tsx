import React, { useState, useEffect } from "react";
import { Bot, X, ArrowRight, Calendar, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import MessageList from "./assistant/MessageList";
import InputArea from "./assistant/InputArea";
import { findResponse } from "@/utils/assistantUtils";
import { initialMessages } from "@/data/assistantResponses";
import { Message } from "@/types/assistant";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SmartAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [expertRequested, setExpertRequested] = useState(false);
  const [leadInfo, setLeadInfo] = useState({
    name: "",
    email: "",
    phone: "",
    inquiry: ""
  });
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Open chat automatically after 15 seconds if it hasn't been opened
    const timer = setTimeout(() => {
      if (localStorage.getItem('chatShown') !== 'true') {
        setIsOpen(true);
        localStorage.setItem('chatShown', 'true');
        
        // Add a welcome message
        const botMessage: Message = {
          text: "👋 Hello! I'm XTech's virtual assistant. I can help you learn about our services or schedule a consultation. What can I help you with today?",
          isBot: true,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botMessage]);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

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
    
    // Check for booking/contact keywords
    const bookingKeywords = ['book', 'schedule', 'appointment', 'meet', 'consultation'];
    const contactKeywords = ['contact', 'call', 'email', 'talk', 'expert'];
    
    if (bookingKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      // Offer booking option
      setTimeout(() => {
        const botResponse: Message = {
          text: "I can help you schedule a consultation with one of our experts. Would you like to book an appointment now?",
          isBot: true,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, botResponse]);
        setExpertRequested(true);
      }, 600);
      return;
    }
    
    if (contactKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      // Show contact form
      setTimeout(() => {
        const botResponse: Message = {
          text: "I'd be happy to connect you with one of our experts. Could you provide some information so we can reach out to you?",
          isBot: true,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, botResponse]);
        setTimeout(() => setShowLeadForm(true), 500);
      }, 600);
      return;
    }
    
    // Process standard responses with a slight delay
    setTimeout(() => {
      const responseText = findResponse(text, expertRequested);
      
      // Check if we're using the default response that asks about experts
      if (responseText.includes("Would you like to speak with one of our experts")) {
        setExpertRequested(true);
      }
      
      // When user says yes, show booking options
      if (expertRequested && (text.toLowerCase() === "yes" || text.toLowerCase() === "y")) {
        const botResponse: Message = {
          text: "Great! You have a few options to connect with our experts:",
          isBot: true,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, botResponse]);
        
        // Small delay for the options
        setTimeout(() => {
          setShowLeadForm(true);
        }, 500);
        
        return;
      }
      
      const botResponse: Message = {
        text: responseText,
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botResponse]);
    }, 600);
  };
  
  const handleLeadFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setLeadInfo(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  const handleLeadFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate form based on step
    if (formStep === 0 && !leadInfo.name) {
      toast({
        title: "Name is required",
        description: "Please enter your name to continue.",
        variant: "destructive",
      });
      return;
    }
    
    if (formStep === 1 && (!leadInfo.email || !isValidEmail(leadInfo.email))) {
      toast({
        title: "Valid email is required",
        description: "Please enter a valid email address to continue.",
        variant: "destructive",
      });
      return;
    }
    
    if (formStep === 2 && !leadInfo.phone) {
      toast({
        title: "Phone number is required",
        description: "Please enter your phone number to continue.",
        variant: "destructive",
      });
      return;
    }
    
    // Move to next step if not the last step
    if (formStep < 3) {
      setFormStep(formStep + 1);
      return;
    }
    
    // Submit the form
    try {
      // Try to save lead to Supabase if connected
      try {
        const { error } = await supabase
          .from('leads')
          .insert([
            { 
              name: leadInfo.name,
              email: leadInfo.email,
              phone: leadInfo.phone,
              inquiry: leadInfo.inquiry || 'Chat inquiry',
              source: 'chat',
              status: 'new'
            }
          ]);
          
        if (error) {
          console.error("Error saving lead to Supabase:", error);
          // Continue with UI flow even if DB save fails
        }
      } catch (err) {
        console.error("Supabase error:", err);
        // Continue with UI flow
      }
      
      // Hide the form
      setShowLeadForm(false);
      
      // Show thank you message
      const thankYouMessage: Message = {
        text: `Thank you, ${leadInfo.name}! Our team will contact you shortly at ${leadInfo.email} or ${leadInfo.phone}. Would you like to schedule a specific time for a consultation now?`,
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, thankYouMessage]);
      
      // Reset the form
      setFormStep(0);
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast({
        title: "Error submitting form",
        description: "There was a problem submitting your information. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleBookNow = () => {
    // Close the chat and navigate to booking page
    setIsOpen(false);
    navigate("/contact?tab=booking");
  };
  
  const handleCallNow = () => {
    window.location.href = "tel:+97412345678";
  };
  
  const handleEmailNow = () => {
    window.location.href = "mailto:XtechInfoQat@gmail.com";
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
      <AnimatePresence>
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
            
            {showLeadForm ? (
              <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-transparent to-black/20">
                <div className="bg-white/5 rounded-lg p-4 mb-4">
                  <h3 className="text-white font-medium mb-2">Connect with Our Experts</h3>
                  <p className="text-white/70 text-sm mb-4">
                    Please provide your contact information and we'll reach out to you shortly.
                  </p>
                  
                  <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                    {formStep === 0 && (
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-1">
                          Your Name*
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={leadInfo.name}
                          onChange={handleLeadFormChange}
                          className="w-full p-2 rounded-md bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter your name"
                        />
                      </div>
                    )}
                    
                    {formStep === 1 && (
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
                          Email Address*
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={leadInfo.email}
                          onChange={handleLeadFormChange}
                          className="w-full p-2 rounded-md bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter your email"
                        />
                      </div>
                    )}
                    
                    {formStep === 2 && (
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-1">
                          Phone Number*
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          value={leadInfo.phone}
                          onChange={handleLeadFormChange}
                          className="w-full p-2 rounded-md bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    )}
                    
                    {formStep === 3 && (
                      <div>
                        <label htmlFor="inquiry" className="block text-sm font-medium text-white/80 mb-1">
                          Inquiry Details (Optional)
                        </label>
                        <textarea
                          id="inquiry"
                          value={leadInfo.inquiry}
                          onChange={handleLeadFormChange}
                          rows={3}
                          className="w-full p-2 rounded-md bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                          placeholder="Tell us more about your needs"
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-between pt-2">
                      {formStep > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setFormStep(formStep - 1)}
                          className="text-white/70"
                        >
                          Back
                        </Button>
                      )}
                      
                      <Button
                        type="button"
                        onClick={handleLeadFormSubmit}
                        className="bg-purple-600 hover:bg-purple-700 text-white ml-auto"
                      >
                        {formStep < 3 ? 'Continue' : 'Submit'}
                        <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </div>
                  </form>
                </div>
                
                <div className="text-center mt-4">
                  <p className="text-white/60 text-sm mb-4">Prefer another way to reach us?</p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={handleBookNow}
                      variant="outline"
                      size="sm"
                      className="bg-transparent border border-purple-500/50 text-white hover:bg-purple-500/20"
                    >
                      <Calendar size={14} className="mr-1" /> Book Now
                    </Button>
                    <Button
                      onClick={handleCallNow}
                      variant="outline"
                      size="sm"
                      className="bg-transparent border border-purple-500/50 text-white hover:bg-purple-500/20"
                    >
                      <Phone size={14} className="mr-1" /> Call Now
                    </Button>
                    <Button
                      onClick={handleEmailNow}
                      variant="outline"
                      size="sm"
                      className="bg-transparent border border-purple-500/50 text-white hover:bg-purple-500/20"
                    >
                      <Mail size={14} className="mr-1" /> Email
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <MessageList messages={messages} />
                <InputArea onSendMessage={handleSendMessage} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SmartAssistant;
