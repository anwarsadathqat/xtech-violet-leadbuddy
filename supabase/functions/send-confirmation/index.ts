
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { google } from "npm:googleapis@126.0.1";

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

// Configure Gmail API
const setupGmailClient = () => {
  const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
  const REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN");
  
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error("Gmail API credentials are not configured properly");
  }

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
};

// Create email content in base64 encoded format that's URL-safe
const createEmail = (to: string, subject: string, html: string): string => {
  const emailLines = [
    `To: ${to}`,
    'From: XTech Consulting <XtechInfoQat@gmail.com>',
    'Content-Type: text/html; charset=utf-8',
    `Subject: ${subject}`,
    '',
    html
  ];
  
  // Base64 encode the email content (using URL-safe base64 encoding)
  const rawEmail = Buffer.from(emailLines.join('\r\n')).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return rawEmail;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, date, timeSlot, service, phone, notes }: BookingConfirmationRequest = await req.json();
    
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
    
    try {
      // Set up Gmail client
      const gmail = setupGmailClient();
      
      // Create the email content
      const rawEmail = createEmail(
        email, 
        `Your ${service} Consultation is Confirmed`, 
        html
      );
      
      // Add more detailed logging
      console.log("Setting up Gmail API with client ID:", 
                  Deno.env.get("GMAIL_CLIENT_ID")?.substring(0, 8) + "...");
      console.log("Sending email to:", email);
      
      // Send email via Gmail API
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: rawEmail
        }
      });
      
      console.log("Email confirmation sent successfully:", response.data);
      
      return new Response(JSON.stringify({ success: true, data: response.data }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (emailError: any) {
      console.error("Error sending email:", emailError);
      
      // Add more detailed error logging
      if (emailError.response) {
        console.error("API response error:", {
          status: emailError.response.status,
          statusText: emailError.response.statusText,
          data: emailError.response.data
        });
      }
      
      // Return a success response to the client even if email fails
      // This way the booking is still confirmed in the system
      return new Response(
        JSON.stringify({ 
          success: true, 
          emailSent: false,
          message: "Booking confirmed but email could not be sent. Please contact support."
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in booking confirmation function:", error);
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
