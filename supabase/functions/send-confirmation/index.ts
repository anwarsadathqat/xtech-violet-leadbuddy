
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  name: string;
  email: string;
  date: string;
  timeSlot: string;
  service: string;
  phone: string;
  notes?: string;
}

// Initialize Resend client
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  console.log("Booking confirmation request received");
  console.log("Request method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Parsing request body...");
    const requestBody = await req.json();
    console.log("Request body received:", JSON.stringify(requestBody, null, 2));
    
    const { name, email, date, timeSlot, service, phone, notes }: BookingConfirmationRequest = requestBody;
    console.log(`Processing booking confirmation for ${name} (${email}) - ${date} at ${timeSlot}`);
    
    // Format email content
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background-color: #6c22d8; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">Booking Confirmation</h1>
        </div>
        
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Hello ${name},</p>
          <p>Thank you for scheduling a consultation with XTech Consulting. Your appointment has been confirmed:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
            <p><strong>Service:</strong> ${service}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
          </div>
          
          <p>We've saved your contact information:</p>
          <ul>
            <li>Email: ${email}</li>
            <li>Phone: ${phone}</li>
            ${notes ? `<li>Notes: ${notes}</li>` : ''}
          </ul>
          
          <p>If you need to reschedule or have any questions, please contact our support team at XtechInfoQat@gmail.com.</p>
          
          <p>We look forward to speaking with you!</p>
          
          <p>Best regards,<br>XTech Consulting Team</p>
        </div>
        
        <div style="text-align: center; padding-top: 20px; color: #777; font-size: 12px;">
          <p>© ${new Date().getFullYear()} XTech Consulting. All rights reserved.</p>
        </div>
      </div>
    `;
    
    console.log("Email HTML content prepared");
    
    try {
      console.log("Sending email with Resend...");
      
      // Attempt to send email with Resend
      const emailResponse = await resend.emails.send({
        from: "XTech Consulting <onboarding@resend.dev>",
        to: [email],
        subject: `Your ${service} Consultation is Confirmed`,
        html: html,
      });
      
      console.log("Resend API response:", JSON.stringify(emailResponse, null, 2));
      
      if (emailResponse.error) {
        throw new Error(`Resend API error: ${emailResponse.error.message}`);
      }
      
      console.log("Email successfully sent!");
      return new Response(
        JSON.stringify({ 
          success: true, 
          emailSent: true,
          message: "Email confirmation sent successfully",
          data: emailResponse
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } catch (sendError: any) {
      // Detailed error logging for email sending failures
      console.error("Error sending email via Resend:", sendError);
      
      if (sendError.response) {
        console.error("Resend API error response:", {
          status: sendError.response.status,
          statusText: sendError.response.statusText,
          data: JSON.stringify(sendError.response.data)
        });
      }
      
      // Return a response indicating booking success but email failure
      return new Response(
        JSON.stringify({ 
          success: true, 
          emailSent: false,
          message: "Booking confirmed but email could not be sent",
          error: sendError.message || "Unknown error sending email"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error) {
    console.error("General error in booking confirmation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        emailSent: false,
        error: error instanceof Error ? error.message : "Unknown error in processing request" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
