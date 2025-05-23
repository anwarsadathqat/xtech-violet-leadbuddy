
import React, { useState, useEffect, useRef } from 'react';
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
        content: "👋 Hi there! I'm LeadBuddy, your AI assistant for lead management. How can I help you today? You can ask me about lead performance, request me to draft follow-up emails, or get insights on your leads.",
        timestamp: new Date()
      }
    ]);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: newMessage,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage('');
    setIsTyping(true);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      generateAIResponse(newMessage);
    }, 1000);
  };

  const generateAIResponse = (userQuery: string) => {
    let response = '';
    
    // Simple rule-based responses for MVP
    if (userQuery.toLowerCase().includes('follow up') || userQuery.toLowerCase().includes('email')) {
      response = "I'd be happy to help draft a follow-up email. Here's a template you could use:\n\nSubject: Following up on our IT services discussion\n\nHello [Lead Name],\n\nI hope this email finds you well. I wanted to follow up on our previous conversation about how XTech can help optimize your IT infrastructure.\n\nBased on what you shared about [specific pain point], I think our [specific service] would be particularly beneficial for your team.\n\nWould you be available for a quick 15-minute call this week to discuss this further?\n\nBest regards,\n[Your Name]\nXTech Solutions";
    } else if (userQuery.toLowerCase().includes('lead') && (userQuery.toLowerCase().includes('perform') || userQuery.toLowerCase().includes('stat') || userQuery.toLowerCase().includes('analytic'))) {
      response = "Based on recent data, your lead conversion rate is trending at 24%, which is 5% higher than last month. Your top-performing lead sources are: 1) Website Contact Form, 2) LinkedIn Campaigns, and 3) Referrals.\n\nI've noticed that leads who mention 'cloud migration' convert 35% higher than others. Would you like me to prepare a more detailed analytics report?";
    } else if (userQuery.toLowerCase().includes('insight') || userQuery.toLowerCase().includes('trend')) {
      response = "I've analyzed your recent leads and noticed some interesting trends:\n\n1. Leads from the financial sector are showing higher interest in cybersecurity services\n2. Conversion time has decreased by 15% when we send personalized follow-ups within 24 hours\n3. There's growing interest in our cloud migration services among mid-sized companies\n\nWould you like me to focus on any of these areas for a deeper analysis?";
    } else if (userQuery.toLowerCase().includes('schedule') || userQuery.toLowerCase().includes('meeting') || userQuery.toLowerCase().includes('call')) {
      response = "I'll help you schedule a meeting with this lead. Based on their engagement level and inquiry about IT consulting services, I recommend scheduling a discovery call with one of your senior consultants. \n\nShould I prepare a meeting agenda and send a calendar invitation for sometime next week?";
    } else {
      response = "Thanks for your query! While I'm still learning, I can help you with lead management tasks like drafting follow-up emails, analyzing lead performance, scheduling meetings, or providing insights on conversion trends. Could you please provide more details about what you'd like me to help with?";
    }
    
    // Add AI response to messages
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'assistant',
      content: response,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, aiMessage]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-xtech-purple to-xtech-blue flex items-center justify-center">
            🤖
          </div>
          <div>
            <h3 className="font-bold text-white">LeadBuddy</h3>
            <p className="text-xs text-gray-400">Your AI Lead Management Assistant</p>
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
                <span>LeadBuddy is typing...</span>
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
            placeholder="Ask LeadBuddy something..."
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
          You can ask LeadBuddy to draft emails, analyze leads, or provide insights
        </div>
      </div>
    </div>
  );
};

export default LeadBuddyChat;
