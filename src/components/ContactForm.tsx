
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ContactForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'Consultancy',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Store the lead in the database
      try {
        const { error } = await supabase.functions.invoke('store-lead', {
          body: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone, // Now passing phone number
            inquiry: formData.message,
            source: "contact_form"
          }
        });
        
        if (error) {
          console.error("Error storing lead:", error);
        }
      } catch (storageError) {
        console.error("Error storing lead data:", storageError);
        // Continue with email even if lead storage fails
      }
      
      // Send contact email notification
      const response = await supabase.functions.invoke('send-confirmation', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone, // Now passing phone number
          service: formData.service,
          message: formData.message,
          isContactForm: true
        }
      });
      
      console.log("Email function response:", response);
      
      if (response.error) {
        throw new Error(response.error.message || "Error sending email");
      }
      
      toast({
        title: "Message sent successfully!",
        description: "We've received your message and will get back to you soon.",
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: 'Consultancy',
        message: ''
      });
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block mb-2 text-sm font-medium">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-3 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-xtech-blue"
          placeholder="Your name"
          required
        />
      </div>
      
      <div>
        <label htmlFor="email" className="block mb-2 text-sm font-medium">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-3 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-xtech-blue"
          placeholder="your@email.com"
          required
        />
      </div>
      
      <div>
        <label htmlFor="phone" className="block mb-2 text-sm font-medium">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-3 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-xtech-blue"
          placeholder="Your phone number"
        />
      </div>
      
      <div>
        <label htmlFor="service" className="block mb-2 text-sm font-medium">
          Service Needed
        </label>
        <select
          id="service"
          value={formData.service}
          onChange={handleChange}
          className="w-full p-3 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-xtech-blue"
        >
          <option>Consultancy</option>
          <option>Support</option>
          <option>Outsourcing</option>
          <option>Other</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="message" className="block mb-2 text-sm font-medium">
          Message
        </label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className="w-full p-3 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-xtech-blue resize-none"
          placeholder="How can we help you?"
          required
        />
      </div>
      
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-6 bg-gradient-to-r from-xtech-purple to-xtech-blue text-white rounded-md hover:from-xtech-blue hover:to-xtech-purple transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
        <Mail className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default ContactForm;
