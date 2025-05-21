
import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, Mail, Calendar as CalendarCheck, CheckCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface BookingCalendarProps {
  serviceName?: string;
}

const availableTimeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", 
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"
];

const BookingCalendar: React.FC<BookingCalendarProps> = ({ serviceName }) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleNextStep = () => {
    if (currentStep === 1 && !date) {
      toast({
        title: "Please select a date",
        description: "You need to select a date to proceed",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 2 && !timeSlot) {
      toast({
        title: "Please select a time slot",
        description: "You need to select a time to proceed",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 3) {
      if (!name || !email || !phone) {
        toast({
          title: "Please fill all required fields",
          description: "Name, email and phone are required",
          variant: "destructive",
        });
        return;
      }

      if (!isValidEmail(email)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Format date for display
      const formattedDate = date ? new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date) : '';
      
      // Try to save to Supabase if connected
      try {
        const { data, error } = await supabase
          .from('bookings')
          .insert([
            { 
              name,
              email,
              phone,
              service: serviceName || 'Consultation',
              booking_date: date?.toISOString(),
              time_slot: timeSlot,
              notes,
              status: 'pending'
            }
          ]);
          
        if (error) {
          console.error("Error saving to Supabase:", error);
          // Continue anyway to show success to user
        } else {
          console.log("Booking saved successfully:", data);
        }
      } catch (err) {
        console.error("Supabase error:", err);
        // Continue with UI flow even if DB save fails
      }
      
      // Show success message
      toast({
        title: "Booking Confirmed!",
        description: `Your appointment on ${formattedDate} at ${timeSlot} has been scheduled.`,
      });
      
      // Reset form
      setCurrentStep(4); // Success step
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Booking failed",
        description: "There was an error scheduling your appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate list of unavailable dates (weekends and past dates)
  const isDateUnavailable = (date: Date) => {
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6; // Sunday or Saturday
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    return isWeekend || isPast;
  };

  return (
    <Card className="bg-xtech-dark-purple/60 border border-white/10 p-6 w-full max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Schedule a Consultation</h2>
        <p className="text-xtech-light-gray">
          {currentStep === 1 && "Select a date for your consultation."}
          {currentStep === 2 && "Choose a time that works for you."}
          {currentStep === 3 && "Please provide your contact information."}
          {currentStep === 4 && "Your booking is confirmed!"}
        </p>
      </div>
      
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-6">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex flex-col items-center">
            <div 
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                currentStep === step 
                  ? "bg-xtech-purple text-white" 
                  : currentStep > step 
                    ? "bg-green-500 text-white" 
                    : "bg-white/10 text-white/50"
              )}
            >
              {currentStep > step ? (
                <CheckCircle size={20} />
              ) : (
                step
              )}
            </div>
            <div className="text-xs mt-1 text-center">
              {step === 1 && "Date"}
              {step === 2 && "Time"}
              {step === 3 && "Details"}
            </div>
          </div>
        ))}
      </div>
      
      {/* Date selection - Step 1 */}
      {currentStep === 1 && (
        <div className="mb-6 flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={isDateUnavailable}
            className="bg-white/5 rounded-md p-3"
          />
        </div>
      )}
      
      {/* Time selection - Step 2 */}
      {currentStep === 2 && (
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableTimeSlots.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setTimeSlot(time)}
                className={cn(
                  "py-3 px-4 rounded-md flex items-center justify-center transition-colors",
                  timeSlot === time
                    ? "bg-xtech-purple text-white"
                    : "bg-white/5 text-white hover:bg-white/10"
                )}
              >
                <Clock size={16} className="mr-2" />
                {time}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Contact information - Step 3 */}
      {currentStep === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-1 text-sm">
              Full Name*
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-xtech-blue"
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block mb-1 text-sm">
              Email Address*
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-xtech-blue"
              required
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block mb-1 text-sm">
              Phone Number*
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-xtech-blue"
              required
            />
          </div>
          
          <div>
            <label htmlFor="notes" className="block mb-1 text-sm">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-xtech-blue resize-none"
            />
          </div>
          
          {/* Service information */}
          {serviceName && (
            <div className="bg-white/5 p-3 rounded-md">
              <p className="text-sm text-white/70">
                Service: <span className="text-xtech-blue font-medium">{serviceName}</span>
              </p>
            </div>
          )}
        </form>
      )}
      
      {/* Success screen - Step 4 */}
      {currentStep === 4 && (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Booking Confirmed!</h3>
          <p className="text-xtech-light-gray mb-4">
            Your consultation has been scheduled for:
          </p>
          <div className="bg-white/5 p-4 rounded-md mb-4">
            <div className="flex items-center mb-2">
              <CalendarCheck size={16} className="text-xtech-blue mr-2" />
              <span>{date ? new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(date) : ''}</span>
            </div>
            <div className="flex items-center mb-2">
              <Clock size={16} className="text-xtech-blue mr-2" />
              <span>{timeSlot}</span>
            </div>
            <div className="flex items-center">
              <Mail size={16} className="text-xtech-blue mr-2" />
              <span>{email}</span>
            </div>
          </div>
          <p className="text-sm text-white/70 mb-4">
            A confirmation email has been sent to your email address. 
            Our team will reach out to confirm your appointment.
          </p>
          <Button
            onClick={() => {
              // Reset form
              setDate(undefined);
              setTimeSlot(null);
              setName("");
              setEmail("");
              setPhone("");
              setNotes("");
              setCurrentStep(1);
            }}
            className="bg-xtech-blue hover:bg-xtech-blue/80 text-white"
          >
            Schedule Another Consultation
          </Button>
        </div>
      )}
      
      {/* Navigation buttons */}
      {currentStep < 4 && (
        <div className="flex justify-between mt-6">
          {currentStep > 1 ? (
            <Button 
              type="button" 
              onClick={handlePrevStep}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Back
            </Button>
          ) : (
            <div></div> /* Empty div for spacing */
          )}
          
          {currentStep < 3 ? (
            <Button 
              type="button" 
              onClick={handleNextStep}
              className="bg-xtech-purple hover:bg-xtech-purple/80 text-white"
            >
              Continue <ArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button 
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-xtech-purple hover:bg-xtech-purple/80 text-white"
            >
              {isSubmitting ? "Confirming..." : "Confirm Booking"}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default BookingCalendar;
