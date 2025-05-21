
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, date, timeSlot, service, phone, notes }: BookingConfirmationRequest = await req.json();

    // Create a nicely formatted email with booking information
    const emailResponse = await resend.emails.send({
      from: "XTech Consulting <onboarding@resend.dev>",
      to: [email],
      subject: `Your ${service} Consultation is Confirmed`,
      html: `
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
            
            <p>If you need to reschedule or have any questions, please contact our support team at support@xtech-consulting.com.</p>
            
            <p>We look forward to speaking with you!</p>
            
            <p>Best regards,<br>XTech Consulting Team</p>
          </div>
          
          <div style="text-align: center; padding-top: 20px; color: #777; font-size: 12px;">
            <p>© ${new Date().getFullYear()} XTech Consulting. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    console.log("Email confirmation sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending booking confirmation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
