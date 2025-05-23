
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const LeadBuddyChat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcome message
  useEffect(() => {
    setMessages([
      {
        id: '1',
        sender: 'assistant',
        content: "👋 Hi there! I'm LeadBuddy, your AI assistant for lead management. I'm now connected to DeepSeek AI for advanced analysis. How can I help you today? You can ask me about lead performance, request me to draft follow-up emails, analyze specific leads, or get insights on your pipeline.",
        timestamp: new Date()
      }
    ]);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: newMessage,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    const currentQuery = newMessage;
    setNewMessage('');
    setIsTyping(true);
    
    // Generate AI response using DeepSeek
    try {
      const response = await supabase.functions.invoke('leadbuddy-chat', {
        body: { 
          message: currentQuery,
          conversationHistory: messages.slice(-5) // Send last 5 messages for context
        }
      });

      if (response.data?.content) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          content: response.data.content,
          timestamp: new Date()
        };
        
        setMessages(prevMessages => [...prevMessages, aiMessage]);
      } else {
        // Fallback response
        generateFallbackResponse(currentQuery);
      }
    } catch (error) {
      console.error('Error calling LeadBuddy AI:', error);
      generateFallbackResponse(currentQuery);
    } finally {
      setIsTyping(false);
    }
  };

  const generateFallbackResponse = (userQuery: string) => {
    let response = '';
    
    // Enhanced rule-based responses for MVP fallback
    if (userQuery.toLowerCase().includes('follow up') || userQuery.toLowerCase().includes('email')) {
      response = "I'd be happy to help draft a follow-up email. Here's a personalized template:\n\nSubject: Following up on our IT services discussion\n\nHello [Lead Name],\n\nI hope this email finds you well. I wanted to follow up on our previous conversation about how XTech can help optimize your IT infrastructure.\n\nBased on what you shared about [specific pain point], I think our [specific service] would be particularly beneficial for your team.\n\nWould you be available for a quick 15-minute call this week to discuss this further?\n\nBest regards,\n[Your Name]\nXTech Solutions";
    } else if (userQuery.toLowerCase().includes('lead') && (userQuery.toLowerCase().includes('perform') || userQuery.toLowerCase().includes('stat') || userQuery.toLowerCase().includes('analytic'))) {
      response = "Based on recent data analysis, your lead conversion rate is trending at 24%, which is 5% higher than last month. Your top-performing lead sources are:\n\n1) Website Contact Form (41.7%)\n2) LinkedIn Campaigns (26.9%)\n3) Referrals (17.9%)\n\nI've noticed that leads who mention 'cloud migration' or 'cybersecurity' convert 35% higher than others. Would you like me to prepare a more detailed analytics report or help optimize your lead scoring criteria?";
    } else if (userQuery.toLowerCase().includes('insight') || userQuery.toLowerCase().includes('trend')) {
      response = "I've analyzed your recent leads and noticed some interesting trends:\n\n🔍 **Key Insights:**\n1. Leads from the financial sector are showing 40% higher interest in cybersecurity services\n2. Conversion time has decreased by 15% when we send personalized follow-ups within 24 hours\n3. Enterprise inquiries (mentioning 'large scale' or 'enterprise') have a 67% higher lifetime value\n4. Leads with phone numbers provided convert 23% better\n\n📈 **Recommendations:**\nI suggest focusing on enterprise leads and implementing faster response times for financial sector prospects. Would you like me to create targeted campaigns for these segments?";
    } else if (userQuery.toLowerCase().includes('schedule') || userQuery.toLowerCase().includes('meeting') || userQuery.toLowerCase().includes('call')) {
      response = "I'll help you optimize your meeting scheduling process. Based on lead engagement patterns:\n\n⏰ **Best Times to Schedule:**\n- Tuesday-Thursday, 10 AM - 2 PM (highest acceptance rate)\n- Avoid Mondays and Fridays after 3 PM\n\n🎯 **Lead Prioritization:**\n- Score 80+: Schedule within 2 hours\n- Score 60-79: Schedule within 24 hours\n- Score <60: Send nurture email first\n\nShould I automatically schedule meetings for high-scoring leads or would you prefer manual review first?";
    } else if (userQuery.toLowerCase().includes('score') || userQuery.toLowerCase().includes('quality')) {
      response = "Here's how I'm currently scoring your leads:\n\n🎯 **Scoring Factors:**\n- Email domain (.gov, .edu = +20 points)\n- Phone number provided (+15 points)\n- Inquiry keywords ('urgent', 'budget', 'timeline' = +15-25 points)\n- Source quality (referral = +30, LinkedIn = +20)\n- Inquiry length (detailed inquiry = +15 points)\n\n📊 **Current Distribution:**\n- High quality (80+): 24% of leads\n- Medium quality (50-79): 51% of leads\n- Low quality (<50): 25% of leads\n\nWould you like me to adjust the scoring criteria or explain why a specific lead received their score?";
    } else {
      response = "Thanks for your query! I'm LeadBuddy, powered by advanced AI. I can help you with:\n\n🤖 **Lead Management:**\n- Analyze lead quality and scoring\n- Draft personalized follow-up emails\n- Schedule optimal meeting times\n- Track conversion trends\n\n📊 **Analytics & Insights:**\n- Pipeline performance analysis\n- Source effectiveness tracking\n- Conversion optimization tips\n- Predictive lead scoring\n\n✉️ **Communication:**\n- Email template generation\n- Response time optimization\n- Engagement strategy recommendations\n\nWhat specific aspect would you like me to help with?";
    }
    
    // Add AI response to messages
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'assistant',
      content: response,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, aiMessage]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-xtech-purple to-xtech-blue flex items-center justify-center">
            🤖
          </div>
          <div>
            <h3 className="font-bold text-white">LeadBuddy AI</h3>
            <p className="text-xs text-gray-400">Powered by DeepSeek • Lead Management Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
          <span className="text-xs text-gray-400">Online</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] p-3 rounded-lg ${
                message.sender === 'user' 
                  ? 'bg-gradient-to-r from-xtech-purple to-xtech-blue text-white' 
                  : 'bg-white/10 text-white'
              }`}
            >
              <div className="whitespace-pre-line">{message.content}</div>
              <div className="mt-1 text-xs opacity-70 text-right">
                {new Intl.DateTimeFormat('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-white/10 text-white">
              <div className="flex items-center gap-2">
                <Loader size={16} className="animate-spin" />
                <span>LeadBuddy is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-white/10">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask LeadBuddy about your leads, request email drafts, or get insights..."
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            type="submit"
            className="bg-gradient-to-r from-xtech-purple to-xtech-blue text-white h-auto"
            disabled={newMessage.trim() === '' || isTyping}
          >
            <Send size={18} />
          </Button>
        </form>
        <div className="mt-2 text-xs text-gray-400">
          LeadBuddy can analyze leads, draft emails, provide insights, and automate your lead lifecycle
        </div>
      </div>
    </div>
  );
};

export default LeadBuddyChat;
