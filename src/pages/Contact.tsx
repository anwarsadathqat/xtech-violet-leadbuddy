
import React, { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
import ContactForm from "@/components/ContactForm";
import BookingCalendar from "@/components/BookingCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Mail, MapPin, Calendar, MessageSquare } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  useEffect(() => {
    // Get the tab parameter from the URL
    const tab = searchParams.get("tab");
    
    // Check for email status
    const emailStatus = searchParams.get("email");
    if (emailStatus === "failed") {
      toast({
        title: "Email Delivery Issue",
        description: "Your booking was confirmed, but there was an issue sending the confirmation email. Our team has been notified.",
        variant: "destructive",
        duration: 7000,
      });
    } else if (emailStatus === "success") {
      toast({
        title: "Booking Confirmed!",
        description: "A confirmation email has been sent to your inbox.",
        duration: 5000,
      });
    }
  }, [searchParams, toast]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <SectionTitle 
              title="Contact & Schedule Service" 
              subtitle="Get in touch with our team to discuss your project or schedule a consultation"
              align="center"
            />
          </div>
        </div>
      </section>
      
      {/* Contact Information */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-xtech-dark-purple p-6 rounded-lg flex flex-col items-center text-center">
              <Phone size={32} className="text-xtech-blue mb-4" />
              <h3 className="text-xl font-bold mb-2">Phone</h3>
              <p className="text-xtech-light-gray">+974 1234 5678</p>
            </div>
            
            <div className="bg-xtech-dark-purple p-6 rounded-lg flex flex-col items-center text-center">
              <Mail size={32} className="text-xtech-blue mb-4" />
              <h3 className="text-xl font-bold mb-2">Email</h3>
              <a href="mailto:XtechInfoQat@gmail.com" className="text-xtech-light-gray hover:text-xtech-blue">
                XtechInfoQat@gmail.com
              </a>
            </div>
            
            <div className="bg-xtech-dark-purple p-6 rounded-lg flex flex-col items-center text-center">
              <MapPin size={32} className="text-xtech-blue mb-4" />
              <h3 className="text-xl font-bold mb-2">Address</h3>
              <p className="text-xtech-light-gray">XTech HQ, Doha, Qatar</p>
            </div>

            <div className="bg-xtech-dark-purple p-6 rounded-lg flex flex-col items-center text-center">
              <Calendar size={32} className="text-xtech-blue mb-4" />
              <h3 className="text-xl font-bold mb-2">Hours</h3>
              <p className="text-xtech-light-gray">Sun-Thu: 9am-6pm</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Contact Form and Booking Calendar Tabs */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Tabs defaultValue={searchParams.get("tab") || "message"} className="max-w-4xl mx-auto">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="message" className="flex items-center gap-2 text-lg py-3">
                <MessageSquare size={18} />
                Send Message
              </TabsTrigger>
              <TabsTrigger value="booking" className="flex items-center gap-2 text-lg py-3">
                <Calendar size={18} />
                Schedule Consultation
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="message">
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
                  <ContactForm />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold mb-6">Our Location</h2>
                  <div className="rounded-lg overflow-hidden h-[400px]">
                    <iframe
                      src="https://maps.google.com/maps?q=Doha,+Qatar&z=13&output=embed"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="XTech Office Location"
                    ></iframe>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="booking">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold mb-3">Schedule a Consultation</h2>
                <p className="text-xtech-light-gray max-w-2xl mx-auto">
                  Choose a convenient date and time for your consultation with our IT experts. 
                  We'll discuss your needs and provide tailored solutions for your business.
                </p>
              </div>
              <BookingCalendar />
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      {/* Office Hours */}
      <section className="py-8 bg-xtech-dark-purple">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Office Hours</h2>
          <p className="text-xtech-light-gray mb-2">Sunday - Thursday: 9:00 AM - 6:00 PM</p>
          <p className="text-xtech-light-gray">Saturday: 10:00 AM - 2:00 PM</p>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Contact;
